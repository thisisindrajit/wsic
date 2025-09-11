# Topic Checker Agent

This agent validates whether a submitted topic is suitable for educational content generation.

## Purpose

The Topic Checker Agent determines if a given topic is:
- Valid and educational
- Appropriate for content creation
- Specific enough for meaningful learning content
- Not spam, gibberish, or inappropriate

## How it Works

1. **Validation**: Uses an LLM to analyze the topic
2. **Decision**: Returns "VALID" or "INVALID" with reasoning
3. **Notification**: Creates a notification in Convex if the topic is invalid

## Usage

### As a Standalone Agent
```python
from agent import validate_topic_and_notify

result = validate_topic_and_notify("Machine Learning", user_id="user123")
print(result)  # "VALID" or "INVALID"
```

### Integration with Other Agents
```python
# Before generating content, validate the topic
if validate_topic_and_notify(topic, user_id) == "INVALID":
    return "Topic rejected"
# Continue with content generation...
```

## Examples

### Valid Topics
- "Machine Learning"
- "Photosynthesis" 
- "Renaissance Art"
- "Climate Change"
- "Quantum Physics"

### Invalid Topics
- "asdfgh" (gibberish)
- "my homework" (too personal/vague)
- "How do I cook pasta?" (question, not topic)
- "Write me a poem" (command/request)
- "stuff about things" (too vague)

## Setup

1. **Environment Variables**:
   ```env
   CONVEX_URL=https://your-deployment.convex.cloud
   GOOGLE_API_KEY=your_google_api_key
   ```

2. **Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Test**:
   ```bash
   python test_agent.py
   ```

## Notifications

When a topic is invalid, the agent creates a notification with:
- **Type**: "bad_topic"
- **Title**: "Invalid Topic Submitted"
- **Message**: Reason for rejection
- **Metadata**: Original topic and validation reason

## Integration

This agent is designed to be used as a pre-filter before the Topic Generator Agent to ensure only valid topics proceed to content generation.