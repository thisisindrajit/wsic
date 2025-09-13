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
        return [0.0] * 1536


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
        
        # Create blocks - only insert specified outputs with type field
        order = 0
        
        # 1. Brief Research Text Block (information type)
        if research_brief.get("text"):
            client.mutation("blocks:createBlock", {
                "topicId": topic_id,
                "type": "information",
                "content": {
                    "type": "text",
                    "data": {
                        "content": {
                            "text": research_brief["text"]
                        },
                        "styleKey": "research_brief"
                    }
                },
                "order": order
            })
            order += 1
        
        # 2. Quiz Exercises (activity type) - Single JSON block
        quiz = output_data.get("quiz", {})
        if quiz.get("questions"):
            # Create a single block containing all quiz questions as JSON
            quiz_data = {
                "type": "quiz",
                "questions": []
            }
            for question_data in quiz["questions"]:
                options = [{"id": str(i), "text": opt} for i, opt in enumerate(question_data.get("options", []))]
                quiz_data["questions"].append({
                    "question": question_data.get("question", ""),
                    "options": options,
                    "correctAnswer": question_data.get("correct_answer", ""),
                    "explanation": question_data.get("explanation", ""),
                    "points": 10
                })
            
            client.mutation("blocks:createBlock", {
                "topicId": topic_id,
                "type": "activity",
                "content": {
                    "type": "exercise",
                    "data": {
                        "exerciseType": "quiz_group",
                        "quizData": quiz_data
                    }
                },
                "order": order
            })
            order += 1
        
        # 3. Deep Research Text Block (information type)
        if research_deep.get("text"):
            client.mutation("blocks:createBlock", {
                "topicId": topic_id,
                "type": "information",
                "content": {
                    "type": "text",
                    "data": {
                        "content": {
                            "text": research_deep["text"]
                        },
                        "styleKey": "research_deep"
                    }
                },
                "order": order
            })
            order += 1
        
        # 4. Reorder Exercise (activity type) - Single JSON block
        reorder = output_data.get("reorder", {})
        if reorder.get("question"):
            options = [{"id": str(i), "text": opt} for i, opt in enumerate(reorder.get("options", []))]
            reorder_data = {
                "type": "reorder",
                "question": reorder.get("question", ""),
                "options": options,
                "correctAnswer": reorder.get("correct_answer", ""),
                "explanation": reorder.get("explanation", ""),
                "points": 15
            }
            
            client.mutation("blocks:createBlock", {
                "topicId": topic_id,
                "type": "activity",
                "content": {
                    "type": "exercise",
                    "data": {
                        "exerciseType": "reorder_group",
                        "reorderData": reorder_data
                    }
                },
                "order": order
            })
            order += 1
        
        # 5. Real-World Impact Text Block (information type)
        if real_world_impact.get("content"):
            client.mutation("blocks:createBlock", {
                "topicId": topic_id,
                "type": "information",
                "content": {
                    "type": "text",
                    "data": {
                        "content": {
                            "text": real_world_impact["content"]
                        },
                        "styleKey": "real_world_impact"
                    }
                },
                "order": order
            })
            order += 1
        
        # 6. Final Quiz Exercises (activity type) - Single JSON block
        final_quiz = output_data.get("final_quiz", {})
        if final_quiz.get("questions"):
            # Create a single block containing all final quiz questions as JSON
            final_quiz_data = {
                "type": "final_quiz",
                "questions": []
            }
            for question_data in final_quiz["questions"]:
                options = [{"id": str(i), "text": opt} for i, opt in enumerate(question_data.get("options", []))]
                final_quiz_data["questions"].append({
                    "question": question_data.get("question", ""),
                    "options": options,
                    "correctAnswer": question_data.get("correct_answer", ""),
                    "explanation": question_data.get("explanation", ""),
                    "points": 20
                })
            
            client.mutation("blocks:createBlock", {
                "topicId": topic_id,
                "type": "activity",
                "content": {
                    "type": "exercise",
                    "data": {
                        "exerciseType": "final_quiz_group",
                        "finalQuizData": final_quiz_data
                    }
                },
                "order": order
            })
            order += 1
        
        # 7. Summary Flash Cards (information type)
        flash_cards = output_data.get("flash_cards", [])
        if flash_cards:
            # Create a single text block containing all flash cards
            flash_cards_text = ""
            for i, card in enumerate(flash_cards, 1):
                flash_cards_text += f"**{i}. {card.get('front', '')}**\\n\\n{card.get('back', '')}\\n\\n"
            
            client.mutation("blocks:createBlock", {
                "topicId": topic_id,
                "type": "information",
                "content": {
                    "type": "text",
                    "data": {
                        "content": {
                            "text": flash_cards_text
                        },
                        "styleKey": "summary"
                    }
                },
                "order": order
            })
            order += 1
        
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
minimal_test_data = {
"topic": "Clinical Trials",
"difficulty": "Intermediate",
"created_by": "q3RZR7NPMo2BK9QRtiKoQGpAs3aBGYWZ",
"publish_immediately": True,
"research_brief": {
"title": "Clinical Trials: A Foundation of Medical Advancement",
"text": "Clinical trials are meticulously designed research studies involving human volunteers that evaluate the safety and efficacy of new medical interventions. These interventions can include novel drugs, vaccines, diagnostic procedures, or modifications to existing treatments. They are the cornerstone of medical progress, providing the scientific evidence required before a new treatment can be made widely available to the public. Through a structured process, researchers aim to answer critical questions about a treatment's effectiveness, potential side effects, and optimal use.\n\nClinical trials progress through several distinct phases, each with specific objectives:\n- Phase 0: Explores how a new drug is processed by the body at very low doses in a small number of participants, typically to understand drug action before extensive testing.\n- Phase 1: Focuses on safety, determining the most appropriate dose and identifying major side effects in a small group of healthy volunteers or patients.\n- Phase 2: Evaluates the effectiveness of the treatment for a specific condition in a larger group of patients, while continuing to monitor safety.\n- Phase 3: Compares the new treatment against standard treatments or a placebo in hundreds to thousands of participants to confirm efficacy, monitor side effects, and gather information for safe use. Successful completion of this phase is often required for regulatory approval.\n- Phase 4: Occurs after a treatment is approved and marketed. These studies continue to monitor long-term effects, optimal use in diverse populations, and identify any rare side effects.\n\nEthical considerations are paramount in clinical trials, ensuring the protection and well-being of participants. Key principles include:\n- Informed Consent: Participants must fully understand the study's purpose, procedures, potential risks, and benefits before voluntarily agreeing to participate.\n- Risk-Benefit Ratio: The potential benefits of the research must justify the risks involved for participants.\n- Independent Review: All clinical trial protocols are rigorously reviewed and approved by Ethics Committees (also known as Institutional Review Boards or IRBs) to safeguard participant rights and welfare.\n- Scientific Validity: The trial must be designed to yield reliable and meaningful results that contribute to medical knowledge.\n- Fair Subject Selection: Participants are chosen fairly, minimizing exploitation and ensuring equitable distribution of risks and benefits.",
"depth": "brief",
"block_type": "information"
},
"research_deep": {
"title": "Clinical Trials: Intermediate Methodologies, Regulatory Frameworks, and Data Management",
"text": "Clinical trials are underpinned by sophisticated technical methodologies designed to ensure the integrity and scientific validity of results. Key among these are randomization and blinding. Randomization involves assigning trial participants to different treatment groups with a predefined, unpredictable probability, effectively minimizing selection bias and ensuring that both known and unknown confounding factors are evenly distributed across groups. This allows for valid estimates of treatment effects. Blinding refers to the practice of keeping participants, researchers, and/or data analysts unaware of the assigned treatment to reduce subjective expectations and prevent information bias. Single-blinding (participants unaware) and double-blinding (both participants and researchers/site staff unaware) are standard practices, with advanced trials sometimes employing triple-blinding (participants, investigators, and data analysis personnel unaware).\n\nAdherence to rigorous industry standards and regulatory oversight is paramount in clinical trials. Good Clinical Practice (GCP), an internationally recognized ethical and scientific quality standard, governs the design, conduct, recording, and reporting of trials involving human participants. GCP principles, often harmonized by organizations like the International Council for Harmonisation of Technical Requirements for Pharmaceuticals for Human Use (ICH), ensure the protection of human rights, data integrity, and compliance with global regulatory requirements (e.g., FDA in the US, EMA in Europe). Regulatory bodies mandate independent review by Ethics Committees or Institutional Review Boards (IRBs) to safeguard participant welfare and approve trial protocols.\n\nModern clinical trials heavily rely on advanced data management systems for efficiency and data quality. Electronic Data Capture (EDC) systems have largely replaced traditional paper-based methods, providing digital platforms for real-time, secure data entry, management, and storage. These systems utilize electronic Case Report Forms (eCRFs), which are digital versions of traditional CRFs, offering configurable edit checks, real-time validation, and comprehensive audit trails. EDC systems enhance data accuracy, reduce transcription errors, streamline data cleaning processes, and ensure 21 CFR Part 11 compliance (FDA regulations for electronic records and signatures), accelerating the path to database lock and regulatory submission.",
"depth": "deep",
"block_type": "information"
},
"quiz": {
"type": "quiz",
"block_type": "activity",
"questions": [
{
"question": "What is the primary goal of Phase 1 clinical trials?",
"options": [
"To determine the long-term effects of a treatment.",
"To evaluate the effectiveness of a treatment for a specific condition.",
"To assess the safety and identify side effects of a new treatment.",
"To compare a new treatment against a standard treatment or placebo."
],
"correct_answer": "To assess the safety and identify side effects of a new treatment.",
"explanation": "Phase 1 trials are specifically designed to assess the safety of a treatment and determine the appropriate dosage. The text clearly states this focus."
},
{
"question": "Which ethical principle ensures that participants understand the risks and benefits of a clinical trial before agreeing to participate?",
"options": [
"Risk-Benefit Ratio",
"Independent Review",
"Fair Subject Selection",
"Informed Consent"
],
"correct_answer": "Informed Consent",
"explanation": "Informed consent is explicitly defined in the text as requiring that participants fully understand the study before agreeing to participate. The other options are ethical principles, but do not directly address the participants' understanding."
},
{
"question": "What is the main function of Ethics Committees (IRBs) in clinical trials?",
"options": [
"To design the clinical trial protocols.",
"To recruit participants for the studies.",
"To review and approve trial protocols to protect participant rights and welfare.",
"To analyze the data collected from the trials."
],
"correct_answer": "To review and approve trial protocols to protect participant rights and welfare.",
"explanation": "The text states that Ethics Committees (IRBs) rigorously review and approve protocols to safeguard participant rights and welfare."
}
]
},
"reorder": {
"type": "reorder",
"block_type": "activity",
"question": "Place the following steps related to data management in a clinical trial in the correct order:",
"options": [
"Electronic Case Report Forms (eCRFs) are used for data entry.",
"Data is entered into Electronic Data Capture (EDC) systems.",
"The trial data meets the requirements for regulatory submission.",
"The data undergoes real-time validation and edit checks."
],
"correct_answer": "Data is entered into Electronic Data Capture (EDC) systems.,Electronic Case Report Forms (eCRFs) are used for data entry.,The data undergoes real-time validation and edit checks.,The trial data meets the requirements for regulatory submission.",
"explanation": "First, data is entered into EDC systems. Next, eCRFs are used within the EDC system for data entry. Then, the system performs real-time validation and edit checks to ensure data quality. Finally, after all data is entered and validated, the data meets the requirements for regulatory submission."
},
"final_quiz": {
"type": "final_quiz",
"block_type": "activity",
"questions": [
{
"question": "In clinical trials, what is the primary purpose of randomization?",
"options": [
"To ensure that all participants receive the same treatment.",
"To guarantee that the researchers know which treatment each participant receives.",
"To minimize selection bias and distribute confounding factors evenly across treatment groups.",
"To speed up the data analysis process at the end of the trial."
],
"correct_answer": "To minimize selection bias and distribute confounding factors evenly across treatment groups.",
"explanation": "Randomization is a key methodological tool in clinical trials designed to ensure that participants are assigned to different treatment groups by chance. This helps to prevent bias in the selection of participants and ensures that both known and unknown factors are distributed evenly across the groups, allowing for more reliable results."
},
{
"question": "What is the role of Good Clinical Practice (GCP) guidelines in clinical trials?",
"options": [
"To determine the specific treatments used in the trial.",
"To establish the ethical and scientific quality standards for conducting, recording, and reporting trials.",
"To dictate the statistical methods used for data analysis.",
"To manage the recruitment of patients for the study."
],
"correct_answer": "To establish the ethical and scientific quality standards for conducting, recording, and reporting trials.",
"explanation": "GCP is an internationally recognized standard that ensures the ethical conduct and scientific integrity of clinical trials involving human participants. It provides guidelines for all aspects of a clinical trial, from the design to the final report, guaranteeing participant safety and data reliability."
},
{
"question": "Which phase of clinical trials typically focuses on evaluating a treatment's effectiveness in a larger group of patients while continuing to monitor safety?",
"options": [
"Phase 0",
"Phase 1",
"Phase 2",
"Phase 4"
],
"correct_answer": "Phase 2",
"explanation": "Phase 2 clinical trials build upon the safety information gathered in Phase 1, and assess the efficacy of the treatment for a specific condition in a larger group of patients. Safety is still carefully monitored throughout this phase."
},
{
"question": "How do Electronic Data Capture (EDC) systems improve data management in modern clinical trials?",
"options": [
"By using paper-based forms, improving accuracy and efficiency.",
"By providing real-time, secure data entry, and management, reducing errors and streamlining processes.",
"By eliminating the need for regulatory compliance.",
"By limiting access to the data for all parties involved in the trial."
],
"correct_answer": "By providing real-time, secure data entry, and management, reducing errors and streamlining processes.",
"explanation": "EDC systems provide digital platforms for efficient data management, replacing traditional paper-based methods. They allow for real-time data entry, offer features such as configurable edit checks, real-time validation, and comprehensive audit trails, thereby enhancing data accuracy, reducing errors, and streamlining data cleaning."
},
{
"question": "What is the significance of triple-blinding in a clinical trial?",
"options": [
"It means only the participants are unaware of the treatment.",
"It refers to blinding of both participants and researchers/site staff.",
"It involves blinding of participants, investigators, and data analysis personnel to reduce bias.",
"It is only used in Phase 1 trials to assess safety."
],
"correct_answer": "It involves blinding of participants, investigators, and data analysis personnel to reduce bias.",
"explanation": "Triple-blinding is an advanced technique used to reduce bias in clinical trials. It ensures that neither the participants, the investigators administering the treatment, nor the data analysts evaluating the results know who is receiving which treatment. This helps to prevent subjective expectations from influencing the results."
}
]
},
"real_world_impact": {
"title": "Clinical Trials: Paving the Way for Tomorrow's Health Solutions Today",
"content": "Clinical trials are more dynamic and crucial than ever, directly shaping the future of medicine by rigorously testing new treatments, leveraging advanced technologies, and ensuring ethical patient protection to address critical health challenges globally. Recent breakthroughs in areas like gene therapy, precision medicine, and AI-driven enrollment highlight their ongoing and evolving impact on improving human health and quality of life.\n\n### Real-World Use Cases:\n\n* Conquering Inherited Blindness with Gene Therapy: Imagine a child born with a severe inherited retinal disease, facing a future of limited vision. Clinical trials, like the ongoing Phase 1/2 study for OPGx-LCA5 gene therapy, are offering a glimmer of hope. These trials begin by meticulously assessing the safety of a novel treatment in a small group (Phase 1), then expand to evaluate its effectiveness (Phase 2) in improving sight, potentially restoring vision for conditions once considered untreatable.\n\n* Precision Medicine for Cancer Treatment: For patients battling complex cancers such as acute myeloid leukemia or myelodysplastic syndromes, clinical trials are moving towards highly personalized treatments. The NCI's myeloMATCH trial, for instance, utilizes precision medicine by tailoring therapies based on an individual's unique genetic profile. This ensures that patients receive the most targeted and effective interventions, maximizing their chances of a positive outcome.\n\n* Finding Relief for Persistent Conditions like Chronic Cough: Clinical trials are essential for addressing widespread, debilitating conditions, even seemingly less life-threatening ones like refractory chronic cough. In Phase 3 trials for treatments like BLU-5937, methodologies such as randomization and double-blinding are critical. Participants are assigned to either the experimental drug or a placebo by chance, and neither they nor the research team know who receives which treatment. This rigorous approach minimizes bias, ensuring that any observed improvements are genuinely due to the treatment itself.\n\n* Preventing Future Health Crises: Beyond treating existing diseases, clinical trials are vital for prevention. An NIH trial currently assessing a rectal microbicide for HIV prevention exemplifies this. Throughout such studies, ethical considerations like informed consent are paramount. Participants are fully educated about the study's purpose, procedures, and potential risks and benefits before voluntarily agreeing to participate, safeguarding their well-being while pursuing public health solutions.\n\n* Accelerating Medical Discovery with Artificial Intelligence: The development of AI algorithms to match potential volunteers to clinical trials, as seen with NIH-developed tools, is transforming the research landscape. This innovation helps overcome a common hurdle in clinical research—recruiting suitable participants—by efficiently connecting individuals with trials that fit their needs, thereby accelerating the overall research timeline and bringing new treatments to market faster.\n\n* Ensuring Data Accuracy and Integrity with Digital Systems: In large-scale trials, modern Electronic Data Capture (EDC) systems and Electronic Case Report Forms (eCRFs) have replaced paper-based methods. These digital platforms provide real-time, secure data entry and management, complete with configurable edit checks and audit trails. This ensures the highest level of data accuracy and regulatory compliance (like 21 CFR Part 11), meaning that the extensive data collected from thousands of participants in studies (e.g., for Dementia with Lewy Bodies) is reliable and trustworthy for regulatory review.",
"source_urls": [
"https://eyewire.news/news/opus-genetics-announces-1-month-clinical-data-from-pediatric-patient-in-phase-12-trial-of-opgx-lca5-gene-therapy-in-inherited-retinal-diseases",
"https://ctv.veeva.com/study/a-52-week-study-of-the-efficacy-and-safety-of-blu-5937-in-adults-with-refractory-chronic-cough",
"https://www.nih.gov/health-information/nih-clinical-research-trials-you/news",
"https://practicalneurology.com/news/investigative-therapy-linked-to-improved-cognitive-behavioral-functional-and-motor-outcomes-for-people-with-dementia-with-lewy-bodies/2473783/",
"https://www.jnj.com/tag/clinical-trials"
],
"block_type": "information"
},
"flash_cards": [
{
"front": "What are the two key technical methodologies used in clinical trials to ensure reliable results?",
"back": "Randomization and blinding."
},
{
"front": "Define randomization and its purpose in clinical trials.",
"back": "Randomization is the process of assigning participants to treatment groups by chance. It minimizes selection bias and ensures that confounding factors are evenly distributed."
},
{
"front": "What is blinding and what types are commonly used in clinical trials?",
"back": "Blinding keeps participants, researchers, and/or data analysts unaware of treatment assignments. Common types are single-blinding (participants unaware) and double-blinding (participants and researchers unaware), with triple-blinding being more advanced."
},
{
"front": "What is Good Clinical Practice (GCP) and why is it important?",
"back": "GCP is an international ethical and scientific quality standard for clinical trials. It ensures human rights protection, data integrity, and compliance with regulations."
}
],
"thumbnail": {
"thumbnail_url": "https://www.bleeding.org/sites/default/files/image/CT%20Kit_Phases%20of%20Clinical%20Trials.png",
"alt_text": "An illustrative diagram depicting the four phases of clinical trials (Phase I, II, III, IV) with icons representing patients, researchers, and medical procedures, against a light blue background."
},
"category_tags_description": {
"selected_category": "j97byjak8wa1tgd4j3psncz1nn7qfdg1",
"short_description": "Research studies evaluating medical interventions' safety, efficacy, and ethics.",
"generated_tags": [
"Medical Research",
"Drug Development",
"Clinical Phases",
"Medical Ethics",
"Regulatory Compliance"
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