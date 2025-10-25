"""
Simple Multi-Agent Topic Generator Agent using Google ADK
"""

import os
import requests
import json
import re
import sys
import time
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
        return [0.0] * 768


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

 
def insert_topic_to_convex(agent_output: str, user_id: str, topic: str) -> dict:
    """
    Insert topic data from agent output into Convex database
    
    Args:
        agent_output: JSON string of the complete agent output containing all necessary data
        user_id: ID of the user
        topic: The requested topic
        
    Returns:
        dict: Result with topic_id if successful, error message if failed
    """    
    # Get Convex URL from environment
    convex_url = os.environ.get("CONVEX_URL")
    if not convex_url:
        return {"success": False, "error": "CONVEX_URL environment variable not set"}
    
    # Initialize Convex client
    client = ConvexClient(convex_url)
    
    # Set default values for error handling
    topic_title = topic
    created_by = user_id
    
    try:
        # Parse the agent output JSON
        if isinstance(agent_output, str):
            output_data = json.loads(agent_output)
        else:
            output_data = agent_output
        
        # Extract data from agent output early for error handling
        topic_title = output_data.get("topic", topic_title)
        difficulty = output_data.get("difficulty", "beginner").lower()
        created_by = output_data.get("created_by", created_by)
        publish_immediately = output_data.get("publish_immediately", True)
            
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
        created_resources = {"topic_id": topic_id, "embedding_id": None, "block_ids": []}
        
        try:
            # Create embedding for semantic search
            embedding_vector = generate_embedding(research_brief["text"])
            embedding_id = client.mutation("embeddings:createEmbedding", {
                "topicId": topic_id,
                "embedding": embedding_vector,
                "contentType": "research_brief",
                "difficulty": difficulty,
                "categoryId": category_id
            })
            created_resources["embedding_id"] = embedding_id
            
            # Create blocks - insert agent outputs directly matching schema
            order = 0
        
            # 1. Brief Research Block (information type)
            if research_brief.get("text"):
                block_id = client.mutation("blocks:createBlock", {
                    "topicId": topic_id,
                    "type": "information",
                    "content": {
                        "step": "research_brief",
                        "data": {
                            "title": research_brief.get("title", ""),
                            "text": research_brief["text"],
                            "depth": "brief"
                        }
                    },
                    "order": order
                })
                created_resources["block_ids"].append(block_id)
                order += 1
        
            # 2. Quiz Block (activity type)
            quiz = output_data.get("quiz", {})
            if quiz.get("questions"):
                block_id = client.mutation("blocks:createBlock", {
                    "topicId": topic_id,
                    "type": "activity",
                    "content": {
                        "step": "quiz",
                        "data": {
                            "questions": quiz["questions"]
                        }
                    },
                    "order": order
                })
                created_resources["block_ids"].append(block_id)
                order += 1
        
            # 3. Deep Research Block (information type)
            if research_deep.get("text"):
                block_id = client.mutation("blocks:createBlock", {
                    "topicId": topic_id,
                    "type": "information",
                    "content": {
                        "step": "research_deep",
                        "data": {
                            "title": research_deep.get("title", ""),
                            "text": research_deep["text"],
                            "depth": "deep"
                        }
                    },
                    "order": order
                })
                created_resources["block_ids"].append(block_id)
                order += 1
        
            # 4. Reorder Block (activity type)
            reorder = output_data.get("reorder", {})
            if reorder.get("question"):
                block_id = client.mutation("blocks:createBlock", {
                    "topicId": topic_id,
                    "type": "activity",
                    "content": {
                        "step": "reorder",
                        "data": {
                            "question": reorder["question"],
                            "options": reorder["options"],
                            "correct_answer": reorder["correct_answer"],
                            "explanation": reorder["explanation"]
                        }
                    },
                    "order": order
                })
                created_resources["block_ids"].append(block_id)
                order += 1
        
            # 5. Real-World Impact Block (information type)
            if real_world_impact.get("content"):
                block_id = client.mutation("blocks:createBlock", {
                    "topicId": topic_id,
                    "type": "information",
                    "content": {
                        "step": "real_world_impact",
                        "data": {
                            "title": real_world_impact.get("title", ""),
                            "content": real_world_impact["content"],
                            "source_urls": real_world_impact.get("source_urls", [])
                        }
                    },
                    "order": order
                })
                created_resources["block_ids"].append(block_id)
                order += 1
        
            # 6. Final Quiz Block (activity type)
            final_quiz = output_data.get("final_quiz", {})
            if final_quiz.get("questions"):
                block_id = client.mutation("blocks:createBlock", {
                    "topicId": topic_id,
                    "type": "activity",
                    "content": {
                        "step": "final_quiz",
                        "data": {
                            "questions": final_quiz["questions"]
                        }
                    },
                    "order": order
                })
                created_resources["block_ids"].append(block_id)
                order += 1
        
            # 7. Summary Flash Cards Block (information type)
            flash_cards = output_data.get("flash_cards", [])
            if flash_cards:
                block_id = client.mutation("blocks:createBlock", {
                    "topicId": topic_id,
                    "type": "information",
                    "content": {
                        "step": "summary",
                        "data": {
                            "flash_cards": flash_cards
                        }
                    },
                    "order": order
                })
                created_resources["block_ids"].append(block_id)
                order += 1
        
            # Note: Thumbnail and category data are stored in the topic record itself,
            # not as separate blocks, to match the schema union constraints
            
            # Publish if requested
            if publish_immediately:
                client.mutation("topics:publishTopic", {"topicId": topic_id})
        
        except Exception as block_error:
            # If any block creation fails, clean up all created resources
            print(f"Error creating blocks, cleaning up resources: {str(block_error)}")
            
            # Delete all created blocks
            for block_id in created_resources["block_ids"]:
                try:
                    client.mutation("blocks:deleteBlock", {"blockId": block_id})
                except Exception as cleanup_error:
                    print(f"Warning: Failed to delete block {block_id}: {str(cleanup_error)}")
            
            # Delete embedding if created
            if created_resources["embedding_id"]:
                try:
                    client.mutation("embeddings:deleteEmbedding", {"embeddingId": created_resources["embedding_id"]})
                except Exception as cleanup_error:
                    print(f"Warning: Failed to delete embedding {created_resources['embedding_id']}: {str(cleanup_error)}")
            
            # Delete topic
            try:
                client.mutation("topics:deleteTopic", {"topicId": topic_id})
            except Exception as cleanup_error:
                print(f"Warning: Failed to delete topic {topic_id}: {str(cleanup_error)}")
            
            # Re-raise the original exception without creating notifications here
            # The outer handler will create the error notification
            raise block_error
        
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
                "userId": created_by,
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
    except Exception as e:
        # If we have a topic_id in locals(), it means topic creation succeeded but something else failed
        # We should clean up the topic and any associated resources
        if 'topic_id' in locals():
            print(f"Error during topic insertion, cleaning up topic {topic_id}: {str(e)}")
            
            try:
                # Try to get all blocks for this topic and delete them
                blocks = client.query("blocks:getBlocksByTopicId", {"topicId": topic_id})
                for block in blocks:
                    try:
                        client.mutation("blocks:deleteBlock", {"blockId": block["_id"]})
                    except Exception as cleanup_error:
                        print(f"Warning: Failed to delete block {block['_id']}: {str(cleanup_error)}")
                
                # Try to delete any embeddings for this topic
                try:
                    embeddings = client.query("embeddings:getEmbeddingsByTopicId", {"topicId": topic_id})
                    for embedding in embeddings:
                        try:
                            client.mutation("embeddings:deleteEmbedding", {"embeddingId": embedding["_id"]})
                        except Exception as cleanup_error:
                            print(f"Warning: Failed to delete embedding {embedding['_id']}: {str(cleanup_error)}")
                except Exception as query_error:
                    print(f"Warning: Could not query embeddings for cleanup: {str(query_error)}")
                
                # Finally delete the topic
                client.mutation("topics:deleteTopic", {"topicId": topic_id})
                print(f"Successfully cleaned up topic {topic_id} and associated resources")
                
            except Exception as cleanup_error:
                print(f"Warning: Failed to clean up topic {topic_id}: {str(cleanup_error)}")
        
        # Create error notification
        try:
            # Get the notification type for errors
            notification_types = client.query("notifications:getNotificationTypes")
            error_notification_type = None
            for nt in notification_types:
                if nt.get("key") == "error":
                    error_notification_type = nt
                    break
            
            # Create error notification if notification type exists
            if error_notification_type and created_by:
                error_notification_data = {
                    "userId": created_by,
                    "notificationTypeKey": error_notification_type["_id"],
                    # "title": "Topic Generation Failed",
                    # "message": f"An error occurred while generating information for the topic '{topic_title}'. The system will retry up to 3 times automatically.",
                    "title": "Topic Generation retry In Progress",
                    "message": f"We are retrying to generate information for '{topic_title}' due to a minor issue.",
                    "data": {
                        "error": str(e),
                        "topic_title": topic_title
                    }
                }
                
                try:
                    notification_id = client.mutation("notifications:createNotification", error_notification_data)
                    print(f"Successfully created error notification with ID: {notification_id}")
                except Exception as notification_error:
                    print(f"Warning: Failed to create error notification: {str(notification_error)}")
            else:
                print("Warning: error notification type not found in database")
        except Exception as notification_error:
            print(f"Warning: Failed to create error notification: {str(notification_error)}")
        
        # Return failure response after creating notification
        return {
            "success": False,
            "topic_id": None,
            "message": f"Error inserting topic: {str(e)}",
            "metadata": None
        }

# =============================================================================
# OUTPUT SCHEMAS
# =============================================================================

# Base schema for all agent outputs
class BaseAgentOutput(BaseModel):
    step: str = Field(description="The agent step identifier")
    type: str = Field(description="The content type")
    data: Dict[str, Any] = Field(description="The actual data payload")

# Data schemas for different agent types
class ResearchData(BaseModel):
    title: str = Field(description="Clear, descriptive title")
    text: str = Field(description="Markdown content with proper escaping")
    depth: str = Field(description="Research depth: 'brief' or 'deep'")

class Question(BaseModel):
    question: str = Field(description="The question text")
    options: List[str] = Field(description="List of answer options")
    correct_answer: str = Field(description="The correct answer")
    explanation: str = Field(description="Explanation of why the answer is correct")

class QuizData(BaseModel):
    questions: List[Question] = Field(description="List of quiz questions")

class ReorderData(BaseModel):
    question: str = Field(description="Your reorder question here")
    options: List[str] = Field(description="List of items to reorder")
    correct_answer: List[str] = Field(description="The options in correct order as an array")
    explanation: str = Field(description="Explanation of the correct order")

class RealWorldImpactData(BaseModel):
    title: str = Field(description="Title capturing real-world significance")
    content: str = Field(description="Markdown content with proper escaping")
    source_urls: List[str] = Field(description="URLs of sources used")

class FlashCard(BaseModel):
    front: str = Field(description="Question or key term")
    back: str = Field(description="Answer or definition")

class SummaryData(BaseModel):
    flash_cards: List[FlashCard] = Field(description="List of 3-4 flash cards")

class ThumbnailData(BaseModel):
    thumbnail_url: Optional[str] = Field(description="URL of the selected thumbnail image or null if no image found")
    alt_text: Optional[str] = Field(description="Alt text for the image or null if no image found")

class CategoryTagsDescriptionData(BaseModel):
    selected_category: str = Field(description="Selected category ID string")
    short_description: str = Field(description="Exactly 10 words or fewer describing the topic")
    generated_tags: List[str] = Field(description="List of exactly 5 relevant tags", min_items=5, max_items=5)

# Specific agent output schemas
class ResearchAgentOutput(BaseAgentOutput):
    step: str = Field(description="research_brief or research_deep")
    type: str = Field(default="information", description="Content type")
    data: ResearchData = Field(description="Research data")

class QuizAgentOutput(BaseAgentOutput):
    step: str = Field(default="quiz", description="Agent step")
    type: str = Field(default="activity", description="Content type")
    data: QuizData = Field(description="Quiz data")

class ReorderAgentOutput(BaseAgentOutput):
    step: str = Field(default="reorder", description="Agent step")
    type: str = Field(default="activity", description="Content type")
    data: ReorderData = Field(description="Reorder data")

class FinalQuizAgentOutput(BaseAgentOutput):
    step: str = Field(default="final_quiz", description="Agent step")
    type: str = Field(default="activity", description="Content type")
    data: QuizData = Field(description="Final quiz data")

class RealWorldImpactAgentOutput(BaseAgentOutput):
    step: str = Field(default="real_world_impact", description="Agent step")
    type: str = Field(default="information", description="Content type")
    data: RealWorldImpactData = Field(description="Real world impact data")

class SummaryAgentOutput(BaseAgentOutput):
    step: str = Field(default="summary", description="Agent step")
    type: str = Field(default="information", description="Content type")
    data: SummaryData = Field(description="Summary data")

class ThumbnailAgentOutput(BaseAgentOutput):
    step: str = Field(default="thumbnail", description="Agent step")
    type: str = Field(default="media", description="Content type")
    data: ThumbnailData = Field(description="Thumbnail data")

class CategoryTagsDescriptionAgentOutput(BaseAgentOutput):
    step: str = Field(default="category_tags_description", description="Agent step")
    type: str = Field(default="metadata", description="Content type")
    data: CategoryTagsDescriptionData = Field(description="Category, tags and description data")

class FinalAssemblyOutput(BaseModel):
    topic: str = Field(description="The educational topic name from user input")
    difficulty: str = Field(description="The difficulty level from user input")
    created_by: Optional[str] = Field(description="The user ID from user input (or null if not provided)")
    publish_immediately: bool = Field(description="The publish flag from user input (either True or False, default True)")
    research_brief: ResearchData = Field(description="Brief research results")
    research_deep: ResearchData = Field(description="Deep research results")
    quiz: QuizData = Field(description="Quiz activity with 3 questions")
    reorder: ReorderData = Field(description="Reorder activity")
    final_quiz: QuizData = Field(description="Final quiz with 5 questions")
    real_world_impact: RealWorldImpactData = Field(description="Real-world impact analysis")
    flash_cards: List[FlashCard] = Field(description="Summary flash cards")
    thumbnail: ThumbnailData = Field(description="Selected thumbnail")
    category_tags_description: CategoryTagsDescriptionData = Field(description="Selected category, description, and generated tags")

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
        5. Write content using this FLEXIBLE markdown format (adapt headings to be topic-specific and engaging):
        
        ### [Creative heading about what the topic is - e.g., "Understanding Neural Networks", "The World of Quantum Computing", "Exploring Renewable Energy"]
        [Answer paragraph explaining what the topic is]
        
        ### [Creative heading about importance - e.g., "Why This Matters Today", "The Growing Impact", "Why You Should Care"]
        [Answer paragraph explaining importance and relevance]
        
        ### [Topic-specific heading for components - e.g., "Core Elements", "Essential Parts", "Key Building Blocks", "Main Features"]
        - **Component 1**: Brief explanation
        - **Component 2**: Brief explanation
        - **Component 3**: Brief explanation
        
        ### [Topic-specific heading for applications - e.g., "Real-World Uses", "Where We See This", "Practical Applications", "Current Examples"]
        - **Application 1**: Brief description
        - **Application 2**: Brief description
        - **Application 3**: Brief description

        6. Format requirements:
        - Use ### for all headings (exactly 3 hash symbols)
        - Use **bold text** for key terms and important concepts
        - Use bullet points with - for ALL lists
        - Use *italic* for emphasis where needed
        - Each answer paragraph should be 2-3 sentences maximum
        - Keep bullet points concise (1-2 sentences each)
        - Make headings engaging and topic-specific rather than generic
        - Vary your language and avoid repetitive phrasing
        7. Ensure content is appropriate for the specified difficulty level.
        8. CRITICAL: When creating JSON, you must properly escape all special characters:
        - Escape newlines as \\n
        - Escape quotes as \\"
        - Escape backslashes as \\\\
        9. ABSOLUTE RULES for output:
        - Respond with ONLY a valid JSON object.
        - DO NOT wrap the JSON inside code fences (e.g., no ```json or ``` at all).
        - DO NOT output any explanation, commentary, or extra text outside the JSON.
        - Your entire response must start with "{" and end with "}".
        - Ensure JSON matches the schema EXACTLY.

        Required JSON schema:
        {
            "step": "research_brief",
            "type": "information",
            "data": {
                "title": "Clear, descriptive title",
                "text": "Markdown content with proper escaping",
                "depth": "brief"
            }
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
            "step": "quiz",
            "type": "activity",
            "data": {
                "questions": [
                    {
                        "question": "Your question text here",
                        "options": ["Option A", "Option B", "Option C", "Option D"],
                        "correct_answer": "Option A",
                        "explanation": "Explanation why this is correct"
                    }
                ]
            }
        }
    """,
    output_schema=QuizAgentOutput,
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
        3. Write content using this FLEXIBLE markdown format (create engaging, topic-specific headings):
        
        ### [Creative heading about internal workings - e.g., "Under the Hood", "How It Actually Works", "The Inner Mechanics", "Behind the Scenes"]
        [Answer paragraph explaining internal mechanisms/processes]
        
        ### [Creative heading about advanced aspects - e.g., "Advanced Techniques", "Cutting-Edge Methods", "Professional Approaches", "Next-Level Strategies"]
        [Answer paragraph about sophisticated approaches]
        
        ### [Topic-specific technical heading - e.g., "Implementation Tools", "Technical Stack", "Core Technologies", "Development Methods"]
        - **Method/Tool 1**: Technical explanation
        - **Method/Tool 2**: Technical explanation
        - **Method/Tool 3**: Technical explanation
        
        ### [Problem-solution heading - e.g., "Common Hurdles", "Overcoming Obstacles", "Challenges & Solutions", "Problem-Solving Approaches"]
        - **Challenge 1**: How it's addressed
        - **Challenge 2**: How it's addressed

        ### [Industry-specific heading - e.g., "Professional Standards", "Industry Guidelines", "Best Practices", "Expert Recommendations"]
        - **Practice 1**: Professional implementation detail
        - **Practice 2**: Professional implementation detail
        - **Practice 3**: Professional implementation detail

        4. Format requirements:
        - Use ### for all headings (exactly 3 hash symbols)
        - Use **bold text** for key terms and important concepts
        - Use bullet points with - for ALL lists
        - Each answer paragraph should be 2-3 sentences maximum
        - Keep bullet points concise but technical (1-2 sentences each)
        - Create engaging, topic-specific headings that avoid generic templates
        - Use varied language and avoid repetitive phrasing across sections
        5. Ensure content is appropriate for the specified difficulty level.
        6. CRITICAL: When creating JSON, you must properly escape all special characters: \\n, \\", \\\\.

        CRITICAL FORMATTING REQUIREMENTS:
        - You must respond with ONLY a valid JSON object.
        - DO NOT wrap the JSON in code fences (no ```json or ``` at all).
        - DO NOT output any explanation, commentary, or extra text outside the JSON.
        - Your entire response must start with "{" and end with "}".
        - The JSON must exactly match the required schema.

        Required JSON schema:
        {
            "step": "research_deep",
            "type": "information",
            "data": {
                "title": "Clear, descriptive title",
                "text": "Markdown content with proper escaping",
                "depth": "deep"
            }
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
        - Has the correct_answer field set to an ARRAY containing the options in the correct order. For example, if the correct sequence is:
        1. First step
        2. Second step  
        3. Third step
        4. Fourth step
        Then correct_answer should be set as ["First step", "Second step", "Third step", "Fourth step"]
        - Includes a clear explanation of the correct sequence

        CRITICAL FORMATTING REQUIREMENTS:
        - You must respond with ONLY a valid JSON object.
        - DO NOT wrap the JSON in code fences (no ```json or ``` at all).
        - DO NOT output any explanation, commentary, or extra text outside the JSON.
        - Your entire response must start with "{" and end with "}".
        - The JSON must exactly match the required schema.

        Required JSON schema:
        {
            "step": "reorder",
            "type": "activity",
            "data": {
                "question": "Your reorder question here",
                "options": ["First item", "Second item", "Third item", "Fourth item"],
                "correct_answer": ["Second item", "First item", "Third item", "Fourth item"],
                "explanation": "Explanation of the correct order"
            }
        }
    """,
    output_schema=ReorderAgentOutput,
    output_key="reorder_output"
)

# 5. Real-World Impact Agent
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
        4. Write content using this FLEXIBLE markdown format (create compelling, topic-specific headings):
        
        ### [Creative heading about current relevance - e.g., "Why This Matters Now", "Today's Significance", "Current Impact", "The Modern Relevance"]
        [Answer paragraph explaining current relevance and importance]
        
        ### [Creative heading about real-world presence - e.g., "Where We Encounter This", "Seeing It in Action", "Real-World Presence", "All Around Us"]
        [Answer paragraph about widespread current usage]
        
        ### [Topic-specific applications heading - e.g., "Practical Uses", "Industry Applications", "Real-World Examples", "Current Implementations"]
        - **Industry/Field 1**: Specific example of how it's used
        - **Industry/Field 2**: Specific example of how it's used
        - **Industry/Field 3**: Specific example of how it's used
        
        ### [Dynamic trends heading - e.g., "Latest Developments", "What's New", "Emerging Trends", "Recent Breakthroughs", "Current Evolution"]
        - **Trend 1**: Recent development or innovation
        - **Trend 2**: Recent development or innovation
        - **Trend 3**: Recent development or innovation
        
        ### [Personal impact heading - e.g., "How It Affects You", "Personal Impact", "In Your Daily Life", "Everyday Influence"]
        - **Example 1**: How it affects ordinary people
        - **Example 2**: How it affects ordinary people

        5. Format requirements:
        - Use ### for all headings (exactly 3 hash symbols)
        - Use **bold text** for key terms and important concepts
        - Use bullet points with - for ALL lists
        - Each answer paragraph should be 2-3 sentences maximum
        - Keep bullet points concrete and specific (1-2 sentences each)
        - Focus on current, real examples that people can relate to
        - Create compelling, topic-specific headings that capture attention
        - Use varied language and avoid repetitive phrasing
        6. CRITICAL: When creating JSON, you must properly escape all special characters: \\n, \\", \\\\.

        CRITICAL FORMATTING REQUIREMENTS: 
        - You must respond with ONLY a valid JSON object.
        - DO NOT wrap the JSON in code fences (no ```json or ``` at all).
        - DO NOT output any explanation, commentary, or extra text outside the JSON.
        - Your entire response must start with "{" and end with "}".
        - The JSON must exactly match the required schema.

        Required JSON schema: 
        {
            "step": "real_world_impact",
            "type": "information",
            "data": {
                "title": "Title capturing real-world significance",
                "content": "Markdown content with proper escaping",
                "source_urls": ["url1", "url2", "url3"]
            }
        }
    """,
    # output_schema=RealWorldImpactOutput,
    output_key="impact_output",
    tools=[exa_search]
)

# 6. Final Quiz Agent (5 questions, difficulty-adaptive)
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
            "step": "final_quiz",
            "type": "activity",
            "data": {
                "questions": [
                    {
                        "question": "Your question text here",
                        "options": ["Option A", "Option B", "Option C", "Option D"],
                        "correct_answer": "Option A",
                        "explanation": "Detailed explanation why this is correct"
                    }
                ]
            }
        }
    """,
    output_schema=FinalQuizAgentOutput,
    output_key="final_quiz_output"
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
            "step": "summary",
            "type": "information",
            "data": {
                "flash_cards": [
                    {
                        "front": "Question or key term here",
                        "back": "Concise answer or definition here"
                    }
                ]
            }
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
            "step": "category_tags_description",
            "type": "metadata",
            "data": {
                "selected_category": "category_id_string",
                "short_description": "exactly 10 words or fewer describing the topic",
                "generated_tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
            }
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
            "step": "thumbnail",
            "type": "media",
            "data": {
                "thumbnail_url": "https://example.com/image.jpg",
                "alt_text": "Descriptive alt text for accessibility"
            }
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
        - The user input will contain: topic, difficulty, created_by, and publish_immediately (optional).
        - Gather data from all previous agent outputs: {research_brief_output}, {research_deep_output}, {quiz_output}, {reorder_output}, {final_quiz_output}, {impact_output}, {summary_output}, {thumbnail_output}, {category_tags_description_output}.
        - Extract the "data" field from each agent output and assemble into the final structure.

        CRITICAL FORMATTING REQUIREMENTS:
        - You must respond with ONLY a valid JSON object.
        - DO NOT wrap the JSON in code fences (no ```json or ``` at all).
        - DO NOT output any explanation, commentary, or extra text outside the JSON.
        - Your entire response must start with "{" and end with "}".
        - The JSON must exactly match the required schema.
        - Extract only the "data" field from each agent output.
        - Extract only the flash_cards array from summary_output.data.
        - publish_immediately must contain only one of the two following values [case-sensitive] - True (or) False. By default use True if not provided. 

        Required JSON schema:
        {
            "topic": "The educational topic name from user input",
            "difficulty": "The difficulty level from user input",
            "created_by": "The user ID from user input",
            "publish_immediately": "The publish flag from user input (either True or False [case-sensitive]. Default to True if not provided)",
            "research_brief": {research_brief_output.data},
            "research_deep": {research_deep_output.data},
            "quiz": {quiz_output.data},
            "reorder": {reorder_output.data},
            "final_quiz": {final_quiz_output.data},
            "real_world_impact": {impact_output.data},
            "flash_cards": [{summary_output.data.flash_cards}],
            "thumbnail": {thumbnail_output.data},
            "category_tags_description": {category_tags_description_output.data}
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
    2. Extract the created_by and topic from the JSON for sending it as parameters to the `insert_topic_to_convex` tool.
    3. Use the `insert_topic_to_convex` tool to insert the data into the database.
    4. Return a detailed result about the insertion process based on the tool's output.

    When calling the tool, you must:
    1. Parse the JSON to extract the user_id (from created_by field) and topic name
    2. Call the tool with these parameters: insert_topic_to_convex(json_string, user_id=extracted_user_id, topic=extracted_topic)
    3. This ensures proper error notifications even if the main processing fails

    IMPORTANT: You must use the `insert_topic_to_convex` tool to interact with the Convex database. Do not try to output the database insertion command yourself.

    YOUR RESPONSE:
    - If the insertion is successful (tool returns success: true), set success to true and report the topic ID and metadata.
    - If there are errors (tool returns success: false), set success to false and clearly explain what went wrong.
    - ALWAYS mirror the success status from the tool's response.

    CRITICAL FORMATTING REQUIREMENTS:
    - You must respond with ONLY a valid JSON object.
    - DO NOT wrap the JSON in code fences (no ```json or ``` at all).
    - DO NOT output any explanation, commentary, or extra text outside the JSON.
    - Your entire response must start with "{" and end with "}".
    - The JSON must exactly match the required schema.
    - All string values must be properly quoted.
    - The success field must be a boolean (true or false), not a string.

    Required JSON schema:
    {
        "success": "true if insertion is successful or false if some error occurred",
        "topic_id": "The ID of the created topic if successful, null if failed",
        "message": "Success message or error description",
        "metadata": "Additional metadata about the insertion, null if failed"
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