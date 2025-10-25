import os
import json
import time
import re
import requests
from convex import ConvexClient
from flask import Flask, request, jsonify
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Environment variables
TOPIC_CHECKER_BASE_URL = os.getenv('TOPIC_CHECKER_BASE_URL')
TOPIC_GENERATOR_BASE_URL = os.getenv('TOPIC_GENERATOR_BASE_URL')
CONVEX_URL = os.getenv("CONVEX_URL")

client = ConvexClient(CONVEX_URL)

def create_session(base_url, user_id, session_id):
    """Create a session for the given service"""
    url = f"{base_url}/apps/{'topic-checker' if 'topic-checker' in base_url else 'topic-generator'}/users/{user_id}/sessions/{session_id}"
    payload = {"state": {"preferred_language": "English"}}
    
    response = requests.post(url, json=payload, headers={"Content-Type": "application/json"})
    return response

def run_service(base_url, app_name, user_id, session_id, message_text):
    """Run the service with the given parameters"""
    url = f"{base_url}/run"
    payload = {
        "app_name": app_name,
        "user_id": user_id,
        "session_id": session_id,
        "new_message": {
            "role": "user",
            "parts": [{"text": message_text}]
        },
        "streaming": False
    }
    
    response = requests.post(url, json=payload, headers={"Content-Type": "application/json"})
    return response

def delete_session(base_url, app_name, user_id, session_id):
    """Delete the session"""
    url = f"{base_url}/apps/{app_name}/users/{user_id}/sessions/{session_id}"
    response = requests.delete(url)
    return response

def extract_model_response(response_data):
    """Extract the latest model response from the API response"""
    try:
        if isinstance(response_data, list) and len(response_data) > 0:
            # Find the latest model response
            for item in reversed(response_data):
                if (item.get('content', {}).get('role') == 'model' and 
                    'parts' in item.get('content', {}) and 
                    len(item['content']['parts']) > 0):
                    
                    parts = item['content']['parts']
                    for part in parts:
                        if 'text' in part:
                            return part['text']
        
        return None
    except Exception as e:
        print(f"Error extracting model response: {e}", flush=True)
        return None

def parse_json_from_markdown(text):
    """Parse JSON from markdown code blocks or plain text
    
    The JSON schema must be in this format:
    {
        "success": "Whether the insertion was successful",
        "topic_id": "The ID of the created topic if successful",
        "message": "Success message or error description",
        "metadata": "Additional metadata about the insertion"
    }
    
    Returns:
        tuple: (parsed_json, should_retry)
        - parsed_json: The parsed JSON object or None if parsing failed
        - should_retry: True if success is false (triggers 500 error for QStash retry)
    """
    try:
        # First, try to parse as direct JSON
        parsed_json = json.loads(text)
        should_retry = parsed_json.get('success') is False
        return parsed_json, should_retry
    except json.JSONDecodeError:
        try:
            # If that fails, look for JSON within markdown code blocks
            import re
            
            # Pattern to match ```json\n...content...\n```
            json_pattern = r'```json\s*\n(.*?)\n```'
            match = re.search(json_pattern, text, re.DOTALL)
            
            if match:
                json_content = match.group(1)
                parsed_json = json.loads(json_content)
                should_retry = parsed_json.get('success') is False
                return parsed_json, should_retry
            
            # Pattern to match ```\n...content...\n``` (without json specifier)
            generic_pattern = r'```\s*\n(.*?)\n```'
            match = re.search(generic_pattern, text, re.DOTALL)
            
            if match:
                json_content = match.group(1)
                parsed_json = json.loads(json_content)
                should_retry = parsed_json.get('success') is False
                return parsed_json, should_retry
            
            # If no code blocks found, try parsing the text directly
            parsed_json = json.loads(text)
            should_retry = parsed_json.get('success') is False
            return parsed_json, should_retry
            
        except (json.JSONDecodeError, AttributeError) as e:
            print(f"Failed to parse JSON from text: {e}", flush=True)
            print(f"Text content: {text[:500]}...", flush=True)  # Print first 500 chars for debugging
            return None, True # Retry if not able to decode JSON

@app.route('/ok')
def ok():
    print("Hitting health service...", flush=True)

    return 'Topic Generator API is running!'

@app.route('/check-topic', methods=['POST'])
def check_topic():
    """Check if a topic is valid"""
    try:
        print("Hitting check topic service...", flush=True)
        
        data = request.get_json()
        if not data:
            response = jsonify({"error": "No JSON data provided"})
            response.headers['Upstash-NonRetryable-Error'] = 'true'
            return response, 489
        
        topic = data.get('topic')
        user_id = data.get('user_id')
        
        if not topic:
            response = jsonify({"error": "Topic is required"})
            response.headers['Upstash-NonRetryable-Error'] = 'true'
            return response, 489
        if not user_id:
            response = jsonify({"error": "User ID is required"})
            response.headers['Upstash-NonRetryable-Error'] = 'true'
            return response, 489
        
        topic = topic.strip()
        user_id = user_id.strip()
        
        print(f"Checking topic validity for '{topic}' from user {user_id}", flush=True)
        validation_result, status_code = check_topic_validity(topic, user_id)
        
        return jsonify(validation_result), status_code
            
    except Exception as e:
        print(f"Error in check_topic: {str(e)}", flush=True)
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

def check_topic_validity(topic, user_id):
    """Internal function to check if a topic is valid"""
    try:
        print(f"Checking topic validity: {topic} from user {user_id}", flush=True)
        
        # Get current timestamp and set session
        timestamp = int(time.time())
        session_id = f"session_{user_id}_{timestamp}"
        
        # Step 1: Create session
        create_response = create_session(TOPIC_CHECKER_BASE_URL, user_id, session_id)
        if create_response.status_code != 200:
            return {"error": "Failed to create session"}, 500
        
        # Step 2: Run topic checker
        message_text = json.dumps({"topic": topic, "user_id": user_id})
        run_response = run_service(TOPIC_CHECKER_BASE_URL, "topic-checker", user_id, session_id, message_text)
        
        if run_response.status_code != 200:
            return {"error": "Failed to check topic"}, 500
        
        # Step 3: Extract response
        response_data = run_response.json()
        model_response = extract_model_response(response_data)
        
        # Step 4: Delete session
        delete_session(TOPIC_CHECKER_BASE_URL, "topic-checker", user_id, session_id)
        
        if model_response:
            # Parse the JSON response from the model (handles markdown code blocks)
            parsed_response, should_retry = parse_json_from_markdown(model_response)
            if parsed_response:
                return parsed_response, 200
            else:
                return {"error": "Invalid JSON response from model"}, 500
        else:
            return {"error": "No valid response from topic checker"}, 500
            
    except Exception as e:
        return {"error": f"Internal server error: {str(e)}"}, 500

@app.route('/generate-topic', methods=['POST'])
def generate_topic():
    """Check topic validity and generate content if valid"""
    try:
        print("Hitting generate topic service...", flush=True)

        data = request.get_json()
        if not data:
            response = jsonify({"error": "No JSON data provided"})
            response.headers['Upstash-NonRetryable-Error'] = 'true'
            return response, 489
        
        topic = data.get('topic')
        difficulty = data.get('difficulty', 'Beginner')
        user_id = data.get('user_id')
        publish_immediately = data.get('publish_immediately', 'True')
        
        if not topic:
            response = jsonify({"error": "Topic is required"})
            response.headers['Upstash-NonRetryable-Error'] = 'true'
            return response, 489
        if not user_id:
            response = jsonify({"error": "User ID is required"})
            response.headers['Upstash-NonRetryable-Error'] = 'true'
            return response, 489
        
        topic = topic.strip()
        user_id = user_id.strip()
        
        # Step 1: Check topic validity first
        print(f"Step 1: Checking topic validity for '{topic}' from user {user_id}", flush=True)
        validation_result, status_code = check_topic_validity(topic, user_id)
        
        if status_code != 200:
            return jsonify(validation_result), status_code
        
        # Check if topic is invalid
        if validation_result.get('status') == 'INVALID':
            print(f"Topic '{topic}' is invalid: {validation_result.get('reason')}", flush=True)
            response = jsonify({
                "error": "Topic is invalid",
                "validation": validation_result
            })
            response.headers['Upstash-NonRetryable-Error'] = 'true'
            return response, 489
        
        print(f"Topic '{topic}' is valid. Proceeding with generation...", flush=True)
        
        # Step 2: Generate content for valid topic
        # Get current timestamp and set session
        timestamp = int(time.time())
        session_id = f"session_{user_id}_{timestamp}"
        
        # Create session for topic generator
        create_response = create_session(TOPIC_GENERATOR_BASE_URL, user_id, session_id)
        if create_response.status_code != 200:
            return jsonify({"error": "Failed to create session for topic generation"}), 500
        
        # Run topic generator
        message_text = json.dumps({
            "topic": topic,
            "difficulty": difficulty,
            "user_id": user_id,
            "publish_immediately": publish_immediately
        })
        run_response = run_service(TOPIC_GENERATOR_BASE_URL, "topic-generator", user_id, session_id, message_text)
        
        # TODO: Sometimes even if topic is generated, it is still returning a non 200 response, which is resulting in double generation due to retry. Make the flow more robust by using a newly created table called topic_generation_requests and using that as an alternative source of truth. Maybe use the qstash_message_id in that table to keep track of whether it is in progress, error or success.
        if run_response.status_code != 200:
            return jsonify({"error": f"Failed to generate topic content. Response: {str(run_response)}"}), 500
        
        # Extract response
        response_data = run_response.json()
        model_response = extract_model_response(response_data)
        
        # Delete session
        delete_session(TOPIC_GENERATOR_BASE_URL, "topic-generator", user_id, session_id)
        
        if model_response:
            # Parse the JSON response from the model (handles markdown code blocks)
            parsed_response, should_retry = parse_json_from_markdown(model_response)
            if parsed_response:
                if should_retry:
                    print(f"Topic generation failed for '{topic}': {parsed_response.get('message', 'Error occurred while generating topic')}", flush=True)
                    return jsonify(parsed_response), 500  # Return 500 to trigger QStash retry
                else:
                    print(f"Successfully generated content for topic '{topic}'", flush=True)
                    return jsonify(parsed_response), 200
            else:
                return jsonify({"error": "Invalid JSON response from model"}), 500
        else:
            return jsonify({"error": "No valid response from topic generator"}), 500
            
    except Exception as e:
        print(f"Error in generate_topic: {str(e)}", flush=True)
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000, debug=True)