import {
  action,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { GoogleGenAI } from "@google/genai";

type SimilarTopicsType = {
  _id: Id<"topics">;
  title: string;
  description: string;
  slug: string;
  imageUrl?: string;
  estimatedReadTime: number;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  score?: number;
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
      description: v.string(),
      slug: v.string(),
      imageUrl: v.optional(v.string()),
      estimatedReadTime: v.number(),
      viewCount: v.number(),
      likeCount: v.number(),
      shareCount: v.number(),
      difficulty: v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      ),
      score: v.optional(v.number()),
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

    // Filter out the current topic and keep the scores
    const filteredResults = vectorResults
      .filter((result) => result._id !== currentTopicEmbedding._id)
      .slice(0, 5); // Take only 5 results

    if (filteredResults.length === 0) {
      return [];
    }

    // Get the actual topic data for the similar topics with scores
    const similarTopics: SimilarTopicsType[] = await ctx.runQuery(
      internal.embeddings.getTopicsByEmbeddingIdsInternal,
      {
        embeddingResults: filteredResults.map((r) => ({
          embeddingId: r._id,
          score: r._score,
        })),
      }
    );

    // Filter out any topics without scores and ensure score is defined
    return similarTopics.filter(
      (topic) => topic.score !== undefined
    ) as SimilarTopicsType[];
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
      description: v.string(),
      slug: v.string(),
      imageUrl: v.optional(v.string()),
      estimatedReadTime: v.number(),
      viewCount: v.number(),
      likeCount: v.number(),
      shareCount: v.number(),
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
        description: topic.description,
        slug: topic.slug,
        imageUrl: topic.imageUrl,
        estimatedReadTime: topic.estimatedReadTime,
        viewCount: topic.viewCount,
        likeCount: topic.likeCount,
        shareCount: topic.shareCount,
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
  args: {
    embeddingResults: v.array(
      v.object({
        embeddingId: v.id("embeddings"),
        score: v.optional(v.number()),
      })
    ),
  },
  returns: v.array(
    v.object({
      _id: v.id("topics"),
      title: v.string(),
      description: v.string(),
      slug: v.string(),
      imageUrl: v.optional(v.string()),
      estimatedReadTime: v.number(),
      viewCount: v.number(),
      likeCount: v.number(),
      shareCount: v.number(),
      difficulty: v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      ),
      score: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    const topics = [];

    for (const result of args.embeddingResults) {
      // Get the embedding to find the topicId
      const embedding = await ctx.db.get(result.embeddingId);
      if (!embedding) continue;

      // Get the topic data
      const topic = await ctx.db.get(embedding.topicId);
      if (!topic || !topic.isPublished) continue;

      topics.push({
        _id: topic._id,
        title: topic.title,
        description: topic.description,
        slug: topic.slug,
        imageUrl: topic.imageUrl,
        estimatedReadTime: topic.estimatedReadTime,
        viewCount: topic.viewCount,
        likeCount: topic.likeCount,
        shareCount: topic.shareCount,
        difficulty: topic.difficulty,
        score: result.score, // Optional score from vector search
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
}); /**

 * Search for similar topics using vector search with a search term
 */
export const searchSimilarTopicsByTerm = action({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("topics"),
      title: v.string(),
      description: v.string(),
      slug: v.string(),
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
      score: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    // 1. Generate an embedding for the search term
    const embedding = await generateEmbedding(args.searchTerm);

    if (!embedding) {
      return [];
    }

    // 2. Perform vector search to find similar topics
    const vectorResults: { _id: Id<"embeddings">; _score: number }[] =
      await ctx.vectorSearch("embeddings", "by_embedding", {
        vector: embedding,
      });

    if (vectorResults.length === 0) {
      return [];
    }

    // 3. Get the actual topic data for the similar topics with scores
    const similarTopics: SimilarTopicsType[] = await ctx.runQuery(
      internal.embeddings.getTopicsByEmbeddingIdsInternal,
      {
        embeddingResults: vectorResults.map((r) => ({
          embeddingId: r._id,
          score: r._score,
        })),
      }
    );

    // 4. Filter out any topics without scores and return top results
    return similarTopics
      .filter((topic) => topic.score !== undefined)
      .slice(0, limit) as Array<{
      _id: Id<"topics">;
      title: string;
      description: string;
      slug: string;
      imageUrl?: string;
      difficulty: "beginner" | "intermediate" | "advanced";
      estimatedReadTime: number;
      viewCount: number;
      likeCount: number;
      shareCount: number;
      score: number;
    }>;
  },
});

/**
 * Generate embedding for a search term using Google Embeddings
 */
async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GOOGLE_API_KEY
    });

    const response = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: text,
      config: {
        taskType: "SEMANTIC_SIMILARITY",
        outputDimensionality: 768,
      },
    });

    const values = response.embeddings?.values();

    return values?.next().value?.values ?? null;
  } catch (error) {
    console.error("Failed to generate embedding:", error);
    return null;
  }
}
