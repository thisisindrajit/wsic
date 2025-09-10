import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Initialize reward types
export const initializeRewardTypes = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const rewardTypes = [
      {
        key: "first_topic_view",
        name: "First Topic View",
        description: "Viewed your first topic",
        points: 10,
        category: "milestone",
        isRepeatable: false,
      },
      {
        key: "first_like",
        name: "First Like",
        description: "Liked your first topic",
        points: 5,
        category: "engagement",
        isRepeatable: false,
      },
      {
        key: "first_save",
        name: "First Save",
        description: "Saved your first topic",
        points: 5,
        category: "engagement",
        isRepeatable: false,
      },
      {
        key: "topic_completion",
        name: "Topic Completion",
        description: "Completed a topic",
        points: 25,
        category: "achievement",
        isRepeatable: true,
      },
      {
        key: "exercise_completion",
        name: "Exercise Completion",
        description: "Completed an exercise",
        points: 15,
        category: "achievement",
        isRepeatable: true,
      },
      {
        key: "streak_3_days",
        name: "3-Day Streak",
        description: "Maintained a 3-day learning streak",
        points: 50,
        category: "streak",
        isRepeatable: true,
      },
      {
        key: "streak_7_days",
        name: "7-Day Streak",
        description: "Maintained a 7-day learning streak",
        points: 100,
        category: "streak",
        isRepeatable: true,
      },
      {
        key: "streak_30_days",
        name: "30-Day Streak",
        description: "Maintained a 30-day learning streak",
        points: 500,
        category: "streak",
        isRepeatable: true,
      },
      {
        key: "category_explorer",
        name: "Category Explorer",
        description: "Explored topics from 5+ categories",
        points: 75,
        category: "exploration",
        isRepeatable: false,
      },
      {
        key: "knowledge_seeker",
        name: "Knowledge Seeker",
        description: "Completed 10+ topics",
        points: 200,
        category: "milestone",
        isRepeatable: false,
      },
      {
        key: "exercise_master",
        name: "Exercise Master",
        description: "Completed 50+ exercises",
        points: 300,
        category: "milestone",
        isRepeatable: false,
      },
    ];

    for (const rewardType of rewardTypes) {
      const existing = await ctx.db
        .query("rewardTypes")
        .withIndex("by_key", (q) => q.eq("key", rewardType.key))
        .unique();

      if (!existing) {
        await ctx.db.insert("rewardTypes", rewardType);
      }
    }

    return null;
  },
});



// Initialize notification types
export const initializeNotificationTypes = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const notificationTypes = [
      {
        key: "reward_earned",
        name: "Reward Earned",
        description: "User earned a new reward",
        priority: 2,
        defaultTitle: "Reward Earned!",
        defaultMessage:
          "You've earned a new reward for your learning progress!",
      },
      {
        key: "streak_milestone",
        name: "Streak Milestone",
        description: "User reached a streak milestone",
        priority: 1,
        defaultTitle: "Streak Milestone!",
        defaultMessage: "Congratulations on maintaining your learning streak!",
      },
      {
        key: "topic_recommendation",
        name: "Topic Recommendation",
        description: "New topic recommended for user",
        priority: 3,
        defaultTitle: "New Topic Recommendation",
        defaultMessage: "We found a topic you might be interested in!",
      },
      {
        key: "achievement_unlocked",
        name: "Achievement Unlocked",
        description: "User unlocked a new achievement",
        priority: 1,
        defaultTitle: "Achievement Unlocked!",
        defaultMessage: "You've unlocked a new achievement!",
      },
      {
        key: "daily_reminder",
        name: "Daily Reminder",
        description: "Daily learning reminder",
        priority: 3,
        defaultTitle: "Keep Learning!",
        defaultMessage: "Don't forget to continue your learning journey today!",
      },
      {
        key: "topic_completed",
        name: "Topic Completed",
        description: "User completed a topic",
        priority: 2,
        defaultTitle: "Topic Completed!",
        defaultMessage: "Great job completing this topic!",
      },
    ];

    for (const notificationType of notificationTypes) {
      const existing = await ctx.db
        .query("notificationTypes")
        .withIndex("by_key", (q) => q.eq("key", notificationType.key))
        .unique();

      if (!existing) {
        await ctx.db.insert("notificationTypes", notificationType);
      }
    }

    return null;
  },
});

// Query functions for constant tables
export const getRewardTypes = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("rewardTypes"),
      key: v.string(),
      name: v.string(),
      description: v.string(),
      points: v.number(),
      iconUrl: v.optional(v.string()),
      category: v.optional(v.string()),
      isRepeatable: v.boolean(),
    })
  ),
  handler: async (ctx) => {
    return await ctx.db.query("rewardTypes").collect();
  },
});



export const getNotificationTypes = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("notificationTypes"),
      key: v.string(),
      name: v.string(),
      description: v.string(),
      iconUrl: v.optional(v.string()),
      priority: v.number(),
      defaultTitle: v.optional(v.string()),
      defaultMessage: v.optional(v.string()),
    })
  ),
  handler: async (ctx) => {
    return await ctx.db.query("notificationTypes").collect();
  },
});

// Get specific constant by key
export const getRewardTypeByKey = query({
  args: { key: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("rewardTypes"),
      key: v.string(),
      name: v.string(),
      description: v.string(),
      points: v.number(),
      iconUrl: v.optional(v.string()),
      category: v.optional(v.string()),
      isRepeatable: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("rewardTypes")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
  },
});



export const getNotificationTypeByKey = query({
  args: { key: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("notificationTypes"),
      key: v.string(),
      name: v.string(),
      description: v.string(),
      iconUrl: v.optional(v.string()),
      priority: v.number(),
      defaultTitle: v.optional(v.string()),
      defaultMessage: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notificationTypes")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
  },
});
