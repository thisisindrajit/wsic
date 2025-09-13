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
        - Escape quotes as \\"
        - Escape backslashes as \\\\
        10. ABSOLUTE RULES for output:
        - Respond with ONLY a valid JSON object.
        - DO NOT wrap the JSON inside code fences (e.g., no ```json or ``` at all).
        - DO NOT output any explanation, commentary, or extra text outside the JSON.
        - Your entire response must start with "{" and end with "}".
        - Ensure JSON matches the schema EXACTLY.

        Required JSON schema:
        {
            "title": "Clear, descriptive title",
            "text": "Markdown content with proper escaping",
            "depth": "brief",
            "block_type": "information"
        }
    """,
    # output_schema=ResearchAgentOutput,
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
        - Have 4 answer options each
        - Include clear explanations for why the correct answer is right

        NOTE: These are the FIRST quiz questions in the learning module. Focus on foundational concepts that will be built upon later.

        CRITICAL FORMATTING REQUIREMENTS:
        - You must respond with ONLY a valid JSON object.
        - DO NOT wrap the JSON in code fences (no ```json or ``` at all).
        - DO NOT output any explanation, commentary, or extra text outside the JSON.
        - Your entire response must start with "{" and end with "}".
        - The JSON must exactly match the required schema.

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
    """,
    output_schema=QuizOutput,
    output_key="quiz_output"
)

# 3. Research Agent Deep
research_agent_deep = LlmAgent(
    name="ResearchAgentDeep",
    model="gemini-2.5-flash",
    instruction="""
        You are a specialized research assistant conducting ADVANCED, IN-DEPTH research. Your task is to go BEYOND basic concepts and provide specialized, technical information.

        CRITICAL: Your research must be DIFFERENT from basic introductory content. Focus on advanced aspects that someone already familiar with the basics would want to learn.

        The user will provide a topic and difficulty level. Adapt your content depth based on the difficulty:
        - BEGINNER: Focus on practical applications, real-world examples, step-by-step processes
        - INTERMEDIATE: Include technical mechanisms, industry practices, tools/frameworks
        - ADVANCED: Cover cutting-edge research, complex algorithms, theoretical foundations

        Process:
        1. Use the exa_search tool with SPECIALIZED queries like "[topic] algorithms", "[topic] implementation", "[topic] industry applications". Set result_category parameter as "auto".
        2. Create a descriptive title that reflects the advanced nature of the content.
        3. Write 2-3 consolidated paragraphs covering SPECIALIZED aspects (avoid basic definitions).
        4. Format your content using raw markdown syntax with **bold** and bullet points.
        5. CRITICAL: When creating JSON, you must properly escape all special characters: \\n, \\", \\\\.

        CRITICAL FORMATTING REQUIREMENTS:
        - You must respond with ONLY a valid JSON object.
        - DO NOT wrap the JSON in code fences (no ```json or ``` at all).
        - DO NOT output any explanation, commentary, or extra text outside the JSON.
        - Your entire response must start with "{" and end with "}".
        - The JSON must exactly match the required schema.

        Required JSON schema:
        {
            "title": "Clear, descriptive title",
            "text": "Markdown content with proper escaping",
            "depth": "deep",
            "block_type": "information"
        }
    """,
    # output_schema=ResearchAgentOutput,
    output_key="research_deep_output",
    tools=[exa_search]
)

# 4. Reorder Agent (1 question, difficulty-adaptive)
reorder_agent = LlmAgent(
    name="ReorderAgent", 
    model="gemini-2.0-flash-lite",
    instruction="""
        You are an expert educational content designer creating REORDER activities. Your goal is to create 1 reorder question that tests sequencing or prioritization skills.

        Use the research data from {research_brief_output} and {research_deep_output} to create your question. Adapt your question to the user's difficulty level.

        BEGINNER: Simple, obvious sequences (like basic steps in a process).
        INTERMEDIATE: More complex processes with multiple steps.
        ADVANCED: Complex multi-step processes or hierarchies.

        Create 1 reorder question that:
        - Matches the specified difficulty level
        - Tests understanding of PROCESSES, SEQUENCES, or CHRONOLOGICAL ORDER
        - Has 4 options that need to be arranged in correct order
        - Includes a clear explanation of the correct sequence

        CRITICAL FORMATTING REQUIREMENTS:
        - You must respond with ONLY a valid JSON object.
        - DO NOT wrap the JSON in code fences (no ```json or ``` at all).
        - DO NOT output any explanation, commentary, or extra text outside the JSON.
        - Your entire response must start with "{" and end with "}".
        - The JSON must exactly match the required schema.

        Required JSON schema:
        {
            "type": "reorder",
            "block_type": "activity",
            "question": "Your reorder question here",
            "options": ["First item", "Second item", "Third item", "Fourth item"],
            "correct_answer": "First item, Second item, Third item, Fourth item",
            "explanation": "Explanation of the correct order"
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

        Use ALL available research data from {research_brief_output} and {research_deep_output}. Ensure your questions are COMPLETELY DIFFERENT from {quiz_output}.

        Adapt your questions to the user's specified difficulty level (BEGINNER, INTERMEDIATE, ADVANCED).

        Create exactly 5 multiple-choice questions that:
        - Match the difficulty level
        - Cover the full breadth of concepts from both research sections
        - Are COMPLETELY DIFFERENT from the questions in {quiz_output}
        - Have 4 answer options each
        - Include detailed explanations for the correct answer

        IMPORTANT: Review the questions from {quiz_output} and ensure your 5 questions cover entirely different aspects of the topic.

        CRITICAL FORMATTING REQUIREMENTS:
        - You must respond with ONLY a valid JSON object.
        - DO NOT wrap the JSON in code fences (no ```json or ``` at all).
        - DO NOT output any explanation, commentary, or extra text outside the JSON.
        - Your entire response must start with "{" and end with "}".
        - The JSON must exactly match the required schema.

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

        REGARDLESS OF DIFFICULTY LEVEL, your real-world use cases must be easy for laypeople to understand.

        Process: 
        1. Use the exa_search tool to find current news and developments. Set the `query` to focus on recent developments and `result_category` to `"news"`. 
        2. Reference data from {research_brief_output} and {research_deep_output} for context. 
        3. Create an appropriate title that captures the real-world significance. 
        4. Start with 1-2 sentences explaining why the topic matters today. 
        5. Follow with bullet points showing specific, concrete, and current real-world use cases.
        6. Format using **raw markdown syntax**.
        7. CRITICAL: When creating JSON, you must properly escape all special characters: \\n, \\", \\\\.

        CRITICAL FORMATTING REQUIREMENTS: 
        - You must respond with ONLY a valid JSON object.
        - DO NOT wrap the JSON in code fences (no ```json or ``` at all).
        - DO NOT output any explanation, commentary, or extra text outside the JSON.
        - Your entire response must start with "{" and end with "}".
        - The JSON must exactly match the required schema.

        Required JSON schema: 
        {
            "title": "Title capturing real-world significance",
            "content": "Markdown content with proper escaping",
            "source_urls": ["url1", "url2", "url3"],
            "block_type": "information"
        }
    """,
    # output_schema=RealWorldImpactOutput,
    output_key="impact_output",
    tools=[exa_search]
)

# 7. Summary Agent (difficulty-adaptive)
summary_agent = LlmAgent(
    name="SummaryAgent",
    model="gemini-2.0-flash-lite",
    instruction="""
        You are a summarization expert. Your job is to distill the most critical information from all provided context into a series of 3-4 flash cards.

        Use ALL available data from {research_brief_output}, {research_deep_output}, {impact_output}, and all quiz activities.

        Adapt your flash cards to the user's difficulty level (BEGINNER, INTERMEDIATE, ADVANCED).

        Each flash card must have a "front" (a question or key term) and a "back" (a concise answer or definition appropriate to the difficulty level).

        CRITICAL FORMATTING REQUIREMENTS: 
        - You must respond with ONLY a valid JSON object.
        - DO NOT wrap the JSON in code fences (no ```json or ``` at all).
        - DO NOT output any explanation, commentary, or extra text outside the JSON.
        - Your entire response must start with "{" and end with "}".
        - The JSON must exactly match the required schema.

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
        AVOID generic words like "Explaining", "Understanding", "Introduction to", etc.
        Instead, focus on WHAT the topic actually IS or DOES. For "Blockchain": "Decentralized digital ledger technology ensuring transaction security".
        5. Generate exactly 5 relevant tags that are descriptive, specific, and concise (1-3 words each).

        CRITICAL FORMATTING REQUIREMENTS:
        - You must respond with ONLY a valid JSON object.
        - DO NOT wrap the JSON in code fences (no ```json or ``` at all).
        - DO NOT output any explanation, commentary, or extra text outside the JSON.
        - Your entire response must start with "{" and end with "}".
        - The JSON must exactly match the required schema.
        - Arrays must contain exactly the specified number of items.

        Required JSON schema:
        {
            "selected_category": "category_id_string",
            "short_description": "exactly 10 words or fewer describing the topic",
            "generated_tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
        }
    """,
    # output_schema=CategoryTagsDescriptionOutput,
    output_key="category_tags_description_output",
    tools=[get_categories_from_convex]
)

# 9. Thumbnail Generator Agent  
thumbnail_generator_agent = LlmAgent(
    name="ThumbnailGeneratorAgent",
    model="gemini-2.5-flash",
    instruction="""
        You are a visual design specialist. Your task is to find the perfect thumbnail for the educational topic provided.

        Process:
        1. Use the Serper image search tool to find 10 high-quality, license-free images related to the topic. Set the query parameter to the topic name.
        2. If the search result is empty, return null for both thumbnail_url and alt_text.
        3. Analyze the images for relevance, clarity, composition, and visual appeal.
        4. Select the single best image that is visually engaging, generic, has a background, is not an SVG, and is at least 512x512 pixels.
        5. Generate appropriate alt text for the selected image for accessibility.

        CRITICAL FORMATTING REQUIREMENTS:
        - You must respond with ONLY a valid JSON object.
        - DO NOT wrap the JSON in code fences (no ```json or ``` at all).
        - DO NOT output any explanation, commentary, or extra text outside the JSON.
        - Your entire response must start with "{" and end with "}".
        - The JSON must exactly match the required schema.
        - Use null (not the string "null") for empty values.

        Required JSON schema:
        {
            "thumbnail_url": "https://example.com/image.jpg",
            "alt_text": "Descriptive alt text for accessibility"
        }
    """,
    # output_schema=ThumbnailOutput,
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
        - Gather data from all previous agent outputs: {research_brief_output}, {research_deep_output}, {quiz_output}, {reorder_output}, {final_quiz_output}, {impact_output}, {summary_output}, {thumbnail_output}, {category_tags_description_output}.
        - Assemble these components into the final JSON structure.

        CRITICAL FORMATTING REQUIREMENTS:
        - You must respond with ONLY a valid JSON object.
        - DO NOT wrap the JSON in code fences (no ```json or ``` at all).
        - DO NOT output any explanation, commentary, or extra text outside the JSON.
        - Your entire response must start with "{" and end with "}".
        - The JSON must exactly match the required schema.
        - Extract only the flash_cards array from summary_output.
        - Use null for created_by if not provided.
        - publish_immediately must contain only one of the two following values [case-sensitive] - True (or) False. By default use True if not provided. 

        Required JSON schema:
        {
            "topic": "The educational topic name from user input",
            "difficulty": "The difficulty level from user input",
            "created_by": "The user ID from user input (or null if not provided)",
            "publish_immediately": "The publish flag from user input (either True or False [case-sensitive]. Default to True if not provided)",
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
    """,
    output_schema=FinalAssemblyOutput,
    output_key="final_module"
)

# 11. Convex Inserter Agent
convex_inserter_agent = LlmAgent(
    name="ConvexInserterAgent",
    model="gemini-2.5-flash",
    instruction="""
    You are a specialized agent responsible for inserting educational content into a Convex database. Your task is to take the complete JSON from the assembler agent and use a tool to insert it, and then return a JSON response with the required schema.

    YOUR PROCESS:
    1. Receive the complete {final_module} JSON from the assembler agent.
    2. Use the `insert_topic_to_convex` tool to insert the data into the database.
    3. Return a detailed result about the insertion process based on the tool's output.

    IMPORTANT: You must use the `insert_topic_to_convex` tool to interact with the Convex database. Do not try to output the database insertion command yourself.

    YOUR RESPONSE:
    - If the insertion is successful, report the topic ID and metadata.
    - If there are errors, clearly explain what went wrong and stop.

    CRITICAL FORMATTING REQUIREMENTS:
    - You must respond with ONLY a valid JSON object.
    - DO NOT wrap the JSON in code fences (no ```json or ``` at all).
    - DO NOT output any explanation, commentary, or extra text outside the JSON.
    - Your entire response must start with "{" and end with "}".
    - The JSON must exactly match the required schema.
    - All string values must be properly quoted.

    Required JSON schema:
    {
        "success": "Whether the insertion was successful",
        "topic_id": "The ID of the created topic if successful",
        "message": "Success message or error description",
        "metadata": "Additional metadata about the insertion"
    }
    """,
    # output_schema=ConvexInsertionResult,
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