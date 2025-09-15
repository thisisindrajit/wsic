# Topic Generation System

This document provides comprehensive information about WSIC's AI-powered topic generation system, which creates educational content on-demand using a multi-agent architecture.

## Overview

The topic generation system transforms user search queries into comprehensive educational modules through an automated pipeline. When users search for topics that don't exist in the database, the system offers to "brew" new content using AI agents.

## Architecture

### Multi-Agent System

The generation pipeline consists of 8 specialized AI agents:

1. **Orchestrator Agent**: Manages the entire workflow
2. **Research Agent**: Gathers factual information using Exa AI
3. **Interactive Content Agent**: Creates quizzes and activities
4. **Real-World Impact Agent**: Connects topics to current events
5. **Validator Agent**: Fact-checks all claims using Google Search
6. **Summary Agent**: Creates flash cards
7. **Thumbnail Generator Agent**: Finds relevant images using Serper API
8. **Assembler Agent**: Combines all components into final JSON

### Service Architecture

```mermaid
graph TD
    A[User Search] --> B[SearchResults Component]
    B --> C{Content Found?}
    C -->|No| D[Brew Your Topic UI]
    D --> E[/api/queue-topic-request]
    E --> F[QStash - Messaging Queue]
    F --> G[generator_api - Render Long Running Workers]
    G --> H[Google Cloud Run - AI Agents Hosted]
    H --> I[Topic Checker Agent]
    I --> J{Topic Valid?}
    J -->|No| K[Return Error]
    J -->|Yes| L[Topic Generator Agent]
    L --> M[Multi-Agent Pipeline]
    M --> N[Convex Database]
    N --> O[User Notification]
    
    style E fill:#e1f5fe
    style F fill:#f3e5f5
    style G fill:#e8f5e8
    style H fill:#fff3e0
```

**Infrastructure Components:**

1. **Next.js API Route** (`/api/queue-topic-request`): Receives user requests and queues them
2. **QStash Messaging Queue**: Reliable message delivery with retry logic
3. **Render Long Running Workers** (`generator_api`): Flask API orchestrating the generation process
4. **Google Cloud Run**: Hosts the AI agents with auto-scaling capabilities
5. **Convex Database**: Stores generated content and manages real-time updates

## API Endpoints

### Queue Topic Request

**Endpoint**: `POST /api/queue-topic-request`
**Location**: `app/api/queue-topic-request/route.ts`

Queues a topic generation request using QStash for asynchronous processing.

```typescript
export const POST = async (req: Request) => {
  try {
    const { topic, difficulty, user_id } = await req.json();

    const result = await client.publishJSON({
      url: process.env.TOPIC_GENERATOR_RENDER_URL!,
      body: {
        topic: topic,
        difficulty: difficulty,
        user_id: user_id,
        publish_immediately: "True",
      },
      retries: 3,
      retryDelay: "30000" // 30 seconds
    });

    return NextResponse.json({
      message: "Topic queued for generation!",
      qstashMessageId: result.messageId,
    });
  } catch (error) {
    return NextResponse.json({
      message: "Error queuing topic for generation!",
      error: error,
    });
  }
};
```

**Request Body:**
```typescript
{
  topic: string;        // Topic to generate content for
  difficulty: string;   // "beginner" | "intermediate" | "advanced"
  user_id: string;      // Better Auth user ID
}
```

**Response:**
```typescript
{
  message: string;           // Success/error message
  qstashMessageId: string;   // QStash message ID for tracking
}
```

### Generator API Service

**Location**: `generator_api/app.py`
**Base URL**: Configured via `TOPIC_GENERATOR_RENDER_URL`

#### Health Check
- **GET** `/ok` - Service health check

#### Topic Validation
- **POST** `/check-topic` - Validates topic appropriateness

#### Content Generation
- **POST** `/generate-topic` - Full topic generation pipeline

## Generation Pipeline

### Step 1: Topic Validation

The **Topic Checker Agent** validates whether a topic is appropriate for educational content:

```python
def check_topic_validity(topic, user_id):
    # Create session with topic-checker service
    create_response = create_session(TOPIC_CHECKER_BASE_URL, user_id, session_id)
    
    # Run topic validation
    message_text = json.dumps({"topic": topic, "user_id": user_id})
    run_response = run_service(TOPIC_CHECKER_BASE_URL, "topic-checker", user_id, session_id, message_text)
    
    # Extract and parse validation result
    model_response = extract_model_response(run_response.json())
    parsed_response = parse_json_from_markdown(model_response)
    
    return parsed_response
```

**Validation Criteria:**
- Educational value
- Appropriateness for target audience
- Factual accuracy potential
- Content generation feasibility

**Response Format:**
```json
{
  "status": "VALID" | "INVALID",
  "reason": "Explanation of validation result",
  "confidence": 0.95,
  "suggestions": ["Alternative topic suggestions"]
}
```

### Step 2: Content Generation

If the topic is valid, the **Topic Generator Agent** orchestrates the multi-agent pipeline:

```python
def generate_topic():
    # Step 1: Check topic validity
    validation_result = check_topic_validity(topic, user_id)
    
    if validation_result.get('status') == 'INVALID':
        return error_response(validation_result)
    
    # Step 2: Generate content using multi-agent system
    message_text = json.dumps({
        "topic": topic,
        "difficulty": difficulty,
        "user_id": user_id,
        "publish_immediately": publish_immediately
    })
    
    run_response = run_service(TOPIC_GENERATOR_BASE_URL, "topic-generator", user_id, session_id, message_text)
    
    # Step 3: Parse and return generated content
    model_response = extract_model_response(run_response.json())
    parsed_response = parse_json_from_markdown(model_response)
    
    return parsed_response
```

### Step 3: Multi-Agent Workflow

The **Orchestrator Agent** manages the following sequence:

1. **Research Agent** (Brief): Foundational information gathering
2. **Interactive Content Agent**: First reorder activity
3. **Research Agent** (Deep): Detailed information and trivia
4. **Interactive Content Agent**: Second reorder activity
5. **Real-World Impact Agent**: Current events and relevance
6. **Validator Agent**: Fact-checking all claims
7. **Interactive Content Agent**: Final comprehensive quiz
8. **Summary Agent**: Flash cards creation
9. **Thumbnail Generator Agent**: Image selection
10. **Assembler Agent**: Final JSON compilation

### Agent Specifications

#### Research Agent
- **Model**: Gemini 2.5 Flash
- **Tools**: Exa AI Search API
- **Purpose**: Gather accurate information from reputable sources

```python
# Research Agent Instructions
"""
You are a diligent research assistant. Your task is to use the Exa AI Search tool 
to find clear, accurate information from reputable web sources.

- If depth is 'brief', provide a concise, foundational overview.
- If depth is 'deep', provide more detailed information and interesting trivia.

For each piece of information, you must return the extracted text and the source URL.
"""
```

#### Interactive Content Agent
- **Model**: Gemini 2.5 Flash
- **Purpose**: Create educational activities and assessments

```python
# Interactive Content Agent Instructions
"""
You are an expert educational content designer focused on accessibility. 
Your goal is to create clear, straightforward activities that reinforce learning.

- For 'quiz' or 'reorder': Create one simple, direct question based on context.
- For 'final_quiz': Create exactly 5 clear questions covering key concepts.
- You MUST include the correct answer in a 'correct_answer' field for validation.
"""
```

#### Real-World Impact Agent
- **Model**: Gemini 2.5 Flash
- **Tools**: Exa AI Search API (highlights mode)
- **Purpose**: Connect topics to current events

```python
# Real-World Impact Agent Instructions
"""
You are a skilled writer who connects topics to the real world. Your task is to 
explain why a topic matters today. Use the Exa AI Search tool with advanced depth 
to understand the topic's current relevance.

Synthesize your findings into a single, easy-to-understand paragraph. Do not list 
separate news headlines. Weave recent developments into a cohesive story about the 
topic's real-world impact.
"""
```

#### Validator Agent
- **Model**: Gemini 2.5 Flash
- **Tools**: Google Search API
- **Purpose**: Fact-check all claims

```python
# Validator Agent Instructions
"""
You are a meticulous, unbiased fact-checker. Your sole purpose is to verify a given 
factual claim using the Google Search tool. For a claim to be 'verified', you must 
find at least two independent, reputable sources that explicitly confirm the information. 
If you cannot find corroborating evidence or find conflicting reports, the claim is 
'unverified'. Return only the status.
"""
```

#### Summary Agent
- **Model**: Gemini 2.5 Flash
- **Purpose**: Create concise flash cards

```python
# Summary Agent Instructions
"""
You are a summarization expert. Your job is to distill the most critical information 
from the provided context into a series of 3-4 flash cards. Each flash card must have 
a "front" (a key term or question) and a "back" (a concise definition or answer).
"""
```

#### Thumbnail Generator Agent
- **Model**: Gemini 2.5 Pro (for image understanding)
- **Tools**: Serper Image Search API
- **Purpose**: Find relevant, high-quality images

```python
# Thumbnail Generator Agent Instructions
"""
You are a visual design specialist with a keen eye for compelling imagery. Your task 
is to find the perfect thumbnail for a given topic.

1. Use the Serper image search tool to find 10 high-quality, license-free images.
2. Analyze the results based on relevance, clarity, composition, and visual appeal.
3. Select the single best image that would serve as an engaging thumbnail.
4. Return only the URL of your chosen image.
"""
```

#### Assembler Agent
- **Model**: Gemini 2.5 Flash
- **Purpose**: Create final JSON structure

```python
# Assembler Agent Instructions
"""
You are a meticulous JSON formatter. Your only job is to take the provided, validated 
content components for all stages and assemble them into a single, final JSON object. 
Adhere strictly to the required schema. Ensure the output is a perfectly formed JSON 
without any extra commentary.
"""
```

## Content Structure

### Generated Block Types

The system generates 7 different types of content blocks:

#### 1. Research Brief
```typescript
{
  step: "research_brief",
  data: {
    title: string,
    text: string,
    depth: "brief"
  }
}
```

#### 2. Research Deep
```typescript
{
  step: "research_deep",
  data: {
    title: string,
    text: string,
    depth: "deep"
  }
}
```

#### 3. Real-World Impact
```typescript
{
  step: "real_world_impact",
  data: {
    title: string,
    content: string,
    source_urls: string[]
  }
}
```

#### 4. Reorder Activity
```typescript
{
  step: "reorder",
  data: {
    question: string,
    options: string[],
    correct_answer: string[],
    explanation: string
  }
}
```

#### 5. Quiz
```typescript
{
  step: "quiz",
  data: {
    questions: Array<{
      question: string,
      options: string[],
      correct_answer: string,
      explanation: string
    }>
  }
}
```

#### 6. Final Quiz
```typescript
{
  step: "final_quiz",
  data: {
    questions: Array<{
      question: string,
      options: string[],
      correct_answer: string,
      explanation: string
    }>
  }
}
```

#### 7. Summary (Flash Cards)
```typescript
{
  step: "summary",
  data: {
    flash_cards: Array<{
      front: string,
      back: string
    }>
  }
}
```

## Client-Side Integration

### Brewing Interface

The search results component provides a "Brew Your Topic" interface when no content is found:

```typescript
const startBrewingTopic = async () => {
  setBrewingError(null);

  try {
    if (session?.user) {
      const response = await fetch("/api/queue-topic-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic,
          difficulty: difficulty,
          user_id: session.user.id
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Topic request queued:", data);
      setIsBrewing(true);
    } else {
      throw new Error("User not authenticated");
    }
  } catch (error) {
    console.error("Error queuing topic request:", error);
    setBrewingError("Failed to start brewing topic");
  }
};
```

### UI States

The brewing interface handles multiple states:

1. **Initial**: Shows "Brew Your Topic" button with estimated time
2. **Brewing**: Shows progress indicator and estimated completion
3. **Success**: Shows completion message with navigation options
4. **Error**: Shows error message with retry functionality

```typescript
{!isBrewing && !brewingError ? (
  <Button onClick={startBrewingTopic}>
    Start Brewing Topic
  </Button>
) : isBrewing ? (
  <div>
    <div className="flex items-center justify-center gap-2 text-teal-600">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span>Brewing started!</span>
    </div>
    <p>Your topic is now being brewed. You'll be notified when it's ready.</p>
  </div>
) : (
  <div>
    <div className="flex items-center justify-center gap-2 text-red-600">
      <AlertCircle className="h-5 w-5" />
      <span>Brewing failed</span>
    </div>
    <p>{brewingError || "Something went wrong while starting to brew your topic."}</p>
    <Button onClick={() => { setBrewingError(null); startBrewingTopic(); }}>
      Try Again
    </Button>
  </div>
)}
```

## Error Handling

### Validation Errors

```python
# Topic validation failure
if validation_result.get('status') == 'INVALID':
    response = jsonify({
        "error": "Topic is invalid",
        "validation": validation_result
    })
    response.headers['Upstash-NonRetryable-Error'] = 'true'
    return response, 489  # Custom error code for non-retryable errors
```

### Generation Errors

```python
# Content generation failure
try:
    parsed_response = parse_json_from_markdown(model_response)
    if parsed_response:
        return jsonify(parsed_response)
    else:
        return jsonify({"error": "Invalid JSON response from model"}), 500
except Exception as e:
    return jsonify({"error": f"Internal server error: {str(e)}"}), 500
```

### Client-Side Error Handling

```typescript
// Network and API errors
if (error.message.includes("network") || error.message.includes("fetch")) {
  setBrewingError("Connection issue. Please check your internet and try again.");
} else if (error.message.includes("HTTP error! status: 489")) {
  setBrewingError("This topic cannot be generated. Please try a different topic.");
} else {
  setBrewingError("Failed to start brewing topic. Please try again.");
}
```

## Performance and Scalability

### Asynchronous Processing

- **QStash Integration**: Reliable message queuing with retry logic
- **Background Processing**: Generation doesn't block user interface
- **Status Updates**: Real-time progress tracking via notifications

### Resource Management

- **Session Management**: Automatic cleanup of agent sessions
- **Memory Optimization**: Streaming responses for large content
- **Rate Limiting**: Built-in rate limiting for external APIs

### Monitoring

- **Generation Metrics**: Track success rates and processing times
- **Error Tracking**: Comprehensive error logging and alerting
- **Resource Usage**: Monitor API usage and costs

## Configuration

### Environment Variables

```bash
# Topic generation services
TOPIC_CHECKER_BASE_URL=https://your-topic-checker-service.com
TOPIC_GENERATOR_BASE_URL=https://your-topic-generator-service.com
TOPIC_GENERATOR_RENDER_URL=https://your-generator-api.com

# QStash configuration
QSTASH_TOKEN=your_qstash_token

# External APIs
GOOGLE_API_KEY=your_google_api_key
EXA_API_KEY=your_exa_api_key
SERPER_API_KEY=your_serper_api_key

# Convex database
CONVEX_URL=your_convex_deployment_url
```

### Agent Configuration

Each agent service has its own configuration:

```python
# agents/topic-checker/.env
GOOGLE_API_KEY=your_google_api_key
MODEL_NAME=gemini-2.5-flash
MAX_RETRIES=3
TIMEOUT_SECONDS=30

# agents/topic-generator/.env
GOOGLE_API_KEY=your_google_api_key
EXA_API_KEY=your_exa_api_key
SERPER_API_KEY=your_serper_api_key
CONVEX_URL=your_convex_deployment_url
```

## Future Enhancements

### Planned Features

1. **Batch Generation**: Generate multiple topics simultaneously
2. **User Preferences**: Personalized content based on user history
3. **Content Updates**: Automatic updates for outdated content
4. **Multi-language Support**: Generate content in multiple languages
5. **Advanced Analytics**: Detailed generation metrics and optimization

### Performance Improvements

1. **Caching**: Cache frequently generated topics
2. **Parallel Processing**: Run agents in parallel where possible
3. **Resource Optimization**: Optimize API usage and costs
4. **Quality Metrics**: Automated quality assessment and improvement

This topic generation system provides WSIC with the ability to create comprehensive, high-quality educational content on-demand, ensuring users always have access to relevant learning materials.