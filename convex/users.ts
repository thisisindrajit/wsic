import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

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
    metadata: v.optional(v.object({
      timeSpent: v.optional(v.number()),
      completionPercentage: v.optional(v.number()),
      shareDestination: v.optional(v.string()),
      notes: v.optional(v.string()),
    })),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
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
        return null;
      }
    }
    
    // Create new interaction
    await ctx.db.insert("userTopicInteractions", args);
    
    // Check for first-time rewards
    await ctx.scheduler.runAfter(0, internal.rewards.checkAndAwardFirstTimeRewards, {
      userId: args.userId,
      interactionType: args.interactionType,
      topicId: args.topicId,
    });
    
    return null;
  },
});