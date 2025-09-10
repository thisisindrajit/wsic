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
"topic": "GANs",
"difficulty": "intermediate",
"created_by": "1",
"publish_immediately": True,
"research_brief": {
"title": "Generative Adversarial Networks (GANs): An Intermediate Overview",
"text": "Generative Adversarial Networks (GANs) are a class of powerful deep learning models introduced by Ian Goodfellow in 2014, designed to generate new, synthetic data that closely resembles real-world data. Operating within an unsupervised learning framework, GANs are particularly significant because they address the challenge of generating high-fidelity content, which was traditionally difficult for other generative models. Their importance stems from their ability to create realistic images, text, and audio, opening up new possibilities across various fields by learning the underlying patterns and distributions of complex datasets.\n\nThe core mechanism of a GAN involves a game-theoretic adversarial process between two competing deep neural networks:\n- The Generator (G): This network takes a random noise vector, often referred to as a latent space input, and transforms it into synthetic data (e.g., an image). Its objective is to produce data that is so realistic that it can fool the discriminator.\n- The Discriminator (D): This network acts as a binary classifier, receiving both real data samples from the training set and fake data generated by the generator. Its task is to distinguish between real and fake inputs, assigning a probability score indicating its belief that an input is real.\n\nDuring training, these two networks engage in a continuous feedback loop. The generator continuously refines its data generation process based on the discriminator's feedback, while the discriminator improves its ability to identify synthetic data. This adversarial \"cat and mouse\" game drives both networks to improve until the generator produces outputs that are virtually indistinguishable from real data, and the discriminator can no longer reliably tell the difference. This innovative approach has led to wide-ranging applications in areas such as synthetic data generation, image-to-image translation, artistic style transfer, and super-resolution.",
"depth": "brief",
"block_type": "information"
},
"research_deep": {
"title": "Advanced GAN Architectures, Training Dynamics, and Evaluation Metrics",
"text": "Generative Adversarial Networks (GANs) have evolved significantly from their foundational concept, incorporating sophisticated architectures and advanced training techniques to overcome inherent challenges. Beyond the basic generator-discriminator pair, key architectural advancements include Deep Convolutional GANs (DCGANs), which leverage convolutional layers and batch normalization for more stable and high-quality image generation. Conditional GANs (CGANs) extend this by introducing conditional information to both the generator and discriminator, allowing for targeted data synthesis (e.g., generating a specific type of image based on a label). More recently, StyleGAN introduced a style-based generator architecture that enables intuitive control over artistic characteristics at different levels of detail, from coarse features to fine-grained styles, by injecting latent codes into various points of the network.\n\nTraining GANs presents notable challenges, primarily mode collapse and training instability. Mode collapse occurs when the generator produces a limited variety of outputs, failing to capture the full diversity of the real data distribution. To address these issues, various modifications to the original minimax loss function have been developed. Examples include the Wasserstein GAN (WGAN), which uses the Earth Mover's Distance (Wasserstein-1 distance) to provide a more stable gradient and prevent vanishing gradients, often coupled with a Gradient Penalty (WGAN-GP) for Lipschitz constraint enforcement. Other techniques like Hinge Loss and RLC Regularization further enhance stability and diversity. The performance of GANs is often quantitatively assessed using metrics such as the Fréchet Inception Distance (FID), which measures the similarity between real and generated images by comparing their feature distributions, and the Kernel Inception Distance (KID), another metric for evaluating generative model quality.\n\nIn industry, advanced GANs are utilized in diverse applications, extending beyond mere image generation. They are crucial for synthetic data generation, offering solutions for data augmentation in scenarios with limited real datasets, and for privacy-preserving data sharing. In creative industries, GANs power applications like realistic image-to-image translation (e.g., converting sketches to photorealistic images or day scenes to night scenes), artistic style transfer, and high-resolution video synthesis. Furthermore, GANs contribute to specialized fields such as medical imaging, where they can generate synthetic pathological images for training diagnostic AI, and in 3D model synthesis for virtual reality and gaming, demonstrating their versatility and impact across a multitude of technical and artistic domains.",
"depth": "deep",
"block_type": "information"
},
"quiz": {
"type": "quiz",
"block_type": "activity",
"questions": [
{
"question": "What is the primary goal of a Generative Adversarial Network (GAN)?",
"options": [
"To classify existing data into categories.",
"To generate new data that resembles real-world data.",
"To compress data for storage.",
"To perform mathematical calculations."
],
"correct_answer": "To generate new data that resembles real-world data.",
"explanation": "GANs are specifically designed to create new, synthetic data, such as images or text, that mimics the characteristics of real data."
},
{
"question": "In a GAN, what is the function of the Discriminator (D) network?",
"options": [
"To generate random noise.",
"To transform noise into synthetic data.",
"To distinguish between real and fake data.",
"To store the generated data."
],
"correct_answer": "To distinguish between real and fake data.",
"explanation": "The Discriminator's primary role is to act as a binary classifier, identifying whether a given input is real or was generated by the Generator."
},
{
"question": "What type of learning framework do GANs primarily operate within?",
"options": [
"Supervised learning",
"Reinforcement learning",
"Unsupervised learning",
"Semi-supervised learning"
],
"correct_answer": "Unsupervised learning",
"explanation": "GANs learn from data without explicit labels or instructions, making them an unsupervised learning model."
}
]
},
"reorder": {
"type": "reorder",
"block_type": "activity",
"question": "Put the following steps in the GAN training process in the correct order:",
"options": [
"The Discriminator provides feedback to the Generator.",
"The Generator creates synthetic data from random noise.",
"The Discriminator evaluates both real and generated data.",
"The Generator adjusts its data generation based on the feedback."
],
"correct_answer": "The Generator creates synthetic data from random noise., The Discriminator evaluates both real and generated data., The Discriminator provides feedback to the Generator., The Generator adjusts its data generation based on the feedback.",
"explanation": "The process begins with the Generator creating synthetic data, followed by the Discriminator's evaluation. The Discriminator then provides feedback, which the Generator uses to refine its output in an iterative loop."
},
"final_quiz": {
"type": "final_quiz",
"block_type": "activity",
"questions": [
{
"question": "Which of the following is a key advantage of GANs in generating synthetic data compared to traditional generative models?",
"options": [
"GANs require less computational power.",
"GANs can generate higher-fidelity content.",
"GANs are easier to train and implement.",
"GANs do not require any real-world data."
],
"correct_answer": "GANs can generate higher-fidelity content.",
"explanation": "GANs are known for their ability to produce highly realistic outputs, which is a significant improvement over earlier generative models that often struggled with the complexity of real-world data distributions."
},
{
"question": "What is the role of 'latent space' in the context of a GAN?",
"options": [
"It is where the discriminator's output is stored.",
"It is the space where the real data resides.",
"It is a random noise vector used as input to the generator.",
"It is the space where the generated images are stored."
],
"correct_answer": "It is a random noise vector used as input to the generator.",
"explanation": "The latent space provides a source of randomness that the generator transforms into synthetic data. This input is crucial for the generator to create diverse outputs."
},
{
"question": "In the adversarial game played by GANs, what is the ultimate objective of the Generator?",
"options": [
"To accurately classify real images.",
"To produce outputs that are easily identified as fake.",
"To create data that is indistinguishable from real data.",
"To minimize the loss of the Discriminator."
],
"correct_answer": "To create data that is indistinguishable from real data.",
"explanation": "The Generator's goal is to fool the Discriminator, which means generating synthetic data that the Discriminator cannot differentiate from real-world examples."
},
{
"question": "Which of the following is a significant challenge in training GANs, leading to unstable training or a lack of output diversity?",
"options": [
"Overfitting",
"Mode collapse",
"Vanishing gradients",
"Underfitting"
],
"correct_answer": "Mode collapse",
"explanation": "Mode collapse occurs when the generator produces a limited variety of outputs, failing to capture the full diversity of the real data distribution. This is a key problem in GAN training."
},
{
"question": "What is the primary application of StyleGAN in the creative industries?",
"options": [
"Generating text from images.",
"Performing image classification tasks.",
"Enabling fine-grained control over the style of generated images.",
"Detecting deepfakes."
],
"correct_answer": "Enabling fine-grained control over the style of generated images.",
"explanation": "StyleGAN's style-based generator architecture allows artists and designers to manipulate various aspects of the generated images, from broad features to fine details, offering unprecedented control over the creative process."
}
]
},
"real_world_impact": {
"title": "Generative Adversarial Networks (GANs): Crafting Our Digital Future",
"content": "Generative Adversarial Networks (GANs) are at the forefront of AI innovation today, rapidly transforming how we create and interact with digital content. These powerful deep learning models are unique because they learn to generate incredibly realistic new data, from images and videos to text and audio, by constantly improving in an adversarial 'game' against another AI that tries to tell the real from the fake. This ability to synthesize believable content has profound implications across various industries and our daily lives.\n\nReal-World Use Cases:\n- Creating Realistic Faces and Characters: Imagine a game developer needing thousands of unique, realistic faces for non-player characters or virtual assistants. GANs, particularly models like StyleGAN, can generate an endless array of convincing human faces and features that don't belong to any real person, saving immense time and resources.\n- Detecting Deepfakes and AI-Generated Content: As GANs become more sophisticated at creating fake images and videos (known as deepfakes), other GANs are being developed to detect them. This is crucial for verifying the authenticity of media in news, social media, and legal contexts to combat misinformation.\n- Enhancing and Restoring Images: Ever wished an old, blurry photo could be made clear, or a low-resolution image scaled up without losing quality? GANs can intelligently add detail and sharpness, transforming old or poor-quality visuals into high-resolution, lifelike images.\n- Transforming Art and Design: Artists and designers use GANs for artistic style transfer, applying the style of famous paintings to their photos, or for image-to-image translation, turning simple sketches into fully rendered architectural designs or concept art.\n- Generating Synthetic Data for Training AI: In fields like medical imaging, where real patient data is scarce or privacy-sensitive, GANs can create realistic synthetic MRI or X-ray images. This allows AI systems to be trained on larger, more diverse datasets without compromising patient confidentiality.\n- Producing High-Quality Video and Animation: From creating realistic visual effects in movies to generating lifelike avatars for virtual reality and gaming, GANs are enabling the synthesis of complex, high-resolution video and 3D models, making digital worlds more immersive.",
"source_urls": [
"https://www.emergencytechshow.com/exhibitor-press-releases/face-gan-deepfake-detection-filter",
"https://www.simplilearn.com/generative-adversarial-networks-applications-article",
"https://www.toolify.ai/ai-news/stylegant-revolutionizing-texttoimage-with-nvidias-ai-628",
"https://www.toolify.ai/ai-news/unlocking-the-power-of-stylegan-creating-ai-generated-faces-6633",
"https://www.numberanalytics.com/blog/advanced-gan-creative-industries",
"https://viso.ai/deep-learning/generative-adversarial-networks-gan/",
"https://research.aimultiple.com/gan-use-cases/"
],
"block_type": "information"
},
"flash_cards": [
{
"front": "What are Generative Adversarial Networks (GANs)?",
"back": "Deep learning models that generate new, realistic data by using two competing neural networks: a Generator and a Discriminator."
},
{
"front": "What is the role of the Generator in a GAN?",
"back": "To create synthetic data from a random noise vector (latent space) that looks real enough to fool the Discriminator."
},
{
"front": "What is the purpose of the Discriminator in a GAN?",
"back": "To distinguish between real data and the fake data generated by the Generator."
},
{
"front": "What are some challenges in training GANs?",
"back": "Mode collapse (limited output variety) and training instability, which are addressed by advanced techniques such as WGAN and Hinge Loss."
}
],
"thumbnail": {
"thumbnail_url": "https://www.xenonstack.com/hs-fs/hubfs/generative-adversarial-network.jpg?width=3840&height=2160&name=generative-adversarial-network.jpg",
"alt_text": "Abstract representation of a generative adversarial network with interconnected nodes and data flowing."
},
"category_tags_description": {
"selected_category": "k57c82fsyjt8vpm5dwj42fv6h17q616z",
"short_description": "AI models generate realistic synthetic data through adversarial process.",
"generated_tags": [
"Deep Learning",
"Generative AI",
"Neural Networks",
"Data Synthesis",
"Machine Learning"
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