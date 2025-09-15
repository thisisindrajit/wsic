import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Simple search function - searches topics by title, description, and tags
 */
export const simpleSearchTopics = query({
  args: {
    searchTerm: v.string(),
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

    // Use the search index for full-text search
    let query = ctx.db
      .query("topics")
      .withSearchIndex("search_topics", (q) =>
        q.search("title", args.searchTerm).eq("isPublished", true)
      );

    // Apply difficulty filter if specified
    if (args.difficulty) {
      query = query.filter((q) => q.eq(q.field("difficulty"), args.difficulty));
    }

    // Get results with limit
    const searchResults = await query.take(limit);

    // Return only the fields specified in the validator
    return searchResults.map((topic) => ({
      _id: topic._id,
      _creationTime: topic._creationTime,
      title: topic.title,
      description: topic.description,
      slug: topic.slug,
      categoryId: topic.categoryId,
      tagIds: topic.tagIds,
      imageUrl: topic.imageUrl,
      difficulty: topic.difficulty,
      estimatedReadTime: topic.estimatedReadTime,
      viewCount: topic.viewCount,
      likeCount: topic.likeCount,
      shareCount: topic.shareCount,
    }));
  },
});
