# Topic Generator and Convex Inserter Agent

This directory contains a comprehensive multi-agent system in `agent.py` that:

1. **Generates Educational Content** - Multi-agent orchestrator that creates comprehensive educational modules
2. **Inserts into Convex Database** - Specialized agent for inserting generated content into Convex database

All functionality is consolidated into a single `agent.py` file for simplicity.

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Environment Variables

Create a `.env` file with the following variables:

```env
# Required for Topic Generator Agent
EXA_API_KEY=your_exa_api_key_here
SERPER_API_KEY=your_serper_api_key_here
EXA_NUM_RESULTS=5

# Required for Convex Inserter Agent
CONVEX_URL=https://your-deployment.convex.cloud
```

### 3. Convex Database Setup

Make sure your Convex deployment is running with the schema defined in `/convex/schema.ts`. The inserter agent will automatically create categories and tags as needed.

## Usage

### Topic Generator Agent

The topic generator agent creates comprehensive educational modules with:
- Brief and deep research content
- Interactive quizzes and exercises
- Real-world impact analysis
- Flash cards for review
- Thumbnail images

```python
from agent import root_agent

# Generate content for a topic
result = root_agent.run("Artificial Intelligence advanced")
```

### Convex Inserter Agent

The Convex inserter agent takes the output from the topic generator and inserts it into your Convex database as structured topics and blocks.

```python
from agent import convex_inserter_agent, complete_workflow_agent
import json

# Option 1: Use the inserter agent separately
# (assuming you have agent output from the content generator)
result = convex_inserter_agent.run(json.dumps(agent_output))

# Option 2: Use the complete workflow agent (generates AND inserts)
result = complete_workflow_agent.run("Artificial Intelligence intermediate")
```

### Complete Workflow Example

```python
from agent import content_generator_agent, convex_inserter_agent, complete_workflow_agent
import json

# Option 1: Two-step process
# Step 1: Generate educational content
topic_input = "Machine Learning for beginners"
generated_content = content_generator_agent.run(topic_input)

# Step 2: Insert into Convex database
result = convex_inserter_agent.run(json.dumps(generated_content))
print(f"Topic created with ID: {result.get('topic_id')}")

# Option 2: One-step process (recommended)
result = complete_workflow_agent.run("Machine Learning for beginners")
print(f"Complete workflow result: {result}")
```

## Agent Output Structure

The topic generator produces a structured JSON output with these fields:

```json
{
  "topic": "Topic Title",
  "research_brief": {
    "title": "Brief Research Title",
    "text": "Markdown formatted content...",
    "depth": "brief"
  },
  "research_deep": {
    "title": "Deep Research Title", 
    "text": "Detailed markdown content...",
    "depth": "deep"
  },
  "quiz": {
    "type": "quiz",
    "questions": [
      {
        "question": "Question text",
        "options": ["A", "B", "C", "D"],
        "correct_answer": "A",
        "explanation": "Why A is correct"
      }
    ]
  },
  "reorder": {
    "type": "reorder",
    "question": "Reorder question",
    "options": ["Item 1", "Item 2", "Item 3", "Item 4"],
    "correct_answer": "Item 1, Item 2, Item 3, Item 4",
    "explanation": "Explanation of correct order"
  },
  "final_quiz": {
    "type": "final_quiz",
    "questions": [/* 5 questions in same format as quiz */]
  },
  "real_world_impact": {
    "title": "Real-World Impact Title",
    "content": "Markdown content with bullet points...",
    "source_urls": ["url1", "url2"]
  },
  "flash_cards": [
    {
      "front": "Question or term",
      "back": "Answer or definition"
    }
  ],
  "thumbnail": {
    "thumbnail_url": "https://image-url.com/image.jpg",
    "alt_text": "Image description"
  }
}
```

## Convex Database Structure

The inserter creates the following structure in Convex:

### Topics Table
- Basic topic information (title, description, difficulty, etc.)
- Metadata (word count, estimated read time, exercise count)
- AI generation flags and source URLs
- Category and tag relationships

### Blocks Table
- Individual content pieces within topics
- Text blocks for research content
- Exercise blocks for quizzes and activities
- Media blocks for images/thumbnails
- Ordered sequence for proper display

### Categories and Tags
- Automatically created if they don't exist
- Linked to topics for organization and filtering

## Available Agents

### content_generator_agent
The main orchestrator that generates educational content without database insertion.

### convex_inserter_agent  
Specialized agent that takes generated content and inserts it into Convex database.

### complete_workflow_agent
Combined agent that generates content AND inserts it into Convex in one step.

### root_agent
Default agent (currently set to content_generator_agent). This is what gets executed when you run the agent directly.

## Error Handling

The agents include comprehensive error handling:
- JSON validation for agent output
- Required field checking
- Convex connection error handling
- Detailed error messages and suggestions

## Usage Examples

### Generate Content Only
```python
from agent import content_generator_agent

result = content_generator_agent.run("Quantum Computing advanced")
print(result)  # Complete educational module JSON
```

### Insert Existing Content
```python
from agent import convex_inserter_agent
import json

# Assuming you have generated content
result = convex_inserter_agent.run(json.dumps(generated_content))
print(f"Inserted with topic ID: {result['topic_id']}")
```

### Complete Workflow (Generate + Insert)
```python
from agent import complete_workflow_agent

# This will generate content AND insert into Convex
result = complete_workflow_agent.run("Machine Learning intermediate")
print(f"Complete workflow finished: {result}")
```

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   - Ensure all required environment variables are set
   - Check `.env` file is in the correct location

2. **Convex Connection Errors**
   - Verify CONVEX_URL is correct
   - Ensure Convex deployment is running
   - Check network connectivity

3. **Invalid Agent Output**
   - Use the validation agent to check output format
   - Ensure all required fields are present
   - Verify JSON structure is correct

4. **Schema Mismatches**
   - Ensure Convex schema matches expected structure
   - Check that all required tables exist
   - Verify field types match expectations

### Debug Mode

Enable debug logging by setting:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

This will show detailed information about the insertion process and any errors encountered.