import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { blockContentValidator } from "./schema";
import { internal } from "./_generated/api";

/**
 * Get trending topics for the homepage
 * Uses a dynamic algorithm based on engagement metrics
 */
export const getTrendingTopics = query({
  args: {
    limit: v.optional(v.number()),
    categoryId: v.optional(v.id("categories")),
  },
  returns: v.array(
    v.object({
      _id: v.id("topics"),
      _creationTime: v.number(),
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
      trendingScore: v.number(), // Calculated field
    })
  ),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    // Get all published topics
    let baseQuery = ctx.db
      .query("topics")
      .withIndex("by_published", (q) => q.eq("isPublished", true));

    if (args.categoryId) {
      baseQuery = ctx.db
        .query("topics")
        .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId!))
        .filter((q) => q.eq(q.field("isPublished"), true));
    }

    const topics = await baseQuery.collect();

    // Calculate trending score for each topic
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const topicsWithScores = topics.map((topic) => {
      // Age factor (newer topics get a boost)
      const ageInDays = (now - topic._creationTime) / (24 * 60 * 60 * 1000);
      const ageFactor = Math.max(0.1, 1 - ageInDays / 30); // Decay over 30 days

      // Calculate trending score based on total engagement
      // Simplified formula for better performance
      const totalEngagement =
        topic.viewCount * 1 + topic.likeCount * 5 + topic.shareCount * 10;
      const trendingScore = totalEngagement * ageFactor;

      return {
        ...topic,
        trendingScore,
      };
    });

    // Sort by trending score and return top results
    return topicsWithScores
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit);
  },
});

/**
 * Search topics by title and content
 */
export const searchTopics = query({
  args: {
    searchTerm: v.string(),
    categoryId: v.optional(v.id("categories")),
    difficulty: v.optional(
      v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      )
    ),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("topics"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.string(),
      slug: v.string(),
      categoryId: v.optional(v.id("categories")),
      tagIds: v.array(v.string()),
      imageUrl: v.optional(v.string()),
      difficulty: v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      ),
      estimatedReadTime: v.number(),
      viewCount: v.number(),
      likeCount: v.number(),
      shareCount: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    let searchQuery = ctx.db
      .query("topics")
      .withSearchIndex("search_topics", (q) => {
        let search = q.search("title", args.searchTerm).eq("isPublished", true);

        if (args.categoryId) {
          search = search.eq("categoryId", args.categoryId);
        }

        return search;
      });

    const results = await searchQuery.take(limit);

    // Filter by difficulty if specified
    if (args.difficulty) {
      return results.filter((topic) => topic.difficulty === args.difficulty);
    }

    return results;
  },
});

/**
 * Get a single topic by slug with its blocks
 */
export const getTopicBySlug = query({
  args: { slug: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      topic: v.object({
        _id: v.id("topics"),
        _creationTime: v.number(),
        title: v.string(),
        description: v.string(),
        slug: v.string(),
        categoryId: v.optional(v.id("categories")),
        tagIds: v.array(v.string()),
        imageUrl: v.optional(v.string()),
        difficulty: v.union(
          v.literal("beginner"),
          v.literal("intermediate"),
          v.literal("advanced")
        ),
        estimatedReadTime: v.number(),
        isPublished: v.boolean(),
        isTrending: v.boolean(),
        viewCount: v.number(),
        likeCount: v.number(),
        shareCount: v.number(),
        createdBy: v.optional(v.string()),
        lastUpdated: v.number(),
        isAIGenerated: v.boolean(),
        generationPrompt: v.optional(v.string()),
        sources: v.optional(v.array(v.string())),
        metadata: v.optional(
          v.object({
            wordCount: v.number(),
            readingLevel: v.any(),
            estimatedTime: v.optional(v.number()),
            exerciseCount: v.optional(v.number()),
          })
        ),
      }),
      blocks: v.array(
        v.object({
          _id: v.id("blocks"),
          _creationTime: v.number(),
          topicId: v.id("topics"),
          type: v.union(v.literal("information"), v.literal("activity")),
          content: blockContentValidator,
          order: v.number(),
        })
      ),
    })
  ),
  handler: async (ctx, args) => {
    const topic = await ctx.db
      .query("topics")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .filter((q) => q.eq(q.field("isPublished"), true))
      .unique();

    if (!topic) {
      return null;
    }

    const blocks = await ctx.db
      .query("blocks")
      .withIndex("by_topic_and_order", (q) => q.eq("topicId", topic._id))
      .order("asc")
      .collect();

    return { topic, blocks };
  },
});

/**
 * Get paginated topics for browsing
 */
export const getTopics = query({
  args: {
    paginationOpts: paginationOptsValidator,
    categoryId: v.optional(v.id("categories")),
    difficulty: v.optional(
      v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      )
    ),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("topics")
      .withIndex("by_published", (q) => q.eq("isPublished", true));

    if (args.categoryId) {
      query = ctx.db
        .query("topics")
        .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId!))
        .filter((q) => q.eq(q.field("isPublished"), true));
    }

    const results = await query.order("desc").paginate(args.paginationOpts);

    // Filter by difficulty if specified
    if (args.difficulty) {
      const filteredPage = results.page.filter(
        (topic) => topic.difficulty === args.difficulty
      );
      return {
        ...results,
        page: filteredPage,
      };
    }

    return results;
  },
});

/**
 * Create a new topic (public function for content generation)
 */
export const createTopic = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    slug: v.string(),
    categoryId: v.optional(v.id("categories")),
    tagIds: v.array(v.string()),
    imageUrl: v.optional(v.string()),
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
    estimatedReadTime: v.number(),
    createdBy: v.optional(v.string()),
    isAIGenerated: v.optional(v.boolean()),
    generationPrompt: v.optional(v.string()),
    sources: v.optional(v.array(v.string())),
    metadata: v.optional(
      v.object({
        wordCount: v.number(),
        readingLevel: v.any(),
        estimatedTime: v.optional(v.number()),
        exerciseCount: v.optional(v.number()),
      })
    ),
  },
  returns: v.id("topics"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("topics", {
      ...args,
      isPublished: true,
      isTrending: false,
      viewCount: 0,
      likeCount: 0,
      shareCount: 0,
      lastUpdated: Date.now(),
      isAIGenerated: args.isAIGenerated ?? false,
    });
  },
});

/**
 * Update topic metrics (views, likes, shares)
 */
export const updateTopicMetrics = internalMutation({
  args: {
    topicId: v.id("topics"),
    metric: v.union(v.literal("view"), v.literal("like"), v.literal("share")),
    increment: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const topic = await ctx.db.get(args.topicId);
    if (!topic) {
      throw new Error("Topic not found");
    }

    const updates: Partial<typeof topic> = {};

    switch (args.metric) {
      case "view":
        updates.viewCount = topic.viewCount + args.increment;
        break;
      case "like":
        updates.likeCount = topic.likeCount + args.increment;
        break;
      case "share":
        updates.shareCount = topic.shareCount + args.increment;
        break;
    }

    await ctx.db.patch(args.topicId, updates);
    return null;
  },
});

/**
 * Get a single topic by ID with its blocks
 */
export const getTopicById = query({
  args: { topicId: v.id("topics") },
  returns: v.union(
    v.null(),
    v.object({
      topic: v.object({
        _id: v.id("topics"),
        _creationTime: v.number(),
        title: v.string(),
        description: v.string(),
        slug: v.string(),
        categoryId: v.optional(v.id("categories")),
        tagIds: v.array(v.string()),
        imageUrl: v.optional(v.string()),
        difficulty: v.union(
          v.literal("beginner"),
          v.literal("intermediate"),
          v.literal("advanced")
        ),
        estimatedReadTime: v.number(),
        isPublished: v.boolean(),
        isTrending: v.boolean(),
        viewCount: v.number(),
        likeCount: v.number(),
        shareCount: v.number(),
        createdBy: v.optional(v.string()),
        lastUpdated: v.number(),
        isAIGenerated: v.boolean(),
        generationPrompt: v.optional(v.string()),
        sources: v.optional(v.array(v.string())),
        metadata: v.optional(
          v.object({
            wordCount: v.number(),
            readingLevel: v.any(),
            estimatedTime: v.optional(v.number()),
            exerciseCount: v.optional(v.number()),
          })
        ),
      }),
      blocks: v.array(
        v.object({
          _id: v.id("blocks"),
          _creationTime: v.number(),
          topicId: v.id("topics"),
          type: v.union(v.literal("information"), v.literal("activity")),
          content: blockContentValidator,
          order: v.number(),
        })
      ),
      category: v.union(
        v.null(),
        v.object({
          _id: v.id("categories"),
          _creationTime: v.number(),
          name: v.string(),
          slug: v.string(),
          description: v.optional(v.string()),
          lightHex: v.optional(v.string()),
          darkHex: v.optional(v.string()),
          icon: v.optional(v.string()),
        })
      ),
    })
  ),
  handler: async (ctx, args) => {
    const topic = await ctx.db.get(args.topicId);

    if (!topic || !topic.isPublished) {
      return null;
    }

    const blocks = await ctx.db
      .query("blocks")
      .withIndex("by_topic_and_order", (q) => q.eq("topicId", topic._id))
      .order("asc")
      .collect();

    let category = null;

    if (topic.categoryId) {
      category = await ctx.db.get(topic.categoryId);
    }

    return { topic, blocks, category };
  },
});

/**
 * Publish a topic (make it visible to users)
 */
export const publishTopic = mutation({
  args: {
    topicId: v.id("topics"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.topicId, {
      isPublished: true,
      lastUpdated: Date.now(),
    });
    return null;
  },
});

/**
 * Delete a topic (used for cleanup when creation fails)
 */
export const deleteTopic = mutation({
  args: {
    topicId: v.id("topics"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.topicId);
    return null;
  },
});

/**
 * Update trending status for all topics based on engagement metrics
 * This should be called periodically (e.g., every hour)
 */
export const updateTrendingStatus = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get all published topics
    const topics = await ctx.db
      .query("topics")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .collect();

    // Calculate trending scores
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const topicsWithScores = await Promise.all(
      topics.map(async (topic) => {
        // Get recent interactions (last 24 hours)
        const recentInteractions = await ctx.db
          .query("userTopicInteractions")
          .withIndex("by_topic", (q) => q.eq("topicId", topic._id))
          .filter((q) => q.gte(q.field("_creationTime"), oneDayAgo))
          .collect();

        // Count different types of recent interactions
        const recentViews = recentInteractions.filter(
          (i) => i.interactionType === "view"
        ).length;
        const recentLikes = recentInteractions.filter(
          (i) => i.interactionType === "like"
        ).length;
        const recentShares = recentInteractions.filter(
          (i) => i.interactionType === "share"
        ).length;

        // Age factor (newer topics get a boost)
        const ageInDays = (now - topic._creationTime) / (24 * 60 * 60 * 1000);
        const ageFactor = Math.max(0.1, 1 - ageInDays / 30); // Decay over 30 days

        // Calculate trending score
        const recentEngagement =
          recentViews * 1 + recentLikes * 5 + recentShares * 10;
        const totalEngagement =
          topic.viewCount * 0.5 + topic.likeCount * 2 + topic.shareCount * 5;

        const trendingScore =
          (recentEngagement * 10 + totalEngagement * 2) * ageFactor;

        return {
          topicId: topic._id,
          trendingScore,
        };
      })
    );

    // Sort by trending score
    const sortedTopics = topicsWithScores.sort(
      (a, b) => b.trendingScore - a.trendingScore
    );

    // Mark top 20% as trending (minimum 1, maximum 50)
    const trendingCount = Math.max(
      1,
      Math.min(50, Math.ceil(sortedTopics.length * 0.2))
    );
    const trendingThreshold =
      sortedTopics[trendingCount - 1]?.trendingScore || 0;

    // Update all topics
    for (const topic of sortedTopics) {
      const shouldBeTrending =
        topic.trendingScore >= trendingThreshold && topic.trendingScore > 0;

      await ctx.db.patch(topic.topicId, {
        isTrending: shouldBeTrending,
      });
    }

    return null;
  },
});

/**
 * Manually trigger trending status update (for testing/admin use)
 */
export const triggerTrendingUpdate = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.topics.updateTrendingStatus, {});
    return null;
  },
});
