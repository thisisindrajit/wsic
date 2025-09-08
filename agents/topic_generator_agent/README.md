# Educational Content Generation Multi-Agent System

A simple multi-agent system built with Google ADK that generates interactive educational modules.

## Architecture

The system consists of 8 specialized agents:

1. **Orchestrator Agent** - Manages the entire workflow
2. **Research Agent** - Gathers information using Exa AI
3. **Interactive Content Agent** - Creates activities and quizzes  
4. **Real-World Impact Agent** - Connects topics to current events
5. **Summary Agent** - Creates flash cards
6. **Validator Agent** - Fact-checks claims using Google Search
7. **Thumbnail Generator Agent** - Finds relevant images using Serper API
8. **Assembler Agent** - Formats final JSON output

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables in `.env`:
```
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_GENAI_USE_VERTEXAI=FALSE
```

3. TODO: Add API keys for:
   - Exa AI (for research)
   - Serper API (for image search)
   - Google Search API (for fact-checking)

## Usage

```python
from agent import generate_educational_content

# Generate content for a topic
result = await generate_educational_content("Artificial Intelligence")
print(result)
```

## Testing

Run the simple test:
```bash
python test_simple.py
```

## TODO: API Integrations

The following functions need actual API implementations:

- `exa_search()` - Implement Exa AI search
- `google_search()` - Implement Google Search API
- `serper_image_search()` - Implement Serper image search

Currently these return placeholder data for testing the agent workflow.

## Workflow

The orchestrator follows this exact sequence:

1. Brief research → First activity
2. Deep research → Second activity  
3. Real-world impact analysis
4. Fact validation of all claims
5. Final quiz generation
6. Flash card creation
7. Thumbnail selection
8. Final assembly into JSON

Each step passes data to the next through the ADK agent system.