import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all tags
 */
export const getTags = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("tags"),
    _creationTime: v.number(),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tags")
      .order("asc")
      .collect();
  },
});

/**
 * Get tag by slug
 */
export const getTagBySlug = query({
  args: { slug: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("tags"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      description: v.optional(v.string()),
      color: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tags")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

/**
 * Get tags by IDs
 */
export const getTagsByIds = query({
  args: { tagIds: v.array(v.id("tags")) },
  returns: v.array(v.object({
    _id: v.id("tags"),
    _creationTime: v.number(),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    const tags = [];
    for (const tagId of args.tagIds) {
      const tag = await ctx.db.get(tagId);
      if (tag) {
        tags.push(tag);
      }
    }
    return tags;
  },
});

/**
 * Create a new tag
 */
export const createTag = internalMutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  returns: v.id("tags"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("tags", args);
  },
});