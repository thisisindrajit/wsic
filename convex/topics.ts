import { query, mutation, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { Id } from "./_generated/dataModel";

/**
 * Get trending topics for the homepage
 */
export const getTrendingTopics = query({
  args: { 
    limit: v.optional(v.number()),
    categoryId: v.optional(v.id("categories"))
  },
  returns: v.array(v.object({
    _id: v.id("topics"),
    _creationTime: v.number(),
    title: v.string(),
    description: v.string(),
    slug: v.string(),
    categoryId: v.optional(v.id("categories")),
    tagIds: v.array(v.id("tags")),
    difficulty: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
    estimatedReadTime: v.number(),
    viewCount: v.number(),
    likeCount: v.number(),
    shareCount: v.number(),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    
    let query = ctx.db
      .query("topics")
      .withIndex("by_trending", (q) => q.eq("isTrending", true))
      .filter((q) => q.eq(q.field("isPublished"), true));
    
    if (args.categoryId) {
      query = ctx.db
        .query("topics")
        .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
        .filter((q) => q.and(
          q.eq(q.field("isPublished"), true),
          q.eq(q.field("isTrending"), true)
        ));
    }
    
    return await query.order("desc").take(limit);
  },
});

/**
 * Search topics by title and content
 */
export const searchTopics = query({
  args: { 
    searchTerm: v.string(),
    categoryId: v.optional(v.id("categories")),
    difficulty: v.optional(v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))),
    limit: v.optional(v.number())
  },
  returns: v.array(v.object({
    _id: v.id("topics"),
    _creationTime: v.number(),
    title: v.string(),
    description: v.string(),
    slug: v.string(),
    categoryId: v.optional(v.id("categories")),
    tagIds: v.array(v.id("tags")),
    difficulty: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
    estimatedReadTime: v.number(),
    viewCount: v.number(),
    likeCount: v.number(),
    shareCount: v.number(),
  })),
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
      return results.filter(topic => topic.difficulty === args.difficulty);
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
        category: v.optional(v.string()),
        tags: v.array(v.string()),
        difficulty: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
        estimatedReadTime: v.number(),
        isPublished: v.boolean(),
        isTrending: v.boolean(),
        viewCount: v.number(),
        likeCount: v.number(),
        shareCount: v.number(),
        createdBy: v.optional(v.string()),
        lastUpdated: v.number(),
      }),
      blocks: v.array(v.object({
        _id: v.id("blocks"),
        _creationTime: v.number(),
        topicId: v.id("topics"),
        type: v.union(
          v.literal("introduction"),
          v.literal("explanation"),
          v.literal("example"),
          v.literal("analogy"),
          v.literal("application"),
          v.literal("summary")
        ),
        title: v.string(),
        content: v.array(v.union(
          // Text content block
          v.object({
            type: v.literal("text"),
            data: v.object({
              text: v.string(),
              style: v.optional(v.union(
                v.literal("paragraph"),
                v.literal("heading"),
                v.literal("quote"),
                v.literal("callout")
              )),
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
                v.literal("reflection")
              ),
              question: v.string(),
              options: v.optional(v.array(v.object({
                id: v.string(),
                text: v.string(),
                isCorrect: v.optional(v.boolean()),
              }))),
              correctAnswer: v.optional(v.string()),
              explanation: v.optional(v.string()),
              hints: v.optional(v.array(v.string())),
              points: v.optional(v.number()),
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
              url: v.string(),
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
        )),
        order: v.number(),
        isGenerated: v.boolean(),
        sources: v.optional(v.array(v.string())),
        metadata: v.optional(v.object({
          wordCount: v.number(),
          readingLevel: v.string(),
          keyPoints: v.array(v.string()),
          estimatedTime: v.optional(v.number()),
          exerciseCount: v.optional(v.number()),
        })),
      }))
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
    category: v.optional(v.string()),
    difficulty: v.optional(v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")))
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("topics")
      .withIndex("by_published", (q) => q.eq("isPublished", true));
    
    if (args.category) {
      query = ctx.db
        .query("topics")
        .withIndex("by_category", (q) => q.eq("category", args.category))
        .filter((q) => q.eq(q.field("isPublished"), true));
    }
    
    const results = await query.order("desc").paginate(args.paginationOpts);
    
    // Filter by difficulty if specified
    if (args.difficulty) {
      const filteredPage = results.page.filter(topic => topic.difficulty === args.difficulty);
      return {
        ...results,
        page: filteredPage
      };
    }
    
    return results;
  },
});

/**
 * Create a new topic (internal function for content generation)
 */
export const createTopic = internalMutation({
  args: {
    title: v.string(),
    description: v.string(),
    slug: v.string(),
    category: v.optional(v.string()),
    tags: v.array(v.string()),
    difficulty: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
    estimatedReadTime: v.number(),
    createdBy: v.optional(v.string()),
  },
  returns: v.id("topics"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("topics", {
      ...args,
      isPublished: false, // Start as draft
      isTrending: false,
      viewCount: 0,
      likeCount: 0,
      shareCount: 0,
      lastUpdated: Date.now(),
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
 * Publish a topic (make it visible to users)
 */
export const publishTopic = internalMutation({
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