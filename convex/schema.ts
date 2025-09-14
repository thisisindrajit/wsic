import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Block content validators - single source of truth for all block types
export const researchBriefValidator = v.object({
  step: v.literal("research_brief"),
  data: v.object({
    title: v.string(),
    text: v.string(),
    depth: v.literal("brief"),
  }),
});

export const researchDeepValidator = v.object({
  step: v.literal("research_deep"),
  data: v.object({
    title: v.string(),
    text: v.string(),
    depth: v.literal("deep"),
  }),
});

export const realWorldImpactValidator = v.object({
  step: v.literal("real_world_impact"),
  data: v.object({
    title: v.string(),
    content: v.string(),
    source_urls: v.array(v.string()),
  }),
});

export const summaryValidator = v.object({
  step: v.literal("summary"),
  data: v.object({
    flash_cards: v.array(
      v.object({
        front: v.string(),
        back: v.string(),
      })
    ),
  }),
});

export const quizValidator = v.object({
  step: v.literal("quiz"),
  data: v.object({
    questions: v.array(
      v.object({
        question: v.string(),
        options: v.array(v.string()),
        correct_answer: v.string(),
        explanation: v.string(),
      })
    ),
  }),
});

export const reorderValidator = v.object({
  step: v.literal("reorder"),
  data: v.object({
    question: v.string(),
    options: v.array(v.string()),
    correct_answer: v.array(v.string()),
    explanation: v.string(),
  }),
});

export const finalQuizValidator = v.object({
  step: v.literal("final_quiz"),
  data: v.object({
    questions: v.array(
      v.object({
        question: v.string(),
        options: v.array(v.string()),
        correct_answer: v.string(),
        explanation: v.string(),
      })
    ),
  }),
});

// Union of all block content validators
export const blockContentValidator = v.union(
  researchBriefValidator,
  researchDeepValidator,
  realWorldImpactValidator,
  summaryValidator,
  quizValidator,
  reorderValidator,
  finalQuizValidator
);

export default defineSchema({
  // Categories - Topic categories
  categories: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    lightHex: v.optional(v.string()), // Hex color for light mode
    darkHex: v.optional(v.string()), // Hex color for dark mode
    icon: v.optional(v.string()), // Icon identifier
  })
    .index("by_slug", ["slug"])
    .index("by_name", ["name"]),

  // Topics - Main content entities that users explore
  topics: defineTable({
    title: v.string(),
    description: v.string(),
    slug: v.string(), // URL-friendly identifier
    categoryId: v.optional(v.id("categories")),
    tagIds: v.array(v.string()), // Array of tag strings
    imageUrl: v.optional(v.string()), // URL for the topic's image
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
    estimatedReadTime: v.number(), // in minutes
    isPublished: v.boolean(),
    isTrending: v.boolean(),
    viewCount: v.number(),
    likeCount: v.number(),
    shareCount: v.number(),
    createdBy: v.optional(v.string()), // Better Auth user ID
    lastUpdated: v.number(),
    isAIGenerated: v.boolean(),
    generationPrompt: v.optional(v.string()),
    sources: v.optional(v.array(v.string())),
    metadata: v.optional(
      v.object({
        wordCount: v.number(),
        readingLevel: v.any(),
        estimatedTime: v.optional(v.number()), // minutes to complete
        exerciseCount: v.optional(v.number()),
      })
    ),
  })
    .index("by_slug", ["slug"])
    .index("by_category", ["categoryId"])
    .index("by_trending", ["isTrending"])
    .index("by_published", ["isPublished"])
    .index("by_created_by", ["createdBy"])
    .searchIndex("search_topics", {
      searchField: "title",
      filterFields: ["categoryId", "isPublished", "isTrending"],
    }),

  // Embeddings - Vector embeddings for semantic search
  embeddings: defineTable({
    topicId: v.id("topics"), // Foreign key reference to topics table
    embedding: v.array(v.float64()), // Vector embedding
    contentType: v.union(
      v.literal("research_brief"),
      v.literal("research_deep"),
      v.literal("combined_content")
    ), // Type of content that was embedded
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ), // Copy of topic difficulty for filtering
    categoryId: v.optional(v.id("categories")), // Copy of topic category for filtering
  })
    .index("by_topic", ["topicId"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 768, // Gemini embedding
      filterFields: ["difficulty", "categoryId", "contentType"],
    }),

  // Blocks - Individual content pieces within topics
  blocks: defineTable({
    topicId: v.id("topics"),
    type: v.union(v.literal("information"), v.literal("activity")), // Block type for categorization
    content: blockContentValidator,
    order: v.number(), // Display order within topic
  })
    .index("by_topic_and_order", ["topicId", "order"])
    .index("by_topic", ["topicId"]),

  // User interactions with topics
  userTopicInteractions: defineTable({
    userId: v.string(), // Better Auth user ID
    topicId: v.id("topics"),
    interactionType: v.union(
      v.literal("view"),
      v.literal("like"),
      v.literal("save"),
      v.literal("share"),
      v.literal("complete")
    ),
    metadata: v.optional(
      v.object({
        timeSpent: v.optional(v.number()), // seconds spent on topic
        completionPercentage: v.optional(v.number()), // 0-100
        shareDestination: v.optional(v.string()), // for shares
        notes: v.optional(v.string()), // user notes
      })
    ),
  })
    .index("by_user_and_topic", ["userId", "topicId"])
    .index("by_user_and_type", ["userId", "interactionType"])
    .index("by_topic_and_type", ["topicId", "interactionType"])
    .index("by_user", ["userId"])
    .index("by_topic", ["topicId"]),

  // Notification types - constant table for notification types
  notificationTypes: defineTable({
    key: v.string(), // unique identifier like "bad_topic", "topic_generated"
    name: v.string(), // display name
    description: v.string(),
    iconUrl: v.optional(v.string()),
    priority: v.number(), // 1 = high, 2 = medium, 3 = low
    defaultTitle: v.optional(v.string()),
    defaultMessage: v.optional(v.string()),
  })
    .index("by_key", ["key"])
    .index("by_priority", ["priority"]),

  // User notifications
  notifications: defineTable({
    userId: v.string(), // Better Auth user ID
    notificationTypeKey: v.id("notificationTypes"), // references notificationTypes._id
    title: v.string(),
    message: v.string(),
    isRead: v.boolean(),
    isArchived: v.boolean(),
    data: v.optional(v.any()),
    expiresAt: v.optional(v.number()), // Optional expiration timestamp
  })
    .index("by_user", ["userId"])
    .index("by_user_and_read", ["userId", "isRead"])
    .index("by_user_and_archived", ["userId", "isArchived"])
    .index("by_notification_type", ["notificationTypeKey"])
    .index("by_expires_at", ["expiresAt"]),
});