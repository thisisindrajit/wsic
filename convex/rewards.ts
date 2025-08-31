import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Get user's rewards
 */
export const getUserRewards = query({
  args: { 
    userId: v.string(),
    limit: v.optional(v.number())
  },
  returns: v.array(v.object({
    _id: v.id("rewards"),
    _creationTime: v.number(),
    userId: v.string(),
    rewardTypeKey: v.string(),
    points: v.number(),
    title: v.string(),
    description: v.string(),
    metadata: v.optional(v.object({
      streakCount: v.optional(v.number()),
      topicId: v.optional(v.id("topics")),
      achievementDate: v.optional(v.number()),
    })),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    
    return await ctx.db
      .query("rewards")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  },
});

/**
 * Get user's total points from rewards
 */
export const getUserTotalPoints = query({
  args: { userId: v.string() },
  returns: v.number(),
  handler: async (ctx, args) => {
    const rewards = await ctx.db
      .query("rewards")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    return rewards.reduce((total, reward) => total + reward.points, 0);
  },
});

/**
 * Award a reward to a user
 */
export const awardReward = internalMutation({
  args: {
    userId: v.string(),
    rewardTypeKey: v.string(),
    points: v.number(),
    title: v.string(),
    description: v.string(),
    metadata: v.optional(v.object({
      streakCount: v.optional(v.number()),
      topicId: v.optional(v.id("topics")),
      achievementDate: v.optional(v.number()),
    })),
  },
  returns: v.id("rewards"),
  handler: async (ctx, args) => {
    // Get reward type to check if it's repeatable
    const rewardType = await ctx.db
      .query("rewardTypes")
      .withIndex("by_key", (q) => q.eq("key", args.rewardTypeKey))
      .unique();
    
    if (!rewardType) {
      throw new Error(`Reward type not found: ${args.rewardTypeKey}`);
    }
    
    // Check if user already has this reward type (prevent duplicates for non-repeatable rewards)
    if (!rewardType.isRepeatable) {
      const existingReward = await ctx.db
        .query("rewards")
        .withIndex("by_user_and_type", (q) => 
          q.eq("userId", args.userId).eq("rewardTypeKey", args.rewardTypeKey)
        )
        .unique();
      
      if (existingReward) {
        throw new Error(`User already has non-repeatable reward: ${args.rewardTypeKey}`);
      }
    }
    
    return await ctx.db.insert("rewards", args);
  },
});



/**
 * Get reward leaderboard (top users by points)
 */
export const getRewardLeaderboard = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(v.object({
    userId: v.string(),
    totalPoints: v.number(),
    rewardCount: v.number(),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    
    // Get all rewards and group by user
    const allRewards = await ctx.db.query("rewards").collect();
    
    const userStats = new Map<string, { totalPoints: number; rewardCount: number }>();
    
    for (const reward of allRewards) {
      const current = userStats.get(reward.userId) || { totalPoints: 0, rewardCount: 0 };
      current.totalPoints += reward.points;
      current.rewardCount += 1;
      userStats.set(reward.userId, current);
    }
    
    // Convert to array and sort by points
    return Array.from(userStats.entries())
      .map(([userId, stats]) => ({
        userId,
        totalPoints: stats.totalPoints,
        rewardCount: stats.rewardCount,
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, limit);
  },
});

/**
 * Check and award first-time rewards (internal function)
 */
export const checkAndAwardFirstTimeRewards = internalMutation({
  args: {
    userId: v.string(),
    interactionType: v.union(
      v.literal("view"),
      v.literal("like"),
      v.literal("save"),
      v.literal("share"),
      v.literal("complete")
    ),
    topicId: v.id("topics"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Map interaction types to reward type keys
    const interactionToRewardMap = {
      like: "first_like",
      share: "first_share",
      save: "first_save",
      complete: "first_topic_complete",
    };
    
    const rewardTypeKey = interactionToRewardMap[args.interactionType as keyof typeof interactionToRewardMap];
    
    if (rewardTypeKey) {
      // Get the reward type configuration
      const rewardType = await ctx.db
        .query("rewardTypes")
        .withIndex("by_key", (q) => q.eq("key", rewardTypeKey))
        .unique();
      
      if (rewardType) {
        // Check if user already has this reward
        const existingReward = await ctx.db
          .query("rewards")
          .withIndex("by_user_and_type", (q) => 
            q.eq("userId", args.userId).eq("rewardTypeKey", rewardTypeKey)
          )
          .unique();
        
        if (!existingReward) {
          // Award the first-time reward
          const rewardId = await ctx.db.insert("rewards", {
            userId: args.userId,
            rewardTypeKey: rewardTypeKey,
            points: rewardType.points,
            title: rewardType.name,
            description: rewardType.description,
            metadata: {
              topicId: args.topicId,
              achievementDate: Date.now(),
            },
          });
          
          // Create a notification for the reward
          await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
            userId: args.userId,
            notificationTypeKey: "reward_earned",
            title: `🎉 ${rewardType.name}`,
            message: `You earned ${rewardType.points} points! ${rewardType.description}`,
            data: {
              rewardId: rewardId,
              topicId: args.topicId,
            },
          });
        }
      }
    }
    
    return null;
  },
});