import {
  action,
  internalQuery,
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

type SimilarTopicsType = {
  _id: Id<"topics">;
  title: string;
  slug: string;
  estimatedReadTime: number;
  viewCount: number;
  likeCount: number;
  difficulty: "beginner" | "intermediate" | "advanced";
};

type TopicEmbeddingType = {
  _id: Id<"embeddings">;
  topicId: Id<"topics">;
  embedding: number[];
};

/**
 * Get similar topics using vector search based on embeddings
 */
export const getSimilarTopics = action({
  args: { topicId: v.id("topics") },
  returns: v.array(
    v.object({
      _id: v.id("topics"),
      title: v.string(),
      slug: v.string(),
      estimatedReadTime: v.number(),
      viewCount: v.number(),
      likeCount: v.number(),
      difficulty: v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      ),
    })
  ),
  handler: async (ctx, args): Promise<SimilarTopicsType[]> => {
    // First, get the embedding for the current topic
    const currentTopicEmbedding: TopicEmbeddingType | null = await ctx.runQuery(
      internal.embeddings.getTopicEmbeddingInternal,
      { topicId: args.topicId }
    );

    if (!currentTopicEmbedding) {
      return [];
    }

    // Perform vector search to find similar topics
    const vectorResults: { _id: Id<"embeddings">; _score: number }[] =
      await ctx.vectorSearch("embeddings", "by_embedding", {
        vector: currentTopicEmbedding.embedding,
        limit: 6, // Get 6 to exclude the current topic and return 5
        // filter: (q) => q.eq("contentType", "research_brief"), // Only search brief content
      });

    // Filter out the current topic and get topic IDs
    const similarTopicIds: Id<"embeddings">[] = vectorResults
      .filter((result) => result._id !== currentTopicEmbedding._id)
      .slice(0, 5) // Take only 5 results
      .map((result) => result._id);

    if (similarTopicIds.length === 0) {
      return [];
    }

    // Get the actual topic data for the similar topics
    const similarTopics: SimilarTopicsType[] = await ctx.runQuery(
      internal.embeddings.getTopicsByEmbeddingIdsInternal,
      { embeddingIds: similarTopicIds }
    );

    return similarTopics ?? [];
  },
});

/**
 * Get embedding for a specific topic (public query)
 */
export const getTopicEmbedding = query({
  args: { topicId: v.id("topics") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("embeddings"),
      topicId: v.id("topics"),
      embedding: v.array(v.float64()),
    })
  ),
  handler: async (ctx, args) => {
    const embedding = await ctx.db
      .query("embeddings")
      .withIndex("by_topic", (q) => q.eq("topicId", args.topicId))
      .filter((q) => q.eq(q.field("contentType"), "research_brief"))
      .first();

    return embedding
      ? {
          _id: embedding._id,
          topicId: embedding.topicId,
          embedding: embedding.embedding,
        }
      : null;
  },
});

/**
 * Internal query to get embedding for a specific topic (used by actions)
 */
export const getTopicEmbeddingInternal = internalQuery({
  args: { topicId: v.id("topics") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("embeddings"),
      topicId: v.id("topics"),
      embedding: v.array(v.float64()),
    })
  ),
  handler: async (ctx, args) => {
    const embedding = await ctx.db
      .query("embeddings")
      .withIndex("by_topic", (q) => q.eq("topicId", args.topicId))
      .filter((q) => q.eq(q.field("contentType"), "research_brief"))
      .first();

    return embedding
      ? {
          _id: embedding._id,
          topicId: embedding.topicId,
          embedding: embedding.embedding,
        }
      : null;
  },
});

/**
 * Get topics by their embedding IDs (public query)
 */
export const getTopicsByEmbeddingIds = query({
  args: { embeddingIds: v.array(v.id("embeddings")) },
  returns: v.array(
    v.object({
      _id: v.id("topics"),
      title: v.string(),
      slug: v.string(),
      estimatedReadTime: v.number(),
      viewCount: v.number(),
      likeCount: v.number(),
      difficulty: v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      ),
    })
  ),
  handler: async (ctx, args) => {
    const topics = [];

    for (const embeddingId of args.embeddingIds) {
      // Get the embedding to find the topicId
      const embedding = await ctx.db.get(embeddingId);
      if (!embedding) continue;

      // Get the topic data
      const topic = await ctx.db.get(embedding.topicId);
      if (!topic || !topic.isPublished) continue;

      topics.push({
        _id: topic._id,
        title: topic.title,
        slug: topic.slug,
        estimatedReadTime: topic.estimatedReadTime,
        viewCount: topic.viewCount,
        likeCount: topic.likeCount,
        difficulty: topic.difficulty,
      });
    }

    return topics;
  },
});

/**
 * Internal query to get topics by their embedding IDs (used by actions)
 */
export const getTopicsByEmbeddingIdsInternal = internalQuery({
  args: { embeddingIds: v.array(v.id("embeddings")) },
  returns: v.array(
    v.object({
      _id: v.id("topics"),
      title: v.string(),
      slug: v.string(),
      estimatedReadTime: v.number(),
      viewCount: v.number(),
      likeCount: v.number(),
      difficulty: v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      ),
    })
  ),
  handler: async (ctx, args) => {
    const topics = [];

    for (const embeddingId of args.embeddingIds) {
      // Get the embedding to find the topicId
      const embedding = await ctx.db.get(embeddingId);
      if (!embedding) continue;

      // Get the topic data
      const topic = await ctx.db.get(embedding.topicId);
      if (!topic || !topic.isPublished) continue;

      topics.push({
        _id: topic._id,
        title: topic.title,
        slug: topic.slug,
        estimatedReadTime: topic.estimatedReadTime,
        viewCount: topic.viewCount,
        likeCount: topic.likeCount,
        difficulty: topic.difficulty,
      });
    }

    return topics;
  },
});

/**
 * Create an embedding for a topic (used by the agent)
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
 * Search for similar topics (alias for getSimilarTopics for backward compatibility)
 */
export const searchSimilarTopics = getSimilarTopics;

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

/**
 * Delete a single embedding (used for cleanup when creation fails)
 */
export const deleteEmbedding = mutation({
  args: {
    embeddingId: v.id("embeddings"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.embeddingId);
    return null;
  },
});

/**
 * Get embeddings by topic ID (used for cleanup queries)
 */
export const getEmbeddingsByTopicId = query({
  args: { topicId: v.id("topics") },
  returns: v.array(
    v.object({
      _id: v.id("embeddings"),
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
