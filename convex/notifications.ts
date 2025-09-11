import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create a new notification
 */
export const createNotification = mutation({
  args: {
    userId: v.string(),
    notificationTypeKey: v.id("notificationTypes"),
    title: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
    expiresAt: v.optional(v.number()),
  },
  returns: v.id("notifications"),
  handler: async (ctx, args) => {
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

/**
 * Get notifications for a user
 */
export const getUserNotifications = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
    includeRead: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      _id: v.id("notifications"),
      _creationTime: v.number(),
      userId: v.string(),
      notificationTypeKey: v.id("notificationTypes"),
      title: v.string(),
      message: v.string(),
      isRead: v.boolean(),
      isArchived: v.boolean(),
      data: v.optional(v.any()),
      expiresAt: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc");

    if (!args.includeRead) {
      query = query.filter((q) => q.eq(q.field("isRead"), false));
    }

    return await query.take(args.limit ?? 20);
  },
});

/**
 * Mark notification as read
 */
export const markNotificationAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
    userId: v.optional(v.string()), // Optional for backward compatibility
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, {
      isRead: true,
    });
    return null;
  },
});

/**
 * Get unread notification count for a user
 */
export const getUnreadNotificationCount = query({
  args: {
    userId: v.string(),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) => 
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();
    
    return unreadNotifications.length;
  },
});

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsAsRead = mutation({
  args: {
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) => 
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();
    
    // Mark all unread notifications as read
    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, {
        isRead: true,
      });
    }
    
    return null;
  },
});

/**
 * Get all notification types
 */
export const getNotificationTypes = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("notificationTypes"),
      _creationTime: v.number(),
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