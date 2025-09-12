import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

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
    // Moved from blocks table
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
    embedding: v.array(v.float64()), // Vector embedding (typically 1536 dimensions for OpenAI)
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
      dimensions: 1536, // OpenAI text-embedding-3-small or Gemini embedding dimensions
      filterFields: ["difficulty", "categoryId", "contentType"],
    }),

  // Blocks - Individual content pieces within topics
  blocks: defineTable({
    topicId: v.id("topics"),
    type: v.union(v.literal("information"), v.literal("activity")), // Block type for categorization
    content: v.union(
      // Text content block
      v.object({
        type: v.literal("text"),
        data: v.object({
          content: v.object({
            // JSON-based content for custom formatters
            text: v.string(),
            formatting: v.optional(v.any()), // Custom formatting data as JSON
          }),
          styleKey: v.optional(v.string()), // Style identifier for content formatting
        }),
      }),
      // Interactive exercise block
      v.object({
        type: v.literal("exercise"),
        data: v.object({
          exerciseType: v.union(
            v.literal("multiple_choice"),
            v.literal("fill_in_blank"),
            v.literal("drag_drop"),
            v.literal("true_false"),
            v.literal("short_answer"),
            v.literal("reflection"),
            v.literal("quiz_group"),
            v.literal("reorder_group"),
            v.literal("final_quiz_group")
          ),
          question: v.optional(v.string()),
          options: v.optional(
            v.array(
              v.object({
                id: v.string(),
                text: v.string(),
              })
            )
          ),
          correctAnswer: v.optional(v.string()), // Only store correct answer
          explanation: v.optional(v.string()),
          hints: v.optional(v.array(v.string())),
          points: v.optional(v.number()),
          // Additional fields for grouped exercises
          quizData: v.optional(v.any()),
          reorderData: v.optional(v.any()),
          finalQuizData: v.optional(v.any()),
        }),
      }),
      // Media content block
      v.object({
        type: v.literal("media"),
        data: v.object({
          mediaType: v.union(
            v.literal("image"),
            v.literal("video"),
            v.literal("audio"),
            v.literal("diagram")
          ),
          url: v.optional(v.string()),
          diagramCode: v.optional(v.string()), // Mermaid diagram code
          caption: v.optional(v.string()),
          altText: v.optional(v.string()),
          thumbnail: v.optional(v.string()),
        }),
      }),
      // Code snippet block
      v.object({
        type: v.literal("code"),
        data: v.object({
          code: v.string(),
          language: v.optional(v.string()),
          title: v.optional(v.string()),
          explanation: v.optional(v.string()),
          runnable: v.optional(v.boolean()),
        }),
      })
    ),
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

  // Trending and recommendation data
  trendingTopics: defineTable({
    topicId: v.id("topics"),
    score: v.number(), // Trending score based on views, likes, shares
    period: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly")
    ),
    calculatedAt: v.number(),
    metrics: v.object({
      viewsInPeriod: v.number(),
      likesInPeriod: v.number(),
      sharesInPeriod: v.number(),
      completionsInPeriod: v.number(),
    }),
  })
    .index("by_period_and_score", ["period", "score"])
    .index("by_topic", ["topicId"])
    .index("by_calculated_at", ["calculatedAt"]),

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