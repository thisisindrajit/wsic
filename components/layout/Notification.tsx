"use client"

import { FC, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface NotificationButtonProps {
    userId: string | undefined;
}

const Notification: FC<NotificationButtonProps> = ({ userId }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    // Get unread count
    const unreadCount = useQuery(
        api.notifications.getUnreadNotificationCount,
        userId ? { userId } : "skip"
    );
    
    // Get notifications
    const notifications = useQuery(
        api.notifications.getUserNotifications,
        userId ? {
            userId,
            includeRead: false,
            limit: 10,
        } : "skip"
    );
    
    // Mutations
    const markAsRead = useMutation(api.notifications.markNotificationAsRead);
    const markAllAsRead = useMutation(api.notifications.markAllNotificationsAsRead);
    
    // Don't render if no userId
    if (!userId) return null;
    
    const handleNotificationClick = async (notificationId: string) => {
        try {
            await markAsRead({
                notificationId: notificationId as Id<"notifications">,
                userId,
            });
        } catch (error) {
            console.error("Error marking notification as read:", error);
            toast.error("Failed to mark notification as read");
        }
    };
    
    const handleMarkAllAsRead = async () => {
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
    
    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    className="relative p-2 size-10 rounded-full touch-manipulation bg-background/60"
                >
                    <Bell className="h-5 w-5" />
                    {(unreadCount && unreadCount > 0) ? (
                        <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-teal-500"></span>
                    ) : null}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-80 max-h-96 overflow-y-auto"
                align="end"
                sideOffset={10}
            >
                <div className="flex items-center justify-between px-2 py-1 text-sm font-medium">
                    <DropdownMenuLabel className="p-0">
                        Notifications
                    </DropdownMenuLabel>
                    {unreadCount && unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
                            onClick={handleMarkAllAsRead}
                        >
                            Mark all read
                        </Button>
                    )}
                </div>
                <DropdownMenuSeparator />
                
                {!notifications || notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        No new notifications
                    </div>
                ) : (
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification._id}
                                className={cn(
                                    "flex flex-col items-start p-3 cursor-pointer",
                                    !notification.isRead && "bg-muted/50"
                                )}
                                onClick={() => handleNotificationClick(notification._id)}
                            >
                                <div className="flex items-start justify-between w-full">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">
                                            {notification.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                            {notification.message}
                                        </p>
                                    </div>
                                    {!notification.isRead && (
                                        <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1 flex-shrink-0" />
                                    )}
                                </div>
                                <span className="text-xs text-muted-foreground mt-2">
                                    {formatTimeAgo(notification._creationTime)}
                                </span>
                            </DropdownMenuItem>
                        ))}
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default Notification;