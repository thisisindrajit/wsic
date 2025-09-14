import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { blockContentValidator } from "./schema";

/**
 * Get blocks for a specific topic
 */
export const getBlocksByTopic = query({
  args: { topicId: v.id("topics") },
  returns: v.array(
    v.object({
      _id: v.id("blocks"),
      _creationTime: v.number(),
      topicId: v.id("topics"),
      type: v.union(v.literal("information"), v.literal("activity")),
      content: blockContentValidator,
      order: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("blocks")
      .withIndex("by_topic_and_order", (q) => q.eq("topicId", args.topicId))
      .order("asc")
      .collect();
  },
});

/**
 * Create a new block for a topic
 */
export const createBlock = mutation({
  args: v.object({
    topicId: v.id("topics"),
    type: v.union(v.literal("information"), v.literal("activity")),
    content: blockContentValidator,
    order: v.number(),
  }),
  returns: v.id("blocks"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("blocks", args);
  },
});

/**
 * Delete a block (used for cleanup when creation fails)
 */
export const deleteBlock = mutation({
  args: {
    blockId: v.id("blocks"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.blockId);
    return null;
  },
});

/**
 * Get blocks by topic ID (used for cleanup queries)
 */
export const getBlocksByTopicId = query({
  args: { topicId: v.id("topics") },
  returns: v.array(
    v.object({
      _id: v.id("blocks"),
      _creationTime: v.number(),
      topicId: v.id("topics"),
      type: v.union(v.literal("information"), v.literal("activity")),
      content: blockContentValidator,
      order: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("blocks")
      .withIndex("by_topic_and_order", (q) => q.eq("topicId", args.topicId))
      .collect();
  },
});
