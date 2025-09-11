import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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
