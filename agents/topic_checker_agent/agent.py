"""
Topic Checker Agent using Google ADK
"""

import os
import sys
from pathlib import Path
from google.adk.agents import LlmAgent
from pydantic import BaseModel, Field
from typing import Optional
from convex import ConvexClient

# =============================================================================
# TOOL AND HELPER FUNCTIONS
# =============================================================================
def create_bad_topic_notification(user_id: str, message: str):
    """
    Create a bad topic notification in the Convex database
    
    Args:
        user_id: User ID
        message: Notification message
        
    Returns:
        dict: Result with notification_id if successful, error message if failed
    """
    try:
        # Get Convex URL from environment
        convex_url = os.environ.get("CONVEX_URL")
        if not convex_url:
            return {"success": False, "error": "CONVEX_URL environment variable not set"}
        
        # Initialize Convex client
        client = ConvexClient(convex_url)

        # Get notification types from the database
        notification_types = client.query("notifications:getNotificationTypes")
        
        # Find the bad_topic notification type
        bad_topic_type = None
        for nt in notification_types:
            if nt.get("key") == "bad_topic":
                bad_topic_type = nt
                break
        
        if not bad_topic_type:
            return {"success": False, "error": "bad_topic notification type not found in database"}

        # Prepare notification data using the notification type ID
        notification_data = {
            "userId": user_id,
            "notificationTypeKey": bad_topic_type["_id"],
            "title": "Invalid Topic!",
            "message": message
        }
        
        # Create notification in Convex
        notification_id = client.mutation("notifications:createNotification", notification_data)
        
        return {
            "success": True,
            "notification_id": notification_id,
            "message": f"Successfully created bad topic notification with ID: {notification_id}"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Error creating bad topic notification: {str(e)}"
        }

# =============================================================================
# OUTPUT SCHEMAS
# =============================================================================
class TopicValidationOutput(BaseModel):
    status: str = Field(description="Either 'VALID' or 'INVALID'")
    reason: Optional[str] = Field(description="Reason for validation result")

# =============================================================================
# AGENT DEFINITIONS
# =============================================================================

topic_checker_enhancer_agent = LlmAgent(
    name="TopicCheckerEnhancerAgent",
    model="gemini-2.5-flash",
    instruction="""
    You are a topic validation specialist. Your task is to determine if a given topic is valid and suitable for generating educational content.

    A topic is considered VALID if:
    - It represents a real, concrete subject that can be taught or explained
    - It has sufficient depth for educational content creation
    - It's appropriate for learning (not harmful, offensive, or inappropriate)
    - It's specific enough to create meaningful content about
    - It's a topic that would benefit from educational explanation

    A topic is considered INVALID if:
    - It's too vague or abstract (e.g., "stuff", "things", "whatever")
    - It's nonsensical or gibberish
    - It's inappropriate, offensive, or harmful content
    - It's too narrow or trivial (e.g., "my cat's name")
    - It's not a real educational topic (e.g., random words, spam)
    - It's a question rather than a topic (e.g., "How do I...?")
    - It's a personal request or command (e.g., "Write me a story")

    Examples of VALID topics:
    - "Machine Learning"
    - "Photosynthesis"
    - "Renaissance Art"
    - "Climate Change"
    - "Quantum Physics"
    - "World War II"
    - "JavaScript Programming"

    Examples of INVALID topics:
    - "asdfgh" (gibberish)
    - "my homework" (too personal/vague)
    - "How do I cook pasta?" (question, not topic)
    - "Write me a poem" (command/request)
    - "stuff about things" (too vague)
    - "xyz123" (nonsensical)

    Analyze the provided topic and respond with either "VALID" or "INVALID" along with a brief reason.

    If the topic is INVALID, you MUST call the create_bad_topic_notification function to create a notification about the bad topic. Use appropriate title and message for the notification.

    CRITICAL FORMATTING REQUIREMENTS:
    - You must respond with ONLY a valid JSON object
    - No additional text, explanations, or markdown formatting
    - The JSON must exactly match the required schema

    Required JSON schema:
    {
        "status": "VALID" or "INVALID",
        "reason": "Brief explanation of why the topic is valid or invalid"
    }

    Example outputs:
    {
        "status": "VALID",
        "reason": "Machine Learning is a well-defined educational topic with substantial content for learning"
    }

    {
        "status": "INVALID", 
        "reason": "The input appears to be gibberish and not a real educational topic"
    }

    Remember:
    - Output only the JSON object, nothing else
    - Be strict but fair in your validation
    - Focus on educational value and appropriateness
    - Call create_bad_topic_notification for INVALID topics only
    """,
    output_schema=TopicValidationOutput,
    output_key="validation_result",
    tools=[create_bad_topic_notification]
)

# For ADK tools compatibility, the root agent must be named `root_agent`
root_agent = topic_checker_enhancer_agent