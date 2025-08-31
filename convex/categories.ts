import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all categories
 */
export const getCategories = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("categories"),
    _creationTime: v.number(),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("categories")
      .order("asc")
      .collect();
  },
});

/**
 * Get category by slug
 */
export const getCategoryBySlug = query({
  args: { slug: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("categories"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      description: v.optional(v.string()),
      color: v.optional(v.string()),
      icon: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

/**
 * Create a new category
 */
export const createCategory = internalMutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  returns: v.id("categories"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("categories", args);
  },
});