"""
Simple Multi-Agent Topic Generator Agent using Google ADK
"""

import os
import requests
import json
import re
import sys
from google.adk.agents import LlmAgent, SequentialAgent
from google.adk.tools import google_search
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from exa_py import Exa
from convex import ConvexClient
from google import genai
from google.genai import types

exa = Exa(api_key = os.environ.get("EXA_API_KEY"))

# =============================================================================
# TOOL AND HELPER FUNCTIONS
# =============================================================================
def exa_search(query: str, result_category: str) -> dict:
    """
    Args:
        query: Search query
        result_category: Category of result
        
    Returns:
        dict: Search results with text and source URLs
    """
    try:
        result = exa.search_and_contents(
            query,
            type = "auto",
            num_results = int(os.environ.get("EXA_NUM_RESULTS", 5)),
            text = {
                "max_characters": 2048
            },
            **({"category": "news"} if result_category == "news" else {}),
        )
    
        return result
    except Exception as e:
        print(f"Error in exa_search: {e}")
        return {}

def serper_image_search(query: str) -> dict:
    """    
    Args:
        query: Image search query
        num_images: Number of images to return
        
    Returns:
        dict: Image search results
    """
    try:
        url = "https://google.serper.dev/images"

        payload = json.dumps({
            "q": query
        })

        headers = {
            'X-API-KEY': os.environ.get("SERPER_API_KEY"),
            'Content-Type': 'application/json'
        }

        response = requests.request("POST", url, headers=headers, data=payload)

        return response.json()
    except Exception as e:
        print(f"Error in serper_image_search: {e}")
        return {}

def generate_embedding(text: str) -> List[float]:
    """
    Generate an embedding for the given text.
    
    Args:
        text: The text to embed
        
    Returns:
        List[float]: The embedding vector (768 dimensions)
    """
    try:
        client = genai.Client()
        result = client.models.embed_content(
            model="gemini-embedding-001",
            contents=text,
            config=types.EmbedContentConfig(task_type="SEMANTIC_SIMILARITY", output_dimensionality=768)
        )
        return result.embeddings[0].values
        
    except Exception as e:
        print(f"Error generating embedding: {e}")
        # Return a zero vector as fallback
        return [0.0] * 1536


def get_categories_from_convex() -> dict:
    """
    Get all available categories from Convex database
    
    Returns:
        dict: Result with categories list if successful, error message if failed
    """
    try:
        # Get Convex URL from environment
        convex_url = os.environ.get("CONVEX_URL")
        if not convex_url:
            return {"success": False, "error": "CONVEX_URL environment variable not set"}
        
        # Initialize Convex client
        client = ConvexClient(convex_url)
        
        # Get all categories
        categories = client.query("categories:getCategories", {})
        
        return {
            "success": True,
            "categories": categories
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Error fetching categories: {str(e)}"
        }

def create_slug(title: str) -> str:
    """Create a URL-friendly slug from a title"""
    slug = title.lower().strip()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'\s+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    return slug.strip('-')


def estimate_read_time(text: str) -> int:
    """Estimate reading time in minutes based on word count"""
    words = len(text.split())
    return max(1, round(words / 225))


def validate_category_id(category_id: str) -> Optional[str]:
    """
    Validate that the category ID exists, return it if valid, otherwise return 'Other' category ID
    
    Args:
        category_id: The category ID to validate
        
    Returns:
        str: Valid category ID or None if validation fails
    """
    if not category_id:
        return None
    try:
        # Get Convex URL from environment
        convex_url = os.environ.get("CONVEX_URL")
        if not convex_url:
            return None
        
        # Initialize Convex client
        client = ConvexClient(convex_url)
        
        # Get all categories to validate the ID exists
        all_categories = client.query("categories:getCategories", {})
        
        # Check if the provided category_id exists
        for category in all_categories:
            if category["_id"] == category_id:
                return category_id
        
        # If not found, try to find "Other" category
        for category in all_categories:
            if category["name"].lower() == "other":
                return category["_id"]
        
        return None
    except Exception as e:
        print(f"Error validating category: {e}")
        return None


def process_tags(tag_names: List[str]) -> List[str]:
    """
    Process tag names and return clean tag list
    
    Args:
        tag_names: List of tag names
        
    Returns:
        List[str]: Cleaned tag names
    """
    return [tag.strip() for tag in tag_names if tag and tag.strip()]
    
    
def insert_topic_to_convex(agent_output: str) -> dict:
    """
    Insert topic data from agent output into Convex database
    
    Args:
        agent_output: JSON string of the complete agent output containing all necessary data
        
    Returns:
        dict: Result with topic_id if successful, error message if failed
    """
    try:
        # Parse the agent output JSON
        if isinstance(agent_output, str):
            output_data = json.loads(agent_output)
        else:
            output_data = agent_output
        
        # Get Convex URL from environment
        convex_url = os.environ.get("CONVEX_URL")
        if not convex_url:
            return {"success": False, "error": "CONVEX_URL environment variable not set"}
        
        # Initialize Convex client
        client = ConvexClient(convex_url)
        
        # Helper functions are now imported from utilities.py
        
        # Extract data from agent output
        topic_title = output_data.get("topic", "WSIC Topic")
        difficulty = output_data.get("difficulty", "beginner").lower()
        created_by = output_data.get("created_by")
        publish_immediately = output_data.get("publish_immediately", False)
        
        research_brief = output_data.get("research_brief", {})
        research_deep = output_data.get("research_deep", {})
        real_world_impact = output_data.get("real_world_impact", {})
        
        # Handle category, description and tags from agent output
        category_tags_description = output_data.get("category_tags_description", {})
        selected_category_id = category_tags_description.get("selected_category")
        short_description = category_tags_description.get("short_description", "")
        generated_tags = category_tags_description.get("generated_tags", [])
        
        # Get thumbnail data
        thumbnail = output_data.get("thumbnail", {})
        
        # Use short description from agent or fallback to brief research
        description = short_description if short_description else (research_brief.get("text", "")[:500] + "..." if len(research_brief.get("text", "")) > 500 else research_brief.get("text", ""))
        
        # Calculate metadata
        combined_text = (research_brief.get("text", "") + " " + 
                       research_deep.get("text", "") + " " + 
                       real_world_impact.get("content", ""))
        
        word_count = len(combined_text.split())
        estimated_time = estimate_read_time(combined_text)
        
        # Count exercises (only from the blocks we're inserting)
        exercise_count = 0
        if output_data.get("quiz", {}).get("questions"):
            exercise_count += len(output_data["quiz"]["questions"])
        if output_data.get("reorder"):
            exercise_count += 1
        if output_data.get("final_quiz", {}).get("questions"):
            exercise_count += len(output_data["final_quiz"]["questions"])
        
        # Count information blocks
        info_block_count = 0
        if research_brief.get("text"):
            info_block_count += 1
        if research_deep.get("text"):
            info_block_count += 1
        if real_world_impact.get("content"):
            info_block_count += 1
        if output_data.get("flash_cards"):
            info_block_count += 1
        
        # Validate and use agent-selected category ID
        category_id = validate_category_id(selected_category_id) if selected_category_id else None
        
        # Use agent-generated tags
        tags = process_tags(generated_tags) if generated_tags else []
        
        # Collect sources
        sources = []
        if real_world_impact.get("source_urls"):
            sources.extend(real_world_impact["source_urls"])
        
        # Create topic
        topic_data = {
            "title": topic_title,
            "description": description,
            "slug": create_slug(topic_title),
            "difficulty": difficulty,
            "estimatedReadTime": estimated_time,
            "isAIGenerated": True,
            "generationPrompt": json.dumps({"topic": topic_title, "difficulty": difficulty}),
            "sources": sources if sources else None,
            "imageUrl": thumbnail.get("thumbnail_url") if thumbnail.get("thumbnail_url") else None,
            "metadata": {
                "wordCount": word_count,
                "readingLevel": difficulty,
                "estimatedTime": estimated_time,
                "exerciseCount": exercise_count
            }
        }
        
        # Add optional fields
        if category_id:
            topic_data["categoryId"] = category_id
        if tags:
            topic_data["tagIds"] = tags  # Use tagIds to match schema
        if created_by:
            topic_data["createdBy"] = created_by
        
        # Create topic in Convex
        topic_id = client.mutation("topics:createTopic", topic_data)
        
        # Create embedding for semantic search
        embedding_vector = generate_embedding(research_brief["text"])
        client.mutation("embeddings:createEmbedding", {
            "topicId": topic_id,
            "embedding": embedding_vector,
            "contentType": "research_brief",
            "difficulty": difficulty,
            "categoryId": category_id
        })
        
        # Create blocks - only insert specified outputs with type field
        order = 0
        
        # 1. Brief Research Text Block (information type)
        if research_brief.get("text"):
            client.mutation("blocks:createBlock", {
                "topicId": topic_id,
                "type": "information",
                "content": {
                    "type": "text",
                    "data": {
                        "content": {
                            "text": research_brief["text"]
                        },
                        "styleKey": "research_brief"
                    }
                },
                "order": order
            })
            order += 1
        
        # 2. Quiz Exercises (activity type) - Single JSON block
        quiz = output_data.get("quiz", {})
        if quiz.get("questions"):
            # Create a single block containing all quiz questions as JSON
            quiz_data = {
                "type": "quiz",
                "questions": []
            }
            for question_data in quiz["questions"]:
                options = [{"id": str(i), "text": opt} for i, opt in enumerate(question_data.get("options", []))]
                quiz_data["questions"].append({
                    "question": question_data.get("question", ""),
                    "options": options,
                    "correctAnswer": question_data.get("correct_answer", ""),
                    "explanation": question_data.get("explanation", ""),
                    "points": 10
                })
            
            client.mutation("blocks:createBlock", {
                "topicId": topic_id,
                "type": "activity",
                "content": {
                    "type": "exercise",
                    "data": {
                        "exerciseType": "quiz_group",
                        "quizData": quiz_data
                    }
                },
                "order": order
            })
            order += 1
        
        # 3. Deep Research Text Block (information type)
        if research_deep.get("text"):
            client.mutation("blocks:createBlock", {
                "topicId": topic_id,
                "type": "information",
                "content": {
                    "type": "text",
                    "data": {
                        "content": {
                            "text": research_deep["text"]
                        },
                        "styleKey": "research_deep"
                    }
                },
                "order": order
            })
            order += 1
        
        # 4. Reorder Exercise (activity type) - Single JSON block
        reorder = output_data.get("reorder", {})
        if reorder.get("question"):
            options = [{"id": str(i), "text": opt} for i, opt in enumerate(reorder.get("options", []))]
            reorder_data = {
                "type": "reorder",
                "question": reorder.get("question", ""),
                "options": options,
                "correctAnswer": reorder.get("correct_answer", ""),
                "explanation": reorder.get("explanation", ""),
                "points": 15
            }
            
            client.mutation("blocks:createBlock", {
                "topicId": topic_id,
                "type": "activity",
                "content": {
                    "type": "exercise",
                    "data": {
                        "exerciseType": "reorder_group",
                        "reorderData": reorder_data
                    }
                },
                "order": order
            })
            order += 1
        
        # 5. Real-World Impact Text Block (information type)
        if real_world_impact.get("content"):
            client.mutation("blocks:createBlock", {
                "topicId": topic_id,
                "type": "information",
                "content": {
                    "type": "text",
                    "data": {
                        "content": {
                            "text": real_world_impact["content"]
                        },
                        "styleKey": "real_world_impact"
                    }
                },
                "order": order
            })
            order += 1
        
        # 6. Final Quiz Exercises (activity type) - Single JSON block
        final_quiz = output_data.get("final_quiz", {})
        if final_quiz.get("questions"):
            # Create a single block containing all final quiz questions as JSON
            final_quiz_data = {
                "type": "final_quiz",
                "questions": []
            }
            for question_data in final_quiz["questions"]:
                options = [{"id": str(i), "text": opt} for i, opt in enumerate(question_data.get("options", []))]
                final_quiz_data["questions"].append({
                    "question": question_data.get("question", ""),
                    "options": options,
                    "correctAnswer": question_data.get("correct_answer", ""),
                    "explanation": question_data.get("explanation", ""),
                    "points": 20
                })
            
            client.mutation("blocks:createBlock", {
                "topicId": topic_id,
                "type": "activity",
                "content": {
                    "type": "exercise",
                    "data": {
                        "exerciseType": "final_quiz_group",
                        "finalQuizData": final_quiz_data
                    }
                },
                "order": order
            })
            order += 1
        
        # 7. Summary Flash Cards (information type)
        flash_cards = output_data.get("flash_cards", [])
        if flash_cards:
            # Create a single text block containing all flash cards
            flash_cards_text = ""
            for i, card in enumerate(flash_cards, 1):
                flash_cards_text += f"**{i}. {card.get('front', '')}**\\n\\n{card.get('back', '')}\\n\\n"
            
            client.mutation("blocks:createBlock", {
                "topicId": topic_id,
                "type": "information",
                "content": {
                    "type": "text",
                    "data": {
                        "content": {
                            "text": flash_cards_text
                        },
                        "styleKey": "summary"
                    }
                },
                "order": order
            })
            order += 1
        
        # Publish if requested
        if publish_immediately:
            client.mutation("topics:publishTopic", {"topicId": topic_id})
        
        # Get the notification type for topic_generated
        notification_types = client.query("notifications:getNotificationTypes")
        topic_generated_type = None
        for nt in notification_types:
            if nt.get("key") == "topic_generated":
                topic_generated_type = nt
                break
        
        # Create success notification if notification type exists
        if topic_generated_type:
            notification_data = {
                "userId": created_by or "system",
                "notificationTypeKey": topic_generated_type["_id"],
                "title": "Topic Generated Successfully",
                "message": f"Your topic '{topic_title}' has been generated and is ready to explore!",
                "data": {
                    "topicId": topic_id,
                    "metadata": {
                        "topic_title": topic_title,
                        "difficulty": difficulty,
                        "word_count": word_count,
                        "exercise_count": exercise_count,
                        "published": publish_immediately
                    }
                }
            }
            
            try:
                notification_id = client.mutation("notifications:createNotification", notification_data)
                print(f"Successfully created notification with ID: {notification_id}")
            except Exception as e:
                print(f"Warning: Failed to create success notification: {str(e)}")
        else:
            print("Warning: topic_generated notification type not found in database")
        
        return {
            "success": True,
            "topic_id": topic_id,
            "message": f"Successfully inserted topic '{topic_title}' with ID: {topic_id}",
            "metadata": {
                "word_count": word_count,
                "estimated_read_time": estimated_time,
                "exercise_count": exercise_count,
                "information_block_count": info_block_count,
                "published": publish_immediately
            }
        }
        
    except json.JSONDecodeError as e:
        return {
            "success": False,
            "error": f"Invalid JSON in agent output: {str(e)}"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Error inserting topic: {str(e)}"
        }

# =============================================================================
# OUTPUT SCHEMAS
# =============================================================================

class ResearchAgentOutput(BaseModel):
    title: str = Field(description="Clear, descriptive title that identifies the topic being researched.")
    text: str = Field(description="Consolidated paragraphs of well-structured content in markdown format that explains the topic based on research depth.")
    depth: str = Field(description="Research depth: 'brief' or 'deep'")
    block_type: str = Field(default="information", description="Block type for categorization")

class Question(BaseModel):
    question: str = Field(description="The question text")
    options: List[str] = Field(description="List of answer options")
    correct_answer: str = Field(description="The correct answer")
    explanation: str = Field(description="Explanation of why the answer is correct")

class QuizOutput(BaseModel):
    type: str = Field(description="Activity type: 'quiz'")
    block_type: str = Field(default="activity", description="Block type for categorization")
    questions: List[Question] = Field(description="List of 3 quiz questions")

class ReorderOutput(BaseModel):
    type: str = Field(description="Activity type: 'reorder'")
    block_type: str = Field(default="activity", description="Block type for categorization")
    question: str = Field(description="The main question or prompt")
    options: List[str] = Field(description="List of answer options")
    correct_answer: str = Field(description="The correct answer")
    explanation: str = Field(description="Explanation of why the answer is correct")

class FinalQuizOutput(BaseModel):
    type: str = Field(description="Activity type: 'final_quiz'")
    block_type: str = Field(default="activity", description="Block type for categorization")
    questions: List[Question] = Field(description="List of 5 final quiz questions")

class RealWorldImpactOutput(BaseModel):
    title: str = Field(description="Title of the real-world impact section")
    content: str = Field(description="Narrative paragraph in markdown format about current relevance")
    source_urls: List[str] = Field(description="URLs of sources used")
    block_type: str = Field(default="information", description="Block type for categorization")

class FlashCard(BaseModel):
    front: str = Field(description="Question or key term")
    back: str = Field(description="Answer or definition")

class SummaryAgentOutput(BaseModel):
    flash_cards: List[FlashCard] = Field(description="List of 3-4 flash cards")
    block_type: str = Field(default="information", description="Block type for categorization")

class ThumbnailOutput(BaseModel):
    thumbnail_url: str = Field(description="URL of the selected thumbnail image")
    alt_text: str = Field(description="Alt text for the image")

class CategoryTagsDescriptionOutput(BaseModel):
    selected_category: str = Field(description="Selected category ID for the topic")
    short_description: str = Field(description="10-word short description about the topic")
    generated_tags: List[str] = Field(description="List of 5 relevant tags for the topic")

class FinalAssemblyOutput(BaseModel):
    topic: str = Field(description="The educational topic")
    difficulty: str = Field(description="Topic difficulty level")
    created_by: Optional[str] = Field(description="User ID who created the topic")
    publish_immediately: bool = Field(description="Whether to publish the topic immediately")
    research_brief: ResearchAgentOutput = Field(description="Brief research results")
    research_deep: ResearchAgentOutput = Field(description="Deep research results")
    quiz: QuizOutput = Field(description="Quiz activity with 3 questions")
    reorder: ReorderOutput = Field(description="Reorder activity")
    final_quiz: FinalQuizOutput = Field(description="Final quiz with 5 questions")
    real_world_impact: RealWorldImpactOutput = Field(description="Real-world impact analysis")
    flash_cards: List[FlashCard] = Field(description="Summary flash cards")
    thumbnail: ThumbnailOutput = Field(description="Selected thumbnail")
    category_tags_description: CategoryTagsDescriptionOutput = Field(description="Selected category, description, and generated tags")

class ConvexInsertionResult(BaseModel):
    success: bool = Field(description="Whether the insertion was successful")
    topic_id: Optional[str] = Field(description="The ID of the created topic if successful")
    message: str = Field(description="Success message or error description")
    metadata: Optional[Dict[str, Any]] = Field(description="Additional metadata about the insertion")

# =============================================================================
# AGENT DEFINITIONS
# =============================================================================

# 1. Research Agent Brief
research_agent_brief = LlmAgent(
    name="ResearchAgentBrief",
    model="gemini-2.5-flash",
    instruction="""
        You are a diligent research assistant conducting BRIEF research. Your task is to use the Exa AI Search tool to find broad, comprehensive foundational information from reputable web sources.

        The user will provide a topic and difficulty level. Adapt your content based on the difficulty:
        - BEGINNER: Use simple language, basic concepts, everyday examples, avoid jargon
        - INTERMEDIATE: Include some technical terms with explanations, moderate complexity
        - ADVANCED: Use technical language, complex concepts, assume prior knowledge

        Process:
        1. Use the exa_search tool with broad search queries to gather diverse information. Set result_category parameter as "auto".
        2. Search for multiple aspects: "what is [topic]", "[topic] overview", "[topic] basics", "[topic] fundamentals".
        3. Read through ALL extracted text to get a comprehensive understanding.
        4. Create a clear, descriptive title that identifies the topic.
        5. Write 1-2 consolidated paragraphs covering BROAD aspects of the topic:
        - What it is and why it matters
        - Key components, types, or categories
        - How it works or its main principles
        - Common applications or examples
        6. Format your content using raw markdown syntax and organize important points as bullet points:
        - Use **bold text** for key terms and important concepts
        - Use bullet points with - for ALL important information and lists
        - Use *italic* for emphasis where needed
        - Structure content with bullet points to make it scannable and easy to read
        - DO NOT include markdown headings (##) as the title is handled separately
        7. Ensure content is appropriate for the specified difficulty level.
        8. Keep each paragraph to maximum 200 words, total content should be comprehensive yet accessible.
        9. CRITICAL: When creating JSON, you must properly escape all special characters:
        - Escape newlines as \\n
        - Escape quotes as \\\"
        - Escape backslashes as \\\\
        10. ABSOLUTE RULES for output:
        - Respond with ONLY a valid JSON object
        - DO NOT wrap the JSON inside code fences (e.g., no ```json or ``` at all)
        - DO NOT output any explanation, commentary, or extra text outside the JSON
        - Ensure JSON matches the schema EXACTLY

        Required JSON schema:
        {
            "title": "Clear, descriptive title",
            "text": "Markdown content with proper escaping",
            "depth": "brief",
            "block_type": "information"
        }

        Example of correct output:
        {
            "title": "Understanding Artificial Intelligence",
            "text": "**Artificial Intelligence (AI)** is a branch of computer science focused on creating systems that can perform tasks typically requiring human intelligence. AI has become increasingly important in modern society due to its ability to process vast amounts of data and make decisions at unprecedented speeds.\\n\\n**Key aspects of AI include:**\\n- **Machine Learning**: Systems that improve through experience\\n- **Natural Language Processing**: Understanding and generating human language\\n- **Computer Vision**: Interpreting visual information\\n- **Robotics**: Physical systems that can interact with the world\\n\\nAI applications range from simple recommendation systems to complex autonomous vehicles, making it one of the most transformative technologies of our time.",
            "depth": "brief",
            "block_type": "information"
        }
    """,
    output_schema=ResearchAgentOutput,
    output_key="research_brief_output",
    tools=[exa_search]
)

# 2. Quiz Agent (3 questions, difficulty-adaptive)
quiz_agent = LlmAgent(
    name="QuizAgent", 
    model="gemini-2.0-flash-lite",
    instruction="""
        You are an expert educational content designer creating QUIZ activities. Your goal is to create 3 quiz questions that test understanding of foundational concepts.

        Use the research data from {research_brief_output} to create your questions. The user input contains a difficulty level - adapt your questions accordingly:

        BEGINNER LEVEL QUESTIONS:
        - Focus on basic definitions and simple concepts
        - Use straightforward language
        - Test recall and basic understanding
        - Include obvious wrong answers to help learning

        INTERMEDIATE LEVEL QUESTIONS:
        - Test application of concepts
        - Require some analysis and connection-making
        - Include plausible distractors
        - Mix factual and conceptual questions

        ADVANCED LEVEL QUESTIONS:
        - Test synthesis and evaluation
        - Require deep understanding and critical thinking
        - Include subtle distinctions between options
        - Focus on complex relationships and implications

        Create exactly 3 multiple-choice questions that:
        - Match the specified difficulty level
        - Test understanding of FOUNDATIONAL concepts from the brief research
        - Focus on basic definitions, core principles, and fundamental understanding
        - Have 4 answer options each
        - Include clear explanations for why the correct answer is right

        NOTE: These are the FIRST quiz questions in the learning module. Focus on foundational concepts that will be built upon later. A final quiz will come later that should cover different, more advanced aspects of the topic.

        CRITICAL FORMATTING REQUIREMENTS:
        - You must respond with ONLY a valid JSON object
        - DO NOT wrap the JSON in code fences (no ```json or ``` at all)
        - DO NOT output any explanation, commentary, or extra text outside the JSON
        - The JSON must exactly match the required schema
        - All string values must be properly quoted
        - Arrays must contain exactly the specified number of items
        - JSON must start with "{" and end with "}"

        Required JSON schema:
        {
            "type": "quiz",
            "block_type": "activity",
            "questions": [
                {
                    "question": "Your question text here",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correct_answer": "Option A",
                    "explanation": "Explanation why this is correct"
                }
            ]
        }

        Example valid output:
        {
            "type": "quiz",
            "block_type": "activity",
            "questions": [
                {
                    "question": "What is the primary purpose of artificial intelligence?",
                    "options": ["To replace humans", "To augment human capabilities", "To control computers", "To process data"],
                    "correct_answer": "To augment human capabilities",
                    "explanation": "AI is designed to enhance and support human decision-making and capabilities."
                },
                {
                    "question": "Which of the following best describes machine learning?",
                    "options": ["A fixed set of rules programmed by humans", "A system that improves with experience", "A hardware device for faster computing", "A method for storing big data"],
                    "correct_answer": "A system that improves with experience",
                    "explanation": "Machine learning allows systems to adapt and improve their performance through data and experience rather than fixed programming."
                },
                {
                    "question": "Which area of AI focuses on understanding and generating human language?",
                    "options": ["Robotics", "Computer Vision", "Natural Language Processing", "Data Mining"],
                    "correct_answer": "Natural Language Processing",
                    "explanation": "Natural Language Processing (NLP) is the branch of AI that deals with human language comprehension and generation."
                }
            ]
        }
    """,
    output_schema=QuizOutput,
    output_key="quiz_output"
)

# 3. Research Agent Deep
research_agent_deep = LlmAgent(
    name="ResearchAgentDeep",
    model="gemini-2.5-flash",
    instruction="""
        You are a specialized research assistant conducting ADVANCED, IN-DEPTH research. Your task is to go BEYOND basic concepts and provide specialized, technical information that complements but does NOT repeat foundational knowledge.

        CRITICAL: Your research must be DIFFERENT from basic introductory content. Focus on advanced aspects that someone already familiar with the basics would want to learn.

        The user will provide a topic and difficulty level. Adapt your content depth based on the difficulty:
        - BEGINNER: Focus on practical applications, real-world examples, step-by-step processes, and "how it works" details
        - INTERMEDIATE: Include technical mechanisms, industry practices, tools/frameworks, comparative analysis
        - ADVANCED: Cover cutting-edge research, complex algorithms, theoretical foundations, expert-level concepts

        Process:
        1. Use the exa_search tool with SPECIALIZED queries. Set result_category parameter as "auto".
        2. Search for ADVANCED topics: "[topic] algorithms", "[topic] implementation", "[topic] industry applications", "[topic] research papers", "[topic] case studies", "[topic] tools frameworks", "[topic] challenges limitations".
        3. Read through ALL extracted text to gather specialized insights.
        4. Create a descriptive title that reflects the advanced nature of the content.
        5. Write 2-3 consolidated paragraphs covering SPECIALIZED aspects (avoid basic definitions):
        - Technical implementation details and methodologies
        - Industry applications and real-world case studies
        - Current research frontiers and breakthrough developments
        - Specific tools, frameworks, and technologies used
        - Challenges, limitations, and problem-solving approaches
        - Future directions and emerging trends
        - Expert insights and professional perspectives
        6. Format your content using raw markdown syntax and organize important points as bullet points:
        - Use **bold text** for key technical terms and important concepts
        - Use bullet points with - for ALL important information and lists
        - Use *italic* for emphasis where needed
        - Structure content with bullet points to make it scannable and easy to read
        - DO NOT include markdown headings (##) as the title is handled separately
        7. Ensure content complexity matches the specified difficulty level.
        8. Keep each paragraph to maximum 200 words, providing comprehensive yet focused insights.
        9. CRITICAL: When creating JSON, you must properly escape all special characters:
        - Escape newlines as \\n
        - Escape quotes as \\\"
        - Escape backslashes as \\\\

        CRITICAL FORMATTING REQUIREMENTS:
        - You must respond with ONLY a valid JSON object
        - DO NOT wrap the JSON in code fences (no ```json or ``` at all)
        - DO NOT output any explanation, commentary, or extra text outside the JSON
        - The JSON must exactly match the required schema
        - All string values must be properly quoted
        - Escape all special characters properly in the text field
        - JSON must start with "{" and end with "}"

        Required JSON schema:
        {
            "title": "Clear, descriptive title",
            "text": "Markdown content with proper escaping",
            "depth": "deep",
            "block_type": "information"
        }

        Example of correct JSON output:
        {
            "title": "Machine Learning Implementation and Industry Applications",
            "text": "**Modern ML implementations** rely on sophisticated frameworks and distributed computing architectures. Industry leaders like Google, Netflix, and Tesla deploy **production ML systems** that process millions of data points in real-time using technologies like TensorFlow Serving, Kubernetes, and Apache Kafka.\\n\\n**Key implementation challenges include:**\\n- **Data Pipeline Architecture**: Building robust ETL processes for continuous model training\\n- **Model Versioning**: Managing multiple model versions in production environments\\n- **A/B Testing Frameworks**: Comparing model performance with statistical significance\\n- **Feature Engineering**: Automated feature selection and transformation pipelines\\n- **MLOps Integration**: Continuous integration and deployment for ML models\\n\\n**Cutting-edge research areas** focus on **federated learning** for privacy-preserving training, **neural architecture search** for automated model design, and **explainable AI** techniques for model interpretability in regulated industries.",
            "depth": "deep",
            "block_type": "information"
        }
    """,
    output_schema=ResearchAgentOutput,
    output_key="research_deep_output",
    tools=[exa_search]
)

# 4. Reorder Agent (1 question, difficulty-adaptive)
reorder_agent = LlmAgent(
    name="ReorderAgent", 
    model="gemini-2.0-flash-lite",
    instruction="""
        You are an expert educational content designer creating REORDER activities. Your goal is to create 1 reorder question that tests sequencing or prioritization skills.

        Use the research data from {research_brief_output} and {research_deep_output} to create your question. The user input contains a difficulty level - adapt your question accordingly:

        BEGINNER LEVEL REORDER:
        - Simple, obvious sequences (like basic steps in a process)
        - Clear logical order that's easy to follow
        - Familiar concepts and straightforward relationships

        INTERMEDIATE LEVEL REORDER:
        - More complex processes with multiple steps
        - Requires understanding of cause-and-effect relationships
        - Some steps may have subtle dependencies

        ADVANCED LEVEL REORDER:
        - Complex multi-step processes or hierarchies
        - Requires deep understanding of relationships and dependencies
        - May involve prioritization based on importance or efficiency

        Create 1 reorder question that:
        - Matches the specified difficulty level
        - Tests understanding of PROCESSES, SEQUENCES, or CHRONOLOGICAL ORDER from the research
        - Focus on step-by-step procedures, historical development, or logical progressions
        - Requires logical thinking about order or relationships
        - Has 4 options that need to be arranged in correct order
        - Includes a clear explanation of the correct sequence

        NOTE: This reorder activity should focus on sequential/chronological aspects that are different from the multiple-choice questions in the quiz and final quiz.

        CRITICAL FORMATTING REQUIREMENTS:
        - You must respond with ONLY a valid JSON object
        - DO NOT wrap the JSON in code fences (no ```json or ``` at all)
        - DO NOT output any explanation, commentary, or extra text outside the JSON
        - The JSON must exactly match the required schema
        - All string values must be properly quoted
        - Arrays must contain exactly the specified number of items
        - JSON must start with "{" and end with "}"

        Required JSON schema:
        {
            "type": "reorder",
            "block_type": "activity",
            "question": "Your reorder question here",
            "options": ["First item", "Second item", "Third item", "Fourth item"],
            "correct_answer": "First item, Second item, Third item, Fourth item",
            "explanation": "Explanation of the correct order"
        }

        Example valid output:
        {
            "type": "reorder",
            "block_type": "activity",
            "question": "Arrange these AI development phases in chronological order:",
            "options": ["Neural networks", "Expert systems", "Machine learning", "Deep learning"],
            "correct_answer": "Expert systems, Neural networks, Machine learning, Deep learning",
            "explanation": "This represents the historical progression of AI technologies from the 1980s to present."
        }
    """,
    output_schema=ReorderOutput,
    output_key="reorder_output"
)

# 5. Final Quiz Agent (5 questions, difficulty-adaptive)
final_quiz_agent = LlmAgent(
    name="FinalQuizAgent", 
    model="gemini-2.0-flash-lite",
    instruction="""
        You are an expert educational content designer creating the FINAL QUIZ. Your goal is to create 5 comprehensive questions that test all learned concepts.

        Use ALL available research data from {research_brief_output} and {research_deep_output} to create your questions. You also have access to the earlier quiz questions from {quiz_output} - make sure your final quiz questions are COMPLETELY DIFFERENT and do not repeat any concepts, topics, or question formats from the earlier quiz.

        The user input contains a difficulty level - adapt your questions accordingly:

        BEGINNER LEVEL FINAL QUIZ:
        - Test basic recall and simple understanding
        - Focus on key definitions and main concepts
        - Use clear, straightforward language
        - Include questions about real-world applications in simple terms

        INTERMEDIATE LEVEL FINAL QUIZ:
        - Test application and analysis of concepts
        - Require connecting ideas from different sections
        - Include some synthesis of brief and deep research
        - Mix factual and conceptual questions

        ADVANCED LEVEL FINAL QUIZ:
        - Test evaluation, synthesis, and critical thinking
        - Require deep understanding and complex reasoning
        - Include questions that connect multiple advanced concepts
        - Focus on implications, comparisons, and complex relationships

        Create exactly 5 multiple-choice questions that:
        - Match the specified difficulty level
        - Cover the full breadth of concepts from brief research and deep research
        - Are COMPLETELY DIFFERENT from the questions in {quiz_output} - avoid repeating any topics, concepts, or question styles
        - Focus on different aspects of the topic than the earlier quiz
        - Require appropriate level of thinking for the difficulty
        - Test both factual knowledge and conceptual understanding
        - Have 4 answer options each
        - Include detailed explanations for why the correct answer is right

        IMPORTANT: Review the questions from {quiz_output} and ensure your 5 questions cover entirely different aspects of the topic. Do not repeat any concepts, definitions, or question formats from the earlier quiz.

        CRITICAL FORMATTING REQUIREMENTS:
        - You must respond with ONLY a valid JSON object
        - DO NOT wrap the JSON in code fences (no ```json or ``` at all)
        - DO NOT output any explanation, commentary, or extra text outside the JSON
        - The JSON must exactly match the required schema
        - All string values must be properly quoted
        - Arrays must contain exactly the specified number of items
        - JSON must start with "{" and end with "}"

        Required JSON schema:
        {
            "type": "final_quiz",
            "block_type": "activity",
            "questions": [
                {
                    "question": "Your question text here",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correct_answer": "Option A",
                    "explanation": "Detailed explanation why this is correct"
                }
            ]
        }

        Example valid output:
        {
            "type": "final_quiz",
            "block_type": "activity",
            "questions": [
                {
                    "question": "Which statement best describes the current state of AI?",
                    "options": ["AI has achieved general intelligence", "AI excels at specific tasks", "AI cannot learn from data", "AI works without algorithms"],
                    "correct_answer": "AI excels at specific tasks",
                    "explanation": "Current AI systems are narrow AI, designed to perform specific tasks very well rather than general intelligence."
                },
                {
                    "question": "What is one of the key challenges in deploying AI models in production?",
                    "options": ["Finding enough algorithms", "Model versioning and monitoring", "Lack of computers", "Eliminating all data pipelines"],
                    "correct_answer": "Model versioning and monitoring",
                    "explanation": "Managing multiple models and monitoring them for drift, fairness, and accuracy is a core challenge in real-world AI deployment."
                },
                {
                    "question": "Which advanced method enables AI models to train collaboratively without sharing raw data?",
                    "options": ["Transfer learning", "Federated learning", "Reinforcement learning", "Supervised learning"],
                    "correct_answer": "Federated learning",
                    "explanation": "Federated learning allows multiple parties to train models without sharing their raw data, enhancing privacy and security."
                },
                {
                    "question": "Why is explainable AI particularly important in regulated industries?",
                    "options": ["It improves computational speed", "It reduces storage requirements", "It provides transparency and accountability", "It eliminates the need for models"],
                    "correct_answer": "It provides transparency and accountability",
                    "explanation": "Explainable AI helps stakeholders understand model decisions, ensuring compliance, trust, and fairness in sensitive industries."
                },
                {
                    "question": "What emerging trend is reshaping AI development pipelines?",
                    "options": ["Manual coding of all rules", "Neural architecture search", "Static models with no updates", "Single-step data processing"],
                    "correct_answer": "Neural architecture search",
                    "explanation": "Neural architecture search automates the design of model architectures, improving efficiency and potentially surpassing manually engineered models."
                }
            ]
        }
    """,
    output_schema=FinalQuizOutput,
    output_key="final_quiz_output"
)

# 6. Real-World Impact Agent
real_world_impact_agent = LlmAgent(
    name="RealWorldImpactAgent",
    model="gemini-2.5-flash", 
    instruction="""
        You are a skilled writer who connects topics to the real world. Your task is to explain why a topic matters *today* and provide real-world use cases that anyone can understand.

        REGARDLESS OF DIFFICULTY LEVEL, your real-world use cases must be easy enough for laypeople to understand.

        Process:  
        1. Use the exa_search tool to find current news and developments. Set the `query` parameter to a search query focused on recent developments and current applications, and `result_category` parameter as `"news"`.  
        2. Read through ALL the extracted text from the search results to understand current relevance.  
        3. You can also reference research data from {research_brief_output} and {research_deep_output} to provide context.  
        4. Create an appropriate title that captures the real-world significance.  
        5. Structure your content as follows:  
        - Start with 1-2 sentences explaining why the topic matters today  
        - Follow with bullet points showing specific real-world use cases that are:  
            * Easy to understand for laypeople  
            * Concrete and specific examples  
            * Connected to everyday life or recognizable situations  
            * Current and relevant to today's world  
        6. Format your content using **raw markdown syntax** and organize ALL use cases as bullet points:  
        - Use **bold text** for key terms and important concepts  
        - Use `-` for ALL bullet points  
        - Keep language simple and accessible  
        - Structure ALL important information as bullet points for easy scanning  
        7. CRITICAL: When creating JSON, you must properly escape all special characters:  
        - Escape newlines as `\\n`  
        - Escape quotes as `\\"`  
        - Escape backslashes as `\\\\`  

        Your content should provide clear, understandable examples of how this topic impacts real life today.

        CRITICAL FORMATTING REQUIREMENTS:  
        - You must respond with ONLY a valid JSON object  
        - DO NOT wrap the JSON in code fences (no ```json)  
        - DO NOT output any explanation, commentary, or extra text outside the JSON  
        - The JSON must exactly match the required schema  
        - All string values must be properly quoted  
        - Escape all special characters properly in the `content` field  
        - JSON must start with `{` and end with `}`  

        Required JSON schema:  
        {
            "title": "Title capturing real-world significance",
            "content": "Markdown content with proper escaping",
            "source_urls": ["url1", "url2", "url3"],
            "block_type": "information"
        }

        Example of correct JSON output:  
        {
            "title": "AI's Impact on Daily Life Today",
            "content": "**Artificial Intelligence** is transforming how we live and work in 2024, with AI-powered systems now embedded in countless everyday applications that most people use without even realizing it.\\n\\n**Real-World Use Cases:**\\n- **Smartphone assistants** like Siri and Google Assistant help millions of people set reminders, answer questions, and control smart home devices\\n- **Streaming services** like Netflix and Spotify use AI to recommend movies, shows, and music based on your viewing and listening history\\n- **Navigation apps** like Google Maps and Waze use AI to analyze traffic patterns and suggest the fastest routes in real-time\\n- **Online shopping** platforms like Amazon use AI to show you products you're likely to buy and detect fraudulent transactions\\n- **Social media** platforms use AI to curate your news feed and identify spam or harmful content\\n- **Email services** automatically sort spam, suggest replies, and organize your inbox using AI algorithms",
            "source_urls": ["https://example1.com", "https://example2.com", "https://example3.com"],
            "block_type": "information"
        }
    """,
    output_schema=RealWorldImpactOutput,
    output_key="impact_output",
    tools=[exa_search]
)

# 7. Summary Agent (difficulty-adaptive)
summary_agent = LlmAgent(
    name="SummaryAgent",
    model="gemini-2.0-flash-lite",
    instruction="""
        You are a summarization expert. Your job is to distill the most critical information from the provided context into a series of 3-4 flash cards.

        Use ALL available data from:  
        - Brief research: {research_brief_output}  
        - Deep research: {research_deep_output}  
        - Real-world impact: {impact_output}  
        - Quiz activities: {quiz_output}  
        - Reorder activities: {reorder_output}  
        - Final quiz: {final_quiz_output}  

        The user input contains a difficulty level - adapt your flash cards accordingly:

        BEGINNER LEVEL FLASH CARDS:  
        - Focus on basic definitions and simple concepts  
        - Use everyday language and simple explanations  
        - Include fundamental terms and their meanings  

        INTERMEDIATE LEVEL FLASH CARDS:  
        - Include more detailed explanations  
        - Cover both basic and moderately complex concepts  
        - Mix definitions with application examples  

        ADVANCED LEVEL FLASH CARDS:  
        - Focus on complex concepts and relationships  
        - Use technical terminology appropriately  
        - Include nuanced distinctions and advanced applications  

        Each flash card must have a "front" (a question or key term) and a "back" (a concise answer or definition appropriate to the difficulty level).

        CRITICAL FORMATTING REQUIREMENTS:  
        - You must respond with ONLY a valid JSON object  
        - DO NOT wrap the JSON in code fences (no ```json)  
        - DO NOT output any explanation, commentary, or extra text outside the JSON  
        - The JSON must exactly match the required schema  
        - All string values must be properly quoted  
        - Arrays must contain exactly the specified number of items  
        - JSON must start with `{` and end with `}`  

        Required JSON schema:  
        {
            "flash_cards": [
                {
                    "front": "Question or key term here",
                    "back": "Concise answer or definition here"
                }
            ],
            "block_type": "information"
        }

        Example valid output:  
        {
            "flash_cards": [
                {
                    "front": "What is Machine Learning?",
                    "back": "A subset of AI that enables systems to learn and improve from experience without being explicitly programmed."
                },
                {
                    "front": "Neural Networks",
                    "back": "Computing systems inspired by biological neural networks that process information through interconnected nodes."
                }
            ],
            "block_type": "information"
        }
    """,
    output_schema=SummaryAgentOutput,
    output_key="summary_output"
)

# 8. Category, Tags and Description Agent
category_tags_description_agent = LlmAgent(
    name="CategoryTagsDescriptionAgent",
    model="gemini-2.5-flash",
    instruction="""
        You are a content categorization and description specialist. Your task is to analyze the educational topic and provide three outputs: select the most appropriate category, create a short description, and generate relevant tags.

        Process:
        1. Use the get_categories_from_convex tool to fetch all available categories from the database.  
        2. Analyze the topic from {research_brief_output} and {research_deep_output} to understand its subject matter.  
        3. Select the most appropriate category from the available options:  
        - If a suitable category is found, return its _id value  
        - If no suitable category is found, find the category with name="Other" and return its _id  
        - The selected_category field must contain the category _id string, not the name  
        4. Create a short description that is exactly 10 words or fewer that captures the SPECIFIC essence of the topic.  
        AVOID generic words like:  
        - "Explaining", "Understanding", "Learning about", "Exploring", "Discussing"  
        - "Introduction to", "Overview of", "Guide to", "Basics of"  
        - "Talking about", "Covering", "Examining", "Looking at"  

        Instead, focus on WHAT the topic actually IS or DOES:  
        - For "Machine Learning": "Algorithms that learn patterns from data to make predictions"  
        - For "Photosynthesis": "Plants converting sunlight into energy through chemical processes"  
        - For "Renaissance Art": "European artistic revival emphasizing realism and human expression"  
        - For "Blockchain": "Decentralized digital ledger technology ensuring transaction security"  

        5. Generate exactly 5 relevant tags that help people understand what the topic is about. Tags should be:  
        - Descriptive and specific to the topic  
        - Helpful for search and discovery  
        - Cover different aspects (subject area, concepts, applications, etc.)  
        - Use clear, searchable terms  
        - Be concise (1-3 words each)  

        CRITICAL FORMATTING REQUIREMENTS:  
        - You must respond with ONLY a valid JSON object  
        - DO NOT wrap the JSON in code fences (no ```json)  
        - DO NOT output any explanation, commentary, or extra text outside the JSON  
        - The JSON must exactly match the required schema  
        - All string values must be properly quoted  
        - Arrays must contain exactly the specified number of items  
        - JSON must start with `{` and end with `}`  

        Required JSON schema:  
        {
            "selected_category": "category_id_string",
            "short_description": "exactly 10 words or fewer describing the topic",
            "generated_tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
        }

        Example valid output:  
        {
            "selected_category": "j57abc123def456",
            "short_description": "Algorithms that learn patterns from data to make predictions",
            "generated_tags": ["artificial intelligence", "machine learning", "technology", "automation", "future"]
        }
    """,
    output_schema=CategoryTagsDescriptionOutput,
    output_key="category_tags_description_output",
    tools=[get_categories_from_convex]
)

# 9. Thumbnail Generator Agent  
thumbnail_generator_agent = LlmAgent(
    name="ThumbnailGeneratorAgent",
    model="gemini-2.5-flash",
    instruction="""
        You are a visual design specialist with a keen eye for compelling imagery. Your task is to find the perfect thumbnail for the educational topic provided in context.

        Process:
        1. Use the Serper image search tool to find 10 high-quality, license-free images related to the topic. While using the tool, set query parameter to the topic name. In the result, the image URL will be available in the key imageUrl. If the result is empty, just return null as thumbnail url and alt text in output schema.  
        2. Analyze the image URLs based on relevance, clarity, composition, and visual appeal.  
        3. Select the single best image that would serve as an engaging thumbnail for an educational module. The desired image should be generic and more visually engaging than informative.  
        4. Make sure that the selected thumbnail image has a dimension at least greater than 512*512. The height and width of the image are available in the result under the keys imageHeight and imageWidth.
        5. Make sure that the selected image is not an SVG and has a background.
        6. Generate appropriate alt text for accessibility.  

        CRITICAL FORMATTING REQUIREMENTS:  
        - You must respond with ONLY a valid JSON object  
        - DO NOT wrap the JSON in code fences (no ```json)  
        - DO NOT output any explanation, commentary, or extra text outside the JSON  
        - The JSON must exactly match the required schema  
        - All string values must be properly quoted  
        - Use null (not "null") for empty values  
        - JSON must start with `{` and end with `}`  

        Required JSON schema:  
        {
            "thumbnail_url": "https://example.com/image.jpg",
            "alt_text": "Descriptive alt text for accessibility"
        }

        Example valid output:  
        {
            "thumbnail_url": "https://example.com/ai-brain-circuit.jpg",
            "alt_text": "Digital brain with circuit patterns representing artificial intelligence"
        }

        Example for no images found:  
        {
            "thumbnail_url": null,
            "alt_text": null
        }
    """,
    output_schema=ThumbnailOutput,
    output_key="thumbnail_output",
    tools=[serper_image_search]
)

# 10. Assembler Agent
assembler_agent = LlmAgent(
    name="AssemblerAgent",
    model="gemini-2.0-flash-lite", 
    instruction="""
        You are a meticulous JSON formatter. Your job is to take all the content components and assemble them into a single, final JSON object.

        Process:
        - The user input will contain: topic, difficulty, created_by (optional), and publish_immediately (optional).  
        - Gather data from:
        - Brief research: {research_brief_output}
        - Deep research: {research_deep_output}
        - Quiz: {quiz_output}
        - Reorder: {reorder_output}
        - Final quiz: {final_quiz_output}
        - Real-world impact: {impact_output}
        - Flash cards: {summary_output}
        - Thumbnail: {thumbnail_output}
        - Category, tags and description: {category_tags_description_output}

        CRITICAL FORMATTING REQUIREMENTS:  
        - You must respond with ONLY a valid JSON object  
        - DO NOT wrap the JSON in code fences (no ```json)  
        - DO NOT output any explanation, commentary, or extra text outside the JSON  
        - The JSON must exactly match the required schema  
        - All string values must be properly quoted  
        - Use null (not "null") for empty values  
        - Extract flash_cards array from summary_output  

        Required JSON schema:  
        {
            "topic": "The educational topic name from user input",
            "difficulty": "The difficulty level from user input",
            "created_by": "The user ID from user input (or null if not provided)",
            "publish_immediately": "The publish flag from user input (default to True if not provided)",
            "research_brief": {research_brief_output},
            "research_deep": {research_deep_output},
            "quiz": {quiz_output},
            "reorder": {reorder_output},
            "final_quiz": {final_quiz_output},
            "real_world_impact": {impact_output},
            "flash_cards": [{summary_output flash_cards}],
            "thumbnail": {thumbnail_output},
            "category_tags_description": {category_tags_description_output}
        }

        Remember:  
        - Use the exact topic, difficulty, created_by, and publish_immediately values from user input  
        - Extract only the flash_cards array from summary_output (not the entire object)  
        - Use null for created_by if not provided  
        - Use True for publish_immediately if not provided  
        - Output only the JSON object, nothing else          
    """,
    output_schema=FinalAssemblyOutput,
    output_key="final_module"
)

# 11. Convex Inserter Agent
convex_inserter_agent = LlmAgent(
    name="ConvexInserterAgent",
    model="gemini-2.5-flash", # TODO: Select the best model (2.0 flash lite is useless)
    instruction="""
    You are a specialized agent responsible for inserting educational content into a Convex database. Your task is to take the complete output from the assembler agent and properly insert it as a structured topic with blocks.

    YOUR PROCESS:
    1. Receive the complete agent output JSON from the assembler agent
    2. Use the insert_topic_to_convex tool to insert the data into Convex
    3. Return a detailed result about the insertion process

    INPUT FORMAT EXPECTED:
    The input will be the final_module output from the assembler agent with these fields:
    - topic: The educational topic name
    - research_brief: Brief research with title and text
    - research_deep: Deep research with title and text  
    - quiz: Quiz with 3 multiple choice questions
    - reorder: Reorder activity with question and options
    - final_quiz: Final quiz with 5 multiple choice questions
    - real_world_impact: Real-world applications and impact
    - flash_cards: Summary flash cards
    - thumbnail: Selected thumbnail image
    - category_tags_description: Selected category, description, and generated tags

    PARAMETERS ARE NOW INCLUDED IN THE AGENT OUTPUT:
    - difficulty: "beginner", "intermediate", or "advanced" 
    - created_by: Optional user ID who created the topic
    - publish_immediately: Whether to publish the topic right away

    YOUR RESPONSE:
    Always provide a clear, informative response about:
    - Whether the insertion was successful
    - The topic ID if successful
    - Metadata about the inserted content (word count, exercise count, etc.)

    ERROR HANDLING:
    If there are issues with the insertion process:
    - Clearly explain what went wrong
    - Suggest how to fix the issue
    - Provide helpful debugging information

    CRITICAL FORMATTING REQUIREMENTS:  
    - You must respond with ONLY a valid JSON object  
    - DO NOT wrap the JSON in code fences (no ```json)  
    - DO NOT output any explanation, commentary, or extra text outside the JSON  
    - The JSON must exactly match the required schema  
    - All string values must be properly quoted  

    IMPORTANT: You must use the insert_topic_to_convex tool to interact with the Convex database. Extract the topic information from the final_module data and insert it properly.
    """,
    output_schema=ConvexInsertionResult,
    output_key="insertion_result",
    tools=[insert_topic_to_convex]
)

# 12. Orchestrator Agent (Main Controller)
orchestrator_agent = SequentialAgent(
    name="OrchestratorAgent",
    sub_agents=[
        research_agent_brief,
        quiz_agent,
        research_agent_deep,
        reorder_agent,
        real_world_impact_agent,
        final_quiz_agent,
        summary_agent,
        category_tags_description_agent,
        thumbnail_generator_agent,
        assembler_agent,
        convex_inserter_agent
    ]
)

# For ADK tools compatibility, the root agent must be named `root_agent`
root_agent = orchestrator_agent