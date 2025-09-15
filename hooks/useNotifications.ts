"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

interface NotificationData {
  topicId?: string;
  notificationTypeKey?: Id<"notificationTypes">;
}

export function useNotifications(userId: string | undefined) {
  const router = useRouter();
  const previousCountRef = useRef<number>(0);
  const isInitializedRef = useRef<boolean>(false);

  // Get unread count
  const unreadCount = useQuery(
    api.notifications.getUnreadNotificationCount,
    userId ? { userId } : "skip"
  );

  // Get notifications
  const notifications = useQuery(
    api.notifications.getUserNotifications,
    userId
      ? {
          userId,
          includeRead: false,
          limit: 10,
        }
      : "skip"
  );

  // Mutations
  // const markAsRead = useMutation(api.notifications.markNotificationAsRead);
  const markAllAsRead = useMutation(
    api.notifications.markAllNotificationsAsRead
  );

  // Show toast when new notifications arrive
  useEffect(() => {
    if (unreadCount !== undefined) {
      // Only show toast if this is not the initial load and count has increased
      if (isInitializedRef.current && unreadCount > previousCountRef.current) {
        const newNotificationCount = unreadCount - previousCountRef.current;
        if (newNotificationCount === 1) {
          toast.info("You have a new notification!");
        } else {
          toast.info(`You have ${newNotificationCount} new notifications!`);
        }
      }

      // Update the previous count and mark as initialized
      previousCountRef.current = unreadCount;
      isInitializedRef.current = true;
    }
  }, [unreadCount]);

  const handleNotificationClick = async (notification: any) => {
    try {
      // Parse notification data
      const data: NotificationData = notification.data || {};

      // Check if this is a successful topic generation notification
      // TODO: REMOVE ENV VARIABLE LATER
      if (
        notification.notificationTypeKey ===
        process.env.NEXT_PUBLIC_SUCCESS_NOTIFICATION_KEY
      ) {
        let redirectUrl;

        // If no direct redirect URL, construct from topic data
        if (data.topicId) {
          redirectUrl = `/topic/${data.topicId}`;
        }

        if (redirectUrl) {
          // Redirect to the topic page
          router.push(redirectUrl);
          return;
        }
      }

      // For other notifications, just show a toast
      // toast.info(notification.message);
    } catch (error) {
      console.error("Error handling notification click:", error);
      toast.error("Failed to process notification");
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!userId) return;

    try {
      await markAllAsRead({ userId });
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to mark all notifications as read");
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return {
    unreadCount,
    notifications,
    handleNotificationClick,
    handleMarkAllAsRead,
    formatTimeAgo,
  };
}
