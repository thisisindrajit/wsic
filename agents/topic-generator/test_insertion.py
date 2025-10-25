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
                    "title": "Topic Generation Failed",
                    "message": f"An error occurred while generating information for the topic '{topic_title}'. The system will retry up to 3 times automatically.",
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

# Minimal test data
minimal_test_data = {
"topic": "Hedge funds",
"difficulty": "intermediate",
"created_by": "q3RZR7NPMo2BK9QRtiKoQGpAs3aBGYWZ",
"publish_immediately": True,
"research_brief": {
"title": "Hedge Funds: An Intermediate Overview",
"text": "### What is Hedge Funds?\nA hedge fund is a privately managed investment fund that pools capital from accredited investors or institutions to employ sophisticated strategies aimed at generating high returns. Unlike traditional mutual funds, hedge funds are subject to fewer regulatory restrictions, granting them greater flexibility in their investment approaches and asset allocation.\n\n### Why does Hedge Funds matter?\nHedge funds are significant because they offer the potential for absolute returns, aiming to generate positive performance regardless of market conditions through diverse and often complex strategies. They also provide investors with diversification benefits, acting as an alternative asset class that can complement traditional portfolios and manage various market risks.\n\n### Key Components/Features\n- Pooled Investment Vehicle: Funds from multiple qualified investors are aggregated, allowing for larger-scale investments and access to more specialized opportunities.\n- Active Management & Flexible Strategies: Managed by experienced professionals who utilize a wide array of investment techniques, including short selling, leverage, and derivatives, across various asset classes.\n- Accredited Investors: Generally accessible only to sophisticated investors with high net worth or institutional clients, due to their complex nature and regulatory exemptions.\n- Performance-Based Fee Structure: Typically involves a management fee (e.g., 2% of assets under management) and a performance fee (e.g., 20% of profits, often with a high-water mark).\n\n### Common Applications\n- Capital Growth: Seeking substantial appreciation of invested capital through aggressive and opportunistic investment strategies.\n- Portfolio Diversification: Utilized by institutional and wealthy investors to add non-correlated returns and reduce overall portfolio volatility, enhancing risk-adjusted returns.\n- Market Neutrality: Employing strategies designed to profit from relative price movements rather than overall market direction, aiming for consistent returns in different market cycles.\n- Access to Alternative Investments: Providing exposure to less liquid assets and advanced trading methodologies not available through conventional investment products.",
"depth": "brief"
},
"research_deep": {
"title": "Intermediate Guide to Hedge Fund Operations and Strategies",
"text": "### How does Hedge Funds work internally?\nHedge funds operate by pooling capital from accredited investors to execute diverse and often complex strategies. Internally, managers utilize sophisticated analytical methods, including quantitative modeling and high-frequency data analytics, to identify investment opportunities and generate alpha. They aim to deliver positive returns relative to risk, often employing leverage and derivatives.\n\n### What are the advanced techniques/methods?\nAdvanced techniques employed by hedge funds extend beyond basic directional bets. These include quantitative modeling, leveraging complex algorithms and statistical arbitrage to identify fleeting market inefficiencies. Machine learning for predictive analysis and sentiment analysis are also utilized to extract insights from vast datasets and guide trading decisions.\n\n### Technical Implementation Details\n- Quantitative Modeling Platforms: These platforms integrate statistical arbitrage and machine learning algorithms to process high-volume market data in real-time for improved trade execution and risk optimization. Examples include proprietary systems and specialized software that handle complex mathematical models.\n- Risk Management Frameworks: Tools like Northstar and ABC Quant's Risk Shell provide comprehensive solutions for market risk management, performance analysis, real-time alerts, and liquidity management, helping funds to monitor and control various risk exposures.\n- Portfolio Construction Tools: Software such as AlternativeSoft and HedgeSight enable managers to build and compare multiple model portfolios, optimize asset allocation, and align investments with specific risk preferences and return targets.\n\n### Industry Best Practices\n- Operational Due Diligence (ODD): A crucial process involving a rigorous examination of a hedge fund's operations, including staffing, technology infrastructure, compliance processes, and third-party service providers, to identify and mitigate operational risks.\n- Robust Compliance Programs: Developing and maintaining a comprehensive hedge fund compliance program is essential, covering internal controls, regulatory reporting, and adherence to evolving financial regulations. This often involves specialized compliance teams and documentation.\n- Transparent Investor Relations: Engaging in clear and consistent communication with investors, often including detailed due diligence questionnaires (DDQs), to provide granular information about strategies, risk management, and performance.\n\n### Challenges and Solutions\n- Liquidity Management: Hedge funds face challenges in managing liquidity, especially when holding illiquid assets or during periods of high redemption requests. Solutions involve maintaining liquidity buffers (cash holdings and available borrowing) and implementing redemption gates or side pockets to control outflows.\n- Regulatory Scrutiny and Compliance Costs: Increased regulatory oversight since the 2008 financial crisis has led to higher compliance burdens. Funds address this by investing in robust compliance frameworks, engaging with regulatory hosting platforms, and internalizing compliance functions.\n- Fee Compression: Pressure on management and performance fees necessitates efficiency. Funds are exploring automated DDQ solutions and optimizing operational processes to reduce costs and demonstrate value beyond traditional fee structures.",
"depth": "deep"
},
"quiz": {
"questions": [
{
"question": "What is a key characteristic that distinguishes hedge funds from traditional mutual funds?",
"options": [
"Hedge funds are only available to retail investors.",
"Hedge funds are subject to more regulatory restrictions.",
"Hedge funds employ less flexible investment strategies.",
"Hedge funds have fewer regulatory restrictions."
],
"correct_answer": "Hedge funds have fewer regulatory restrictions.",
"explanation": "Hedge funds are subject to fewer regulations, allowing them to use more complex investment strategies and access a wider range of assets, unlike mutual funds."
},
{
"question": "Besides capital growth, what is another common application of hedge funds?",
"options": [
"Restricting access to alternative investments.",
"Increasing portfolio volatility.",
"Providing portfolio diversification.",
"Focusing solely on market direction."
],
"correct_answer": "Providing portfolio diversification.",
"explanation": "Hedge funds are used to add non-correlated returns to a portfolio and reduce overall portfolio volatility, enhancing risk-adjusted returns."
},
{
"question": "What type of investors typically have access to hedge funds?",
"options": [
"Retail investors with any level of net worth.",
"Accredited investors with high net worth or institutional clients.",
"All types of investors, regardless of sophistication.",
"Only investors who prefer low-risk investments."
],
"correct_answer": "Accredited investors with high net worth or institutional clients.",
"explanation": "Due to their complex nature and regulatory exemptions, hedge funds are generally accessible only to sophisticated investors like those with high net worth or institutional clients."
}
]
},
"reorder": {
"question": "Reorder the following steps to reflect the typical process for managing liquidity challenges in a hedge fund.",
"options": [
"Implement redemption gates or side pockets to control outflows.",
"Maintain liquidity buffers (cash holdings and available borrowing).",
"Address challenges by maintaining liquidity buffers."
],
"correct_answer": [
"Address challenges by maintaining liquidity buffers.",
"Maintain liquidity buffers (cash holdings and available borrowing).",
"Implement redemption gates or side pockets to control outflows."
],
"explanation": "Hedge funds address liquidity challenges by first establishing liquidity buffers (cash and borrowing), then they implement tools like redemption gates if necessary to manage outflows."
},
"final_quiz": {
"questions": [
{
"question": "What is a primary challenge faced by hedge funds in managing liquidity, particularly when dealing with illiquid assets?",
"options": [
"Maintaining high management fees.",
"Complying with stringent regulatory requirements.",
"Meeting redemption requests during periods of high outflows.",
"Generating absolute returns."
],
"correct_answer": "Meeting redemption requests during periods of high outflows.",
"explanation": "Hedge funds struggle to meet redemption requests when investors seek to withdraw funds, especially when a fund's assets are not easily convertible to cash."
},
{
"question": "Besides institutional investment, what is a significant real-world application of hedge funds?",
"options": [
"Restricting market liquidity.",
"Contributing to market stabilization through various trading strategies.",
"Limiting access to alternative investments.",
"Decreasing the use of advanced technologies like AI."
],
"correct_answer": "Contributing to market stabilization through various trading strategies.",
"explanation": "Hedge funds can contribute to market efficiency and liquidity by taking both long and short positions, which can help moderate extreme price swings."
},
{
"question": "Which analytical method is MOSTLY used by hedge funds to extract insights from vast datasets and guide trading decisions?",
"options": [
"Fundamental analysis",
"Sentiment analysis",
"Technical analysis",
"Ratio analysis"
],
"correct_answer": "Sentiment analysis",
"explanation": "Sentiment analysis is used to analyze large amounts of unstructured data to gauge market sentiment and make trading decisions."
},
{
"question": "What is a key benefit provided by hedge funds to investors, particularly in volatile market conditions?",
"options": [
"Guaranteed positive returns regardless of market conditions.",
"The potential for absolute returns, aiming for positive performance irrespective of market trends.",
"Limited access to alternative investments.",
"Lowering portfolio diversification."
],
"correct_answer": "The potential for absolute returns, aiming for positive performance irrespective of market trends.",
"explanation": "Hedge funds aim to generate positive returns regardless of overall market performance, providing a strategy to manage risk during volatile periods."
},
{
"question": "What is the main goal of Operational Due Diligence (ODD) in the context of hedge funds?",
"options": [
"To maximize fund management fees.",
"To ensure compliance with marketing regulations.",
"To identify and mitigate operational risks within the fund.",
"To provide investors with detailed financial statements."
],
"correct_answer": "To identify and mitigate operational risks within the fund.",
"explanation": "ODD is a rigorous examination of a hedge fund's operations to identify any weaknesses that could pose a threat to investors, ensuring that the fund is functioning efficiently and within legal boundaries."
}
]
},
"real_world_impact": {
"title": "Hedge Funds: Navigating Volatility and Shaping Global Finance Today",
"content": "### Why does Hedge Funds matter today?\nHedge funds are more critical than ever in today's dynamic global financial landscape. They offer sophisticated strategies aimed at absolute returns, seeking positive performance irrespective of market conditions, which is crucial during periods of high volatility. Their role in portfolio diversification and accessing alternative investments makes them a vital component for institutional and wealthy investors looking to manage risk and enhance returns in complex markets.\n\n### Where do we see Hedge Funds in action?\nHedge funds are actively involved in nearly every facet of the financial markets, from equity and bond trading to complex derivatives and commodities. They deploy quantitative modeling and machine learning for predictive analysis to exploit fleeting market inefficiencies, impacting price discovery and liquidity across global exchanges. Their significant assets under management (AUM), recently reaching record levels, demonstrate their widespread influence on market dynamics.\n\n### Real-World Applications\n- Institutional Investment Management: Pension funds and university endowments use hedge funds to diversify their portfolios and achieve stable returns, especially during market downturns.\n- Market Stabilization: By taking both long and short positions, hedge funds can contribute to market efficiency and liquidity, potentially moderating extreme price swings.\n- Innovation in Financial Technology: Hedge funds drive the adoption of cutting-edge technologies like high-frequency data analytics and sentiment analysis to gain a competitive edge, pushing innovation in the broader financial tech sector.\n\n### Current Trends and Developments\n- Record Capital Growth: The hedge fund industry has recently seen global capital surge to record levels, exceeding $5.2 trillion in assets under management, demonstrating robust investor confidence and market navigation.\n- Enhanced Risk Management: Following significant market volatility events, there's an increased focus on sophisticated risk management frameworks and real-time analytics to mitigate both market and operational risks.\n- Technological Advancement: Adoption of AI and machine learning for predictive analysis and automated trading is rapidly expanding, leading to more efficient and data-driven investment decisions.\n\n### Impact on Daily Life\n- Indirect Pension Fund Performance: Many ordinary people have their retirement savings invested in pension funds, which may allocate a portion to hedge funds for diversification and enhanced returns, indirectly affecting their financial security.\n- Market Efficiency: The active trading and complex strategies employed by hedge funds contribute to more efficient pricing of goods and services in global markets, which can indirectly influence the cost of living and investment opportunities for everyone.",
"source_urls": [
"https://www.federatedhermes.com/us/insights/article/the-seven-minutes-that-shook-markets.do",
"https://www.crowell.com/en/insights/client-alerts/proposed-hedge-fund-legislation",
"https://www.hfr.com/",
"https://www.cioinvestmentclub.com/hedge-fund-industry-trends",
"https://www.ib.barclays/our-insights/3-point-perspective/2025-hedge-fund-outlook.html"
]
},
"flash_cards": [
{
"front": "What is a hedge fund?",
"back": "A privately managed investment fund for accredited investors, using sophisticated strategies to generate high returns."
},
{
"front": "What are the key features of hedge funds?",
"back": "Pooled investment vehicles, active management with flexible strategies, performance-based fees, and access limited to accredited investors."
},
{
"front": "What are some common hedge fund applications?",
"back": "Capital growth, portfolio diversification, market neutrality, and access to alternative investments."
},
{
"front": "What are the challenges faced by hedge funds?",
"back": "Liquidity management, regulatory scrutiny and compliance costs, and fee compression."
}
],
"thumbnail": {
"thumbnail_url": "https://a.c-dn.net/c/content/dam/publicsites/igcom/uk/images/ContentImage/Hedge_funds_-_image_1-230421.jpg",
"alt_text": "Close-up of multiple computer screens displaying various financial charts, graphs, and data, representing complex financial analysis and trading in the context of hedge funds."
},
"category_tags_description": {
"selected_category": "k579qv608jhad3krbwbcb8adj97qeg1t",
"short_description": "Privately managed investment funds utilizing advanced strategies for high returns.",
"generated_tags": [
"Hedge Funds",
"Investment Strategies",
"Alternative Investments",
"Financial Markets",
"Risk Management"
]
}
}

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
    # print(f"📝 Testing with topic: '{minimal_test_data['topic']}'")
    
    # Choose which error to test (uncomment one):
    test_error_type = "block_creation_error"  # Options: "invalid_json", "missing_fields", "convex_error", "block_creation_error"
    
    if test_error_type == "invalid_json":
        print("🔥 Testing with INVALID JSON to trigger JSON parsing error...")
        # Introduce malformed JSON
        invalid_json = '{"topic": "Test Topic", "difficulty": "beginner", "invalid_json": true'  # Missing closing brace
        result = insert_topic_to_convex(invalid_json, "test_user_123", "Test Topic")
        
    elif test_error_type == "missing_fields":
        print("🔥 Testing with MISSING REQUIRED FIELDS to trigger field access error...")
        # Remove required fields
        incomplete_data = {
            "topic": "Test Topic",
            "difficulty": "beginner"
            # Missing research_brief, research_deep, etc.
        }
        result = insert_topic_to_convex(json.dumps(incomplete_data), "test_user_123", "Test Topic")
        
    elif test_error_type == "block_creation_error":
        print("🔥 Testing with INVALID BLOCK DATA to trigger block creation error...")
        # Create data that will pass initial validation but fail during block creation
        # We'll corrupt the research_brief text to cause block creation to fail
        test_data = minimal_test_data.copy()
        test_data["research_brief"] = {
            "title": "Valid Title",
            "text": None,  # This will cause block creation to fail when trying to access text
            "depth": "brief"
        }
        result = insert_topic_to_convex(json.dumps(test_data), "test_user_123", "Hedge funds")
        
    elif test_error_type == "convex_error":
        print("🔥 Testing with INVALID CONVEX URL to trigger connection error...")
        # Temporarily set invalid Convex URL
        original_url = os.environ.get("CONVEX_URL")
        os.environ["CONVEX_URL"] = "https://invalid-convex-url.convex.cloud"
        result = insert_topic_to_convex(json.dumps(minimal_test_data), "test_user_123", "Hedge funds")
        # Restore original URL
        if original_url:
            os.environ["CONVEX_URL"] = original_url
    else:
        # Normal test
        print("🔥 Running NORMAL test...")
        result = insert_topic_to_convex(json.dumps(minimal_test_data), "test_user_123", "Hedge funds")
    
    # Print results
    if result.get("success"):
        print(f"✅ SUCCESS! Topic ID: {result.get('topic_id')}")
        print(f"📊 Exercises: {result.get('metadata', {}).get('exercise_count', 0)}")
    else:
        print(f"❌ FAILED: {result.get('message', result.get('error', 'Unknown error'))}")
        print(f"🔍 Full result: {result}")

def test_all_error_scenarios():
    """Test all different error scenarios"""
    print("🧪 Testing All Error Scenarios")
    print("=" * 50)
    
    error_types = ["invalid_json", "missing_fields", "convex_error", "block_creation_error"]
    
    for i, error_type in enumerate(error_types, 1):
        print(f"\n{i}. Testing {error_type.replace('_', ' ').title()}:")
        print("-" * 30)
        
        try:
            if error_type == "invalid_json":
                print("🔥 Malformed JSON test...")
                invalid_json = '{"topic": "Test", "incomplete": true'  # Missing closing brace
                result = insert_topic_to_convex(invalid_json, "test_user_123", "Test Topic")
                
            elif error_type == "missing_fields":
                print("🔥 Missing required fields test...")
                incomplete_data = {"topic": "Test", "difficulty": "beginner"}
                result = insert_topic_to_convex(json.dumps(incomplete_data), "test_user_123", "Test Topic")
                
            elif error_type == "block_creation_error":
                print("🔥 Block creation error test...")
                test_data = minimal_test_data.copy()
                test_data["research_brief"] = {
                    "title": "Valid Title",
                    "text": None,  # This will cause block creation to fail
                    "depth": "brief"
                }
                result = insert_topic_to_convex(json.dumps(test_data), "test_user_123", "Hedge funds")
                
            elif error_type == "convex_error":
                print("🔥 Convex connection error test...")
                original_url = os.environ.get("CONVEX_URL")
                os.environ["CONVEX_URL"] = "https://fake-url.convex.cloud"
                result = insert_topic_to_convex(json.dumps(minimal_test_data), "test_user_123", "Hedge funds")
                if original_url:
                    os.environ["CONVEX_URL"] = original_url
            
            # Print results
            if result.get("success"):
                print(f"   ✅ Unexpected success: {result.get('topic_id')}")
            else:
                print(f"   ❌ Expected failure: {result.get('message', result.get('error', 'Unknown'))}")
                
        except Exception as e:
            print(f"   💥 Exception caught: {e}")
    
    print(f"\n{'='*50}")
    print("🎯 Error scenario testing complete!")

if __name__ == "__main__":
    # Uncomment the test you want to run:
    run_test()  # Single test with configurable error type
    # test_all_error_scenarios()  # Test all error scenarios