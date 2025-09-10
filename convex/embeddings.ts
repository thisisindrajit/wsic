import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create an embedding for a topic
 */
export const createEmbedding = mutation({
  args: {
    topicId: v.id("topics"),
    embedding: v.array(v.float64()),
    contentType: v.union(
      v.literal("research_brief"),
      v.literal("research_deep"),
      v.literal("combined_content")
    ),
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
    categoryId: v.optional(v.id("categories")),
  },
  returns: v.id("embeddings"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("embeddings", args);
  },
});

/**
 * Get embeddings for a specific topic
 */
export const getEmbeddingsByTopic = query({
  args: { topicId: v.id("topics") },
  returns: v.array(
    v.object({
      _id: v.id("embeddings"),
      _creationTime: v.number(),
      topicId: v.id("topics"),
      embedding: v.array(v.float64()),
      contentType: v.union(
        v.literal("research_brief"),
        v.literal("research_deep"),
        v.literal("combined_content")
      ),
      difficulty: v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      ),
      categoryId: v.optional(v.id("categories")),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("embeddings")
      .withIndex("by_topic", (q) => q.eq("topicId", args.topicId))
      .collect();
  },
});

/**
 * Search for similar topics using vector search
 * This is an action because vector search is only available in actions
 */
export const searchSimilarTopics = action({
  args: {
    queryEmbedding: v.array(v.float64()),
    limit: v.optional(v.number()),
    difficulty: v.optional(
      v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      )
    ),
    categoryId: v.optional(v.id("categories")),
    contentType: v.optional(
      v.union(
        v.literal("research_brief"),
        v.literal("research_deep"),
        v.literal("combined_content")
      )
    ),
  },
  returns: v.array(
    v.object({
      _id: v.id("embeddings"),
      _score: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    // Build filter function
    const filterFn = (q: any) => {
      let filter = q;

      if (args.difficulty) {
        filter = filter.eq("difficulty", args.difficulty);
      }

      if (args.categoryId) {
        filter = filter.eq("categoryId", args.categoryId);
      }

      if (args.contentType) {
        filter = filter.eq("contentType", args.contentType);
      }

      return filter;
    };

    // Perform vector search
    const results = await ctx.vectorSearch("embeddings", "by_embedding", {
      vector: args.queryEmbedding,
      limit,
      filter: filterFn,
    });

    return results;
  },
});

/**
 * Delete embeddings for a specific topic
 */
export const deleteEmbeddingsByTopic = mutation({
  args: { topicId: v.id("topics") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const embeddings = await ctx.db
      .query("embeddings")
      .withIndex("by_topic", (q) => q.eq("topicId", args.topicId))
      .collect();

    for (const embedding of embeddings) {
      await ctx.db.delete(embedding._id);
    }

    return null;
  },
});
