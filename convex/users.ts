import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { paginationOptsValidator } from "convex/server";

/**
 * Record user interaction with a topic
 */
export const recordInteraction = mutation({
  args: {
    userId: v.string(),
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
        timeSpent: v.optional(v.number()),
        completionPercentage: v.optional(v.number()),
        shareDestination: v.optional(v.string()),
        notes: v.optional(v.string()),
      })
    ),
  },
  returns: v.object({
    action: v.string(),
    newCount: v.number(),
  }),
  handler: async (ctx, args) => {
    // For views, check if this user has already viewed this topic recently (within 24 hours)
    if (args.interactionType === "view") {
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const recentView = await ctx.db
        .query("userTopicInteractions")
        .withIndex("by_user_and_topic", (q) =>
          q.eq("userId", args.userId).eq("topicId", args.topicId)
        )
        .filter((q) =>
          q.and(
            q.eq(q.field("interactionType"), "view"),
            q.gte(q.field("_creationTime"), oneDayAgo)
          )
        )
        .first();

      if (!recentView) {
        // Record the view and increment the count
        await ctx.db.insert("userTopicInteractions", args);
        await ctx.runMutation(internal.topics.updateTopicMetrics, {
          topicId: args.topicId,
          metric: "view",
          increment: 1,
        });
      }

      const topic = await ctx.db.get(args.topicId);
      return { action: "added", newCount: topic?.viewCount || 0 };
    }

    // Check if interaction already exists for like/save (toggle behavior)
    if (args.interactionType === "like" || args.interactionType === "save") {
      const existing = await ctx.db
        .query("userTopicInteractions")
        .withIndex("by_user_and_topic", (q) =>
          q.eq("userId", args.userId).eq("topicId", args.topicId)
        )
        .filter((q) => q.eq(q.field("interactionType"), args.interactionType))
        .unique();

      if (existing) {
        // Remove the interaction (unlike/unsave)
        await ctx.db.delete(existing._id);

        // Update topic metrics
        if (args.interactionType === "like") {
          await ctx.runMutation(internal.topics.updateTopicMetrics, {
            topicId: args.topicId,
            metric: "like",
            increment: -1,
          });
        }

        // Get updated count
        const topic = await ctx.db.get(args.topicId);
        const newCount =
          args.interactionType === "like" ? topic?.likeCount || 0 : 0;

        return { action: "removed", newCount };
      }
    }

    // Create new interaction
    await ctx.db.insert("userTopicInteractions", args);

    // Update topic metrics for likes and shares
    if (args.interactionType === "like") {
      await ctx.runMutation(internal.topics.updateTopicMetrics, {
        topicId: args.topicId,
        metric: "like",
        increment: 1,
      });
    } else if (args.interactionType === "share") {
      await ctx.runMutation(internal.topics.updateTopicMetrics, {
        topicId: args.topicId,
        metric: "share",
        increment: 1,
      });
    }

    // Get updated count
    const topic = await ctx.db.get(args.topicId);
    const newCount =
      args.interactionType === "like"
        ? topic?.likeCount || 0
        : args.interactionType === "share"
          ? topic?.shareCount || 0
          : 0;

    return { action: "added", newCount };
  },
});

/**
 * Get user interactions for a specific topic
 */
export const getUserTopicInteractions = query({
  args: {
    userId: v.string(),
    topicId: v.id("topics"),
  },
  returns: v.object({
    hasLiked: v.boolean(),
    hasSaved: v.boolean(),
    hasViewed: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const interactions = await ctx.db
      .query("userTopicInteractions")
      .withIndex("by_user_and_topic", (q) =>
        q.eq("userId", args.userId).eq("topicId", args.topicId)
      )
      .collect();

    const hasLiked = interactions.some((i) => i.interactionType === "like");
    const hasSaved = interactions.some((i) => i.interactionType === "save");
    const hasViewed = interactions.some((i) => i.interactionType === "view");

    return { hasLiked, hasSaved, hasViewed };
  },
});

/**
 * Get user's saved topics with pagination
 */
export const getSavedTopics = query({
  args: {
    userId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const savedInteractions = await ctx.db
      .query("userTopicInteractions")
      .withIndex("by_user_and_type", (q) =>
        q.eq("userId", args.userId).eq("interactionType", "save")
      )
      .order("desc")
      .paginate(args.paginationOpts);

    const topics = [];
    for (const interaction of savedInteractions.page) {
      const topic = await ctx.db.get(interaction.topicId);
      if (topic && topic.isPublished) {
        topics.push({
          ...topic,
          savedAt: interaction._creationTime,
        });
      }
    }

    return {
      page: topics,
      isDone: savedInteractions.isDone,
      continueCursor: savedInteractions.continueCursor,
    };
  },
});

/**
 * Get user's requested/created topics with pagination
 */
export const getUserTopics = query({
  args: {
    userId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const userTopics = await ctx.db
      .query("topics")
      .withIndex("by_created_by", (q) => q.eq("createdBy", args.userId))
      .order("desc")
      .paginate(args.paginationOpts);

    return userTopics;
  },
});
