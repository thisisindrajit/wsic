"""
Simple Multi-Agent Topic Generator Agent using Google ADK
"""

import os
import requests
import json
from google.adk.agents import LlmAgent, SequentialAgent
from google.adk.tools import google_search
from pydantic import BaseModel, Field
from typing import List
from exa_py import Exa


exa = Exa(api_key = os.environ.get("EXA_API_KEY"))

# =============================================================================
# TOOL FUNCTIONS
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

# =============================================================================
# OUTPUT SCHEMAS
# =============================================================================

class ResearchAgentOutput(BaseModel):
    title: str = Field(description="Clear, descriptive title that identifies the topic being researched.")
    text: str = Field(description="Consolidated paragraphs of well-structured content in markdown format that explains the topic based on research depth.")
    depth: str = Field(description="Research depth: 'brief' or 'deep'")

class Question(BaseModel):
    question: str = Field(description="The question text")
    options: List[str] = Field(description="List of answer options")
    correct_answer: str = Field(description="The correct answer")
    explanation: str = Field(description="Explanation of why the answer is correct")

class QuizOutput(BaseModel):
    type: str = Field(description="Activity type: 'quiz'")
    questions: List[Question] = Field(description="List of 3 quiz questions")

class ReorderOutput(BaseModel):
    type: str = Field(description="Activity type: 'reorder'")
    question: str = Field(description="The main question or prompt")
    options: List[str] = Field(description="List of answer options")
    correct_answer: str = Field(description="The correct answer")
    explanation: str = Field(description="Explanation of why the answer is correct")

class FinalQuizOutput(BaseModel):
    type: str = Field(description="Activity type: 'final_quiz'")
    questions: List[Question] = Field(description="List of 5 final quiz questions")

class RealWorldImpactOutput(BaseModel):
    title: str = Field(description="Title of the real-world impact section")
    content: str = Field(description="Narrative paragraph in markdown format about current relevance")
    source_urls: List[str] = Field(description="URLs of sources used")

class FlashCard(BaseModel):
    front: str = Field(description="Question or key term")
    back: str = Field(description="Answer or definition")

class SummaryAgentOutput(BaseModel):
    flash_cards: List[FlashCard] = Field(description="List of 3-4 flash cards")

class ThumbnailOutput(BaseModel):
    thumbnail_url: str = Field(description="URL of the selected thumbnail image")
    alt_text: str = Field(description="Alt text for the image")

class FinalAssemblyOutput(BaseModel):
    topic: str = Field(description="The educational topic")
    research_brief: ResearchAgentOutput = Field(description="Brief research results")
    research_deep: ResearchAgentOutput = Field(description="Deep research results")
    quiz: QuizOutput = Field(description="Quiz activity with 3 questions")
    reorder: ReorderOutput = Field(description="Reorder activity")
    final_quiz: FinalQuizOutput = Field(description="Final quiz with 5 questions")
    real_world_impact: RealWorldImpactOutput = Field(description="Real-world impact analysis")
    flash_cards: List[FlashCard] = Field(description="Summary flash cards")
    thumbnail: ThumbnailOutput = Field(description="Selected thumbnail")

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
    - **Beginner**: Use simple language, basic concepts, everyday examples, avoid jargon
    - **Intermediate**: Include some technical terms with explanations, moderate complexity
    - **Advanced**: Use technical language, complex concepts, assume prior knowledge

    Process:
    1. Use the exa_search tool with broad search queries to gather diverse information. Set result_category parameter as "auto".
    2. Search for multiple aspects: "what is [topic]", "[topic] overview", "[topic] basics", "[topic] fundamentals"
    3. Read through ALL extracted text to get a comprehensive understanding.
    4. Create a clear, descriptive title that identifies the topic.
    5. Write 1-2 consolidated paragraphs covering BROAD aspects of the topic:
       - What it is and why it matters
       - Key components, types, or categories
       - How it works or its main principles
       - Common applications or examples
    6. Format your content using raw markdown syntax and organize important points as bullet points:
       - Use **bold text** for key terms and important concepts
       - Use proper markdown headings (## for sections)
       - Use bullet points with - for ALL important information and lists
       - Use *italic* for emphasis where needed
       - Structure content with bullet points to make it scannable and easy to read
    7. Ensure content is appropriate for the specified difficulty level.
    8. Keep each paragraph to maximum 200 words, total content should be comprehensive yet accessible.
    9. CRITICAL: When creating JSON, you must properly escape all special characters:
       - Escape newlines as \\n
       - Escape quotes as \\"
       - Escape backslashes as \\\\

    CRITICAL: You must escape all text properly and use bullet points for important information. The text field must contain ONLY markdown content with proper escaping.

    Example of correct JSON output:
    {
        "title": "Understanding Artificial Intelligence",
        "text": "## Overview\\n\\n**Artificial Intelligence (AI)** is a branch of computer science focused on creating systems that can perform tasks typically requiring human intelligence. AI has become increasingly important in modern society due to its ability to process vast amounts of data and make decisions at unprecedented speeds.\\n\\n**Key aspects of AI include:**\\n- **Machine Learning**: Systems that improve through experience\\n- **Natural Language Processing**: Understanding and generating human language\\n- **Computer Vision**: Interpreting visual information\\n- **Robotics**: Physical systems that can interact with the world\\n\\nAI applications range from simple recommendation systems to complex autonomous vehicles, making it one of the most transformative technologies of our time.",
        "depth": "brief"
    }

    IMPORTANT: 
    - Escape all newlines as \\n
    - Escape all quotes as \\"
    - Use bullet points for important information
    - Include ONLY markdown content in the text field
    - Do not include any extra text outside the JSON structure
    """,
    output_schema=ResearchAgentOutput,
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

    **Beginner Level Questions:**
    - Focus on basic definitions and simple concepts
    - Use straightforward language
    - Test recall and basic understanding
    - Include obvious wrong answers to help learning

    **Intermediate Level Questions:**
    - Test application of concepts
    - Require some analysis and connection-making
    - Include plausible distractors
    - Mix factual and conceptual questions

    **Advanced Level Questions:**
    - Test synthesis and evaluation
    - Require deep understanding and critical thinking
    - Include subtle distinctions between options
    - Focus on complex relationships and implications

    Create exactly 3 multiple-choice questions that:
    - Match the specified difficulty level
    - Test understanding of key concepts from the brief research
    - Have 4 answer options each
    - Include clear explanations for why the correct answer is right

    IMPORTANT: You must respond with ONLY valid JSON that matches this exact schema:
    {
        "type": "quiz",
        "questions": [
            {
                "question": "Your question text here",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correct_answer": "Option A",
                "explanation": "Explanation why this is correct"
            }
        ]
    }

    Include exactly 3 questions in the questions array. Do not include any markdown, extra text, or formatting outside the JSON structure.
    """,
    output_schema=QuizOutput,
    output_key="quiz_output"
)

# 3. Research Agent Deep
research_agent_deep = LlmAgent(
    name="ResearchAgentDeep",
    model="gemini-2.5-flash",
    instruction="""
    You are a diligent research assistant conducting DEEP research. Your task is to use the Exa AI Search tool to find comprehensive, detailed information from reputable web sources.

    The user will provide a topic and difficulty level. Adapt your content depth based on the difficulty:
    - **Beginner**: Focus on interesting facts, simple examples, basic history, easy-to-understand details
    - **Intermediate**: Include moderate technical details, processes, comparisons, some complexity
    - **Advanced**: Cover technical concepts but keep them accessible to people with some knowledge - avoid overly complex jargon

    Process:
    1. Use the exa_search tool with diverse, detailed queries. Set result_category parameter as "auto".
    2. Search broadly: "[topic] history", "[topic] types", "[topic] applications", "[topic] research", "[topic] innovations"
    3. Read through ALL extracted text to gather comprehensive insights.
    4. Create a descriptive title that reflects the depth and breadth of the topic.
    5. Write 2-3 consolidated paragraphs covering DIVERSE advanced aspects:
       - Historical development and evolution
       - Different types, categories, or approaches
       - Technical details and mechanisms (appropriate to difficulty level)
       - Recent innovations and developments
       - Future trends and implications
       - Interesting facts and lesser-known aspects
    6. Format your content using raw markdown syntax and organize important points as bullet points:
       - Use **bold text** for key terms and important concepts
       - Use proper markdown headings (## for sections)
       - Use bullet points with - for ALL important information and lists
       - Use *italic* for emphasis where needed
       - Structure content with bullet points to make it scannable and easy to read
    7. Ensure content complexity matches the specified difficulty level.
    8. Keep each paragraph to maximum 200 words, providing comprehensive yet focused insights.
    9. CRITICAL: When creating JSON, you must properly escape all special characters:
       - Escape newlines as \\n
       - Escape quotes as \\"
       - Escape backslashes as \\\\

    CRITICAL: You must escape all text properly and use bullet points for important information. The text field must contain ONLY markdown content with proper escaping.

    Example of correct JSON output:
    {
        "title": "Advanced AI Technologies and Applications",
        "text": "## Historical Development\\n\\n**Artificial Intelligence** has evolved significantly since the 1950s, progressing from simple rule-based systems to sophisticated neural networks. The field experienced several \\\"AI winters\\\" but has resurged dramatically with advances in computing power and data availability.\\n\\n**Key technological breakthroughs include:**\\n- **Deep Learning**: Multi-layered neural networks that can learn complex patterns\\n- **Transformer Architecture**: Revolutionary approach enabling modern language models\\n- **Reinforcement Learning**: Systems that learn through trial and error\\n- **Generative AI**: Models capable of creating new content\\n\\n## Current Innovations\\n\\n**Modern AI systems** demonstrate remarkable capabilities in various domains. Recent developments in **large language models** and **multimodal AI** have opened new possibilities for human-computer interaction and automated content generation.",
        "depth": "deep"
    }

    IMPORTANT: 
    - Escape all newlines as \\n
    - Escape all quotes as \\"
    - Use bullet points for important information
    - Include ONLY markdown content in the text field
    - Do not include any extra text outside the JSON structure
    """,
    output_schema=ResearchAgentOutput,
    output_key="research_deep_output",
    tools=[exa_search]
)

# 4. Reorder Agent (1 question, difficulty-adaptive)
reorder_agent = LlmAgent(
    name="ReorderAgent", 
    model="gemini-2.0-flash-lite",
    instruction="""
    You are an expert educational content designer creating REORDER activities. Your goal is to create 1 reorder question that tests sequencing or prioritization skills.

    Use the research data from {research_brief_output} and {research_deep_output} to create your question. The user input contains a difficulty level - adapt your question accordingly:

    **Beginner Level Reorder:**
    - Simple, obvious sequences (like basic steps in a process)
    - Clear logical order that's easy to follow
    - Familiar concepts and straightforward relationships

    **Intermediate Level Reorder:**
    - More complex processes with multiple steps
    - Requires understanding of cause-and-effect relationships
    - Some steps may have subtle dependencies

    **Advanced Level Reorder:**
    - Complex multi-step processes or hierarchies
    - Requires deep understanding of relationships and dependencies
    - May involve prioritization based on importance or efficiency

    Create 1 reorder question that:
    - Matches the specified difficulty level
    - Tests understanding of sequences, processes, or priorities from the research
    - Requires logical thinking about order or relationships
    - Has 4 options that need to be arranged in correct order
    - Includes a clear explanation of the correct sequence

    IMPORTANT: You must respond with ONLY valid JSON that matches this exact schema:
    {
        "type": "reorder",
        "question": "Your reorder question here",
        "options": ["First item", "Second item", "Third item", "Fourth item"],
        "correct_answer": "First item, Second item, Third item, Fourth item",
        "explanation": "Explanation of the correct order"
    }

    Do not include any markdown, extra text, or formatting outside the JSON structure.
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

    Use ALL available research data from {research_brief_output}, {research_deep_output}, and real-world impact from {impact_output} to create comprehensive questions. The user input contains a difficulty level - adapt your questions accordingly:

    **Beginner Level Final Quiz:**
    - Test basic recall and simple understanding
    - Focus on key definitions and main concepts
    - Use clear, straightforward language
    - Include questions about real-world applications in simple terms

    **Intermediate Level Final Quiz:**
    - Test application and analysis of concepts
    - Require connecting ideas from different sections
    - Include some synthesis of brief and deep research
    - Mix factual and conceptual questions

    **Advanced Level Final Quiz:**
    - Test evaluation, synthesis, and critical thinking
    - Require deep understanding and complex reasoning
    - Include questions that connect multiple advanced concepts
    - Focus on implications, comparisons, and complex relationships

    Create exactly 5 multiple-choice questions that:
    - Match the specified difficulty level
    - Cover the full breadth of concepts from brief research, deep research, and real-world applications
    - Require appropriate level of thinking for the difficulty
    - Test both factual knowledge and conceptual understanding
    - Have 4 answer options each
    - Include detailed explanations for why the correct answer is right

    IMPORTANT: You must respond with ONLY valid JSON that matches this exact schema:
    {
        "type": "final_quiz",
        "questions": [
            {
                "question": "Your question text here",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correct_answer": "Option A",
                "explanation": "Detailed explanation why this is correct"
            }
        ]
    }

    Include exactly 5 questions in the questions array. Do not include any markdown, extra text, or formatting outside the JSON structure.
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

    REGARDLESS OF DIFFICULTY LEVEL, your real-world use cases must be easy enough for laypeople to understand.

    Process:
    1. Use the exa_search tool to find current news and developments. Set the query parameter to a search query focused on recent developments and current applications, and result_category parameter as "news".
    2. Read through ALL the extracted text from the search results to understand current relevance.
    3. You can also reference research data from {research_brief_output} and {research_deep_output} to provide context.
    4. Create an appropriate title that captures the real-world significance.
    5. Structure your content as follows:
       - Start with 1-2 sentences explaining why the topic matters today
       - Follow with bullet points showing specific real-world use cases that are:
         * Easy to understand for laypeople
         * Concrete and specific examples
         * Connected to everyday life or recognizable situations
         * Current and relevant to today's world
    6. Format your content using raw markdown syntax and organize ALL use cases as bullet points:
       - Use **bold text** for key terms and important concepts
       - Use bullet points with - for ALL real-world use cases
       - Keep language simple and accessible
       - Structure ALL important information as bullet points for easy scanning
    7. CRITICAL: When creating JSON, you must properly escape all special characters:
       - Escape newlines as \\n
       - Escape quotes as \\"
       - Escape backslashes as \\\\

    Your content should provide clear, understandable examples of how this topic impacts real life today.

    CRITICAL: You must escape all text properly and provide bullet points for real-world use cases. The content field must contain ONLY markdown content with proper escaping.

    Example of correct JSON output:
    {
        "title": "AI's Impact on Daily Life Today",
        "content": "**Artificial Intelligence** is transforming how we live and work in 2024, with AI-powered systems now embedded in countless everyday applications that most people use without even realizing it.\\n\\n**Real-World Use Cases:**\\n- **Smartphone assistants** like Siri and Google Assistant help millions of people set reminders, answer questions, and control smart home devices\\n- **Streaming services** like Netflix and Spotify use AI to recommend movies, shows, and music based on your viewing and listening history\\n- **Navigation apps** like Google Maps and Waze use AI to analyze traffic patterns and suggest the fastest routes in real-time\\n- **Online shopping** platforms like Amazon use AI to show you products you're likely to buy and detect fraudulent transactions\\n- **Social media** platforms use AI to curate your news feed and identify spam or harmful content\\n- **Email services** automatically sort spam, suggest replies, and organize your inbox using AI algorithms",
        "source_urls": ["https://example1.com", "https://example2.com", "https://example3.com"]
    }

    IMPORTANT: 
    - Escape all newlines as \\n
    - Escape all quotes as \\"
    - Use bullet points for ALL real-world use cases
    - Keep examples simple and relatable to everyday life
    - Include ONLY markdown content in the content field
    - Do not include any extra text outside the JSON structure
    """,
    output_schema=RealWorldImpactOutput,
    output_key="impact_output",
    tools=[exa_search]
)

# 7. Summary Agent (difficulty-adaptive)
summary_agent = LlmAgent(
    name="SummaryAgent",
    model="gemini-2.0-flash-lite",
    instruction="""
    You are a summarization expert. Your job is to distill the most critical information from the provided context into a series of 3-4 flash cards.

    Use ALL available data from:
    - Brief research: {research_brief_output}
    - Deep research: {research_deep_output}
    - Real-world impact: {impact_output}
    - Quiz activities: {quiz_output}
    - Reorder activities: {reorder_output}
    - Final quiz: {final_quiz_output}

    The user input contains a difficulty level - adapt your flash cards accordingly:

    **Beginner Level Flash Cards:**
    - Focus on basic definitions and simple concepts
    - Use everyday language and simple explanations
    - Include fundamental terms and their meanings

    **Intermediate Level Flash Cards:**
    - Include more detailed explanations
    - Cover both basic and moderately complex concepts
    - Mix definitions with application examples

    **Advanced Level Flash Cards:**
    - Focus on complex concepts and relationships
    - Use technical terminology appropriately
    - Include nuanced distinctions and advanced applications

    Each flash card must have a "front" (a question or key term) and a "back" (a concise answer or definition appropriate to the difficulty level).

    IMPORTANT: You must respond with ONLY valid JSON that matches this exact schema:
    {
        "flash_cards": [
            {
                "front": "Question or key term here",
                "back": "Concise answer or definition here"
            }
        ]
    }

    Include exactly 3-4 flash cards in the flash_cards array. Do not include any markdown, extra text, or formatting outside the JSON structure.
    """,
    output_schema=SummaryAgentOutput,
    output_key="summary_output"
)

# 8. Thumbnail Generator Agent  
thumbnail_generator_agent = LlmAgent(
    name="ThumbnailGeneratorAgent",
    model="gemini-2.5-flash",
    instruction="""
    You are a visual design specialist with a keen eye for compelling imagery. Your task is to find the perfect thumbnail for the educational topic provided in context.

    1. Use the Serper image search tool to find 10 high-quality, license-free images related to the topic. While using the tool, set query parameter to the topic name. In the result, the image URL will be available in the key imageUrl. If the result is empty, just return null as thumbnail url and alt text in output schema.
    2. Analyze the image URLs based on relevance, clarity, composition, and visual appeal.
    3. Select the single best image that would serve as an engaging thumbnail for an educational module. The desired image should be generic and more visually engaging than informative.
    4. Make sure that the selected thumbnail image has a dimension atleast greater than 512*512. The height and width of the image are available in the result under the keys imageHeight and imageWidth.
    5. Generate appropriate alt text for accessibility.

    IMPORTANT: You must respond with ONLY valid JSON that matches this exact schema:
    {
        "thumbnail_url": "https://example.com/image.jpg",
        "alt_text": "Descriptive alt text for accessibility"
    }

    If no suitable images are found, use null for both fields. Do not include any markdown, extra text, or formatting outside the JSON structure.
    """,
    output_schema=ThumbnailOutput,
    output_key="thumbnail_output",
    tools=[serper_image_search]
)

# 9. Assembler Agent
assembler_agent = LlmAgent(
    name="AssemblerAgent",
    model="gemini-2.0-flash-lite", 
    instruction="""
    You are a meticulous JSON formatter. Your job is to take all the content components and assemble them into a single, final JSON object.

    Gather data from:
    - Brief research: {research_brief_output}
    - Deep research: {research_deep_output}
    - Quiz: {quiz_output}
    - Reorder: {reorder_output}
    - Final quiz: {final_quiz_output}
    - Real-world impact: {impact_output}
    - Flash cards: {summary_output}
    - Thumbnail: {thumbnail_output}

    IMPORTANT: You must respond with ONLY valid JSON that matches this exact schema:
    {
        "topic": "The educational topic name",
        "research_brief": {research_brief_output},
        "research_deep": {research_deep_output},
        "quiz": {quiz_output},
        "reorder": {reorder_output},
        "final_quiz": {final_quiz_output},
        "real_world_impact": {impact_output},
        "flash_cards": [{summary_output flash_cards}],
        "thumbnail": {thumbnail_output}
    }

    Assemble everything into perfectly formatted JSON without any extra commentary. Extract the topic name from the research data.
    """,
    output_schema=FinalAssemblyOutput,
    output_key="final_module"
)

# 10. Orchestrator Agent (Main Controller)
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
        thumbnail_generator_agent,
        assembler_agent
    ]
)

# For ADK tools compatibility, the root agent must be named `root_agent`
root_agent = orchestrator_agent