import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Create a new notification for a user (internal function)
export const createNotification = internalMutation({
  args: {
    userId: v.string(),
    notificationTypeKey: v.string(),
    title: v.string(),
    message: v.string(),
    data: v.optional(
      v.object({
        rewardId: v.optional(v.id("rewards")),
        topicId: v.optional(v.id("topics")),
        actionUrl: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        metadata: v.optional(v.any()),
      })
    ),
    expiresAt: v.optional(v.number()),
  },
  returns: v.id("notifications"),
  handler: async (ctx, args) => {
    // Verify notification type exists
    const notificationType = await ctx.db
      .query("notificationTypes")
      .withIndex("by_key", (q) => q.eq("key", args.notificationTypeKey))
      .unique();

    if (!notificationType) {
      throw new Error(
        `Notification type '${args.notificationTypeKey}' not found`
      );
    }

    return await ctx.db.insert("notifications", {
      userId: args.userId,
      notificationTypeKey: args.notificationTypeKey,
      title: args.title,
      message: args.message,
      isRead: false,
      isArchived: false,
      data: args.data,
      expiresAt: args.expiresAt,
    });
  },
});

// Get notifications for a user
export const getUserNotifications = query({
  args: {
    userId: v.string(),
    includeRead: v.optional(v.boolean()),
    includeArchived: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("notifications"),
      _creationTime: v.number(),
      userId: v.string(),
      notificationTypeKey: v.string(),
      title: v.string(),
      message: v.string(),
      isRead: v.boolean(),
      isArchived: v.boolean(),
      data: v.optional(
        v.object({
          rewardId: v.optional(v.id("rewards")),
          topicId: v.optional(v.id("topics")),
          actionUrl: v.optional(v.string()),
          imageUrl: v.optional(v.string()),
          metadata: v.optional(v.any()),
        })
      ),
      expiresAt: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    const {
      userId,
      includeRead = true,
      includeArchived = false,
      limit = 50,
    } = args;

    let query = ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId));

    const notifications = await query.collect();

    // Filter based on read/archived status
    const filtered = notifications.filter((notification) => {
      if (!includeRead && notification.isRead) return false;
      if (!includeArchived && notification.isArchived) return false;

      // Check if notification has expired
      if (notification.expiresAt && notification.expiresAt < Date.now()) {
        return false;
      }

      return true;
    });

    // Sort by creation time (newest first) and limit
    return filtered
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, limit);
  },
});

// Mark notification as read
export const markNotificationAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);

    if (!notification) {
      throw new Error("Notification not found");
    }

    if (notification.userId !== args.userId) {
      throw new Error(
        "Unauthorized: Cannot modify another user's notification"
      );
    }

    await ctx.db.patch(args.notificationId, {
      isRead: true,
    });

    return null;
  },
});

// Mark all notifications as read for a user
export const markAllNotificationsAsRead = mutation({
  args: {
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) =>
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();

    for (const notification of notifications) {
      await ctx.db.patch(notification._id, {
        isRead: true,
      });
    }

    return null;
  },
});

// Archive notification
export const archiveNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);

    if (!notification) {
      throw new Error("Notification not found");
    }

    if (notification.userId !== args.userId) {
      throw new Error(
        "Unauthorized: Cannot modify another user's notification"
      );
    }

    await ctx.db.patch(args.notificationId, {
      isArchived: true,
      isRead: true, // Archive implies read
    });

    return null;
  },
});

// Get unread notification count
export const getUnreadNotificationCount = query({
  args: {
    userId: v.string(),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) =>
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();

    // Filter out expired notifications
    const validNotifications = notifications.filter((notification) => {
      if (notification.expiresAt && notification.expiresAt < Date.now()) {
        return false;
      }
      return !notification.isArchived;
    });

    return validNotifications.length;
  },
});

// Delete notification (for cleanup)
export const deleteNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);

    if (!notification) {
      throw new Error("Notification not found");
    }

    if (notification.userId !== args.userId) {
      throw new Error(
        "Unauthorized: Cannot delete another user's notification"
      );
    }

    await ctx.db.delete(args.notificationId);

    return null;
  },
});

// Helper function to create reward notification
export const createRewardNotification = mutation({
  args: {
    userId: v.string(),
    rewardId: v.id("rewards"),
    rewardTitle: v.string(),
    rewardDescription: v.string(),
    points: v.number(),
  },
  returns: v.id("notifications"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      userId: args.userId,
      notificationTypeKey: "reward_earned",
      title: "🎉 Reward Earned!",
      message: `You earned "${args.rewardTitle}" for ${args.points} points!`,
      isRead: false,
      isArchived: false,
      data: {
        rewardId: args.rewardId,
        metadata: {
          points: args.points,
          rewardTitle: args.rewardTitle,
          rewardDescription: args.rewardDescription,
        },
      },
    });
  },
});

// Helper function to create achievement notification
export const createAchievementNotification = mutation({
  args: {
    userId: v.string(),
    achievementTitle: v.string(),
    achievementDescription: v.string(),
    topicId: v.optional(v.id("topics")),
  },
  returns: v.id("notifications"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      userId: args.userId,
      notificationTypeKey: "achievement_unlocked",
      title: "🏆 Achievement Unlocked!",
      message: `${args.achievementTitle}: ${args.achievementDescription}`,
      isRead: false,
      isArchived: false,
      data: {
        topicId: args.topicId,
        metadata: {
          achievementTitle: args.achievementTitle,
          achievementDescription: args.achievementDescription,
        },
      },
    });
  },
});
