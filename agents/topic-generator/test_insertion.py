#!/usr/bin/env python3
"""
Simple test script for insert_topic_to_convex function
"""

import os
import json
import re
from typing import List, Optional
from convex import ConvexClient
from google import genai
from google.genai import types

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("✅ Loaded .env file")
except ImportError:
    print("⚠️  python-dotenv not installed. Install with: pip install python-dotenv")
    print("   Or set CONVEX_URL manually: export CONVEX_URL='your_url_here'")

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
        
        # Create blocks - insert agent outputs directly matching schema
        order = 0
        
        # 1. Brief Research Block (information type)
        if research_brief.get("text"):
            client.mutation("blocks:createBlock", {
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
            order += 1
        
        # 2. Quiz Block (activity type)
        quiz = output_data.get("quiz", {})
        if quiz.get("questions"):
            client.mutation("blocks:createBlock", {
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
            order += 1
        
        # 3. Deep Research Block (information type)
        if research_deep.get("text"):
            client.mutation("blocks:createBlock", {
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
            order += 1
        
        # 4. Reorder Block (activity type)
        reorder = output_data.get("reorder", {})
        if reorder.get("question"):
            client.mutation("blocks:createBlock", {
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
            order += 1
        
        # 5. Real-World Impact Block (information type)
        if real_world_impact.get("content"):
            client.mutation("blocks:createBlock", {
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
            order += 1
        
        # 6. Final Quiz Block (activity type)
        final_quiz = output_data.get("final_quiz", {})
        if final_quiz.get("questions"):
            client.mutation("blocks:createBlock", {
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
            order += 1
        
        # 7. Summary Flash Cards Block (information type)
        flash_cards = output_data.get("flash_cards", [])
        if flash_cards:
            client.mutation("blocks:createBlock", {
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
            order += 1
        
        # Note: Thumbnail and category data are stored in the topic record itself,
        # not as separate blocks, to match the schema union constraints
        
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

# Minimal test data
minimal_test_data = {}

def run_test():
    """Run a simple test of the insert function"""
    print("🧪 Simple Convex Insert Test")
    print("-" * 30)
    
    # Check environment
    convex_url = os.environ.get("CONVEX_URL")
    if not convex_url:
        print("❌ CONVEX_URL not set.")
        print("   Options to fix this:")
        print("   1. Install python-dotenv: pip install python-dotenv")
        print("   2. Set manually: export CONVEX_URL='your_url_here'")
        print("   3. Add to your .env file: CONVEX_URL=your_url_here")
        
        # Check if .env file exists
        if os.path.exists(".env"):
            print("   ✅ .env file found - make sure it contains CONVEX_URL")
            with open(".env", "r") as f:
                content = f.read()
                if "CONVEX_URL" in content:
                    print("   ✅ CONVEX_URL found in .env file")
                else:
                    print("   ❌ CONVEX_URL not found in .env file")
        else:
            print("   ❌ .env file not found")
        return
    
    print("✅ Environment ready")
    print(f"📝 Testing with topic: '{minimal_test_data['topic']}'")
    
    # Run the test
    try:
        result = insert_topic_to_convex(json.dumps(minimal_test_data))
        
        if result.get("success"):
            print(f"✅ SUCCESS! Topic ID: {result.get('topic_id')}")
            print(f"📊 Exercises: {result.get('metadata', {}).get('exercise_count', 0)}")
        else:
            print(f"❌ FAILED: {result.get('error')}")

        # test_text = """
        # ## Understanding Huffman Encoding: An Intermediate Overview\n\nHuffman Encoding is a widely used lossless data compression algorithm crucial for efficiently storing and transmitting data. Developed by David A. Huffman, its primary goal is to minimize the total number of bits required to represent a given set of data by taking advantage of character frequencies. Unlike fixed-length encoding schemes where all characters receive the same number of bits (e.g., ASCII), Huffman encoding assigns variable-length codes: characters that appear more frequently in the data are given shorter binary codes, while less frequent characters receive longer codes. This frequency-based assignment results in an overall reduction in data size without any loss of information upon decompression.\n\nThe algorithm's core principle lies in constructing an optimal prefix code. A key characteristic of prefix codes is that no code word is a prefix of another code word, which is essential to prevent ambiguity during the decoding process. This is achieved through the construction of a Huffman tree using a greedy approach:\n- Frequency Analysis: The algorithm first calculates the frequency of occurrence for each unique character in the input data.\n- Tree Construction: These characters are then treated as leaf nodes in a binary tree. The two nodes with the lowest frequencies are repeatedly combined to form a new parent node, whose frequency is the sum of its children's frequencies. This process continues until a single root node remains, forming the Huffman tree.\n- Code Generation: By traversing this tree, typically assigning '0' to left branches and '1' to right branches, unique binary codes are generated for each character. The path from the root to a leaf node defines its code.\n\nKey principles and components include:\n- Lossless Compression: Original data can be perfectly reconstructed.\n- Variable-Length Coding: Shorter codes for frequent symbols, longer for rare ones.\n- Prefix Codes: Ensures unambiguous decoding.\n- Huffman Tree: A binary tree structure built based on symbol frequencies.\n- Greedy Algorithm: Builds the optimal tree by repeatedly merging the lowest-frequency nodes.\n\nThis technique is fundamental in various applications, including file formats like JPEG (for AC coefficients) and MP3, as well as data transmission protocols where reducing bandwidth usage is critical.
        # """

        # result = generate_embedding(test_text)

        print(result)
    except Exception as e:
        print(f"💥 ERROR: {e}")

if __name__ == "__main__":
    run_test()