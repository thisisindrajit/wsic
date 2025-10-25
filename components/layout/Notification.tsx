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
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";

interface NotificationButtonProps {
    userId: string | undefined;
}

const Notification: FC<NotificationButtonProps> = ({ userId }) => {
    const [isOpen, setIsOpen] = useState(false);

    const {
        unreadCount,
        notifications,
        handleNotificationClick,
        handleMarkAllAsRead,
        formatTimeAgo,
    } = useNotifications(userId);

    // Don't render if no userId
    if (!userId) return null;

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
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className="flex items-start justify-between w-full">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm leading-tight line-clamp-2">
                                            {notification.title}
                                        </p>
                                        <p className="text-xs leading-relaxed text-muted-foreground mt-1">
                                            {notification.message}
                                        </p>
                                    </div>
                                    {!notification.isRead && (
                                        <div className="w-2 h-2 bg-foreground rounded-full ml-2 mt-1 flex-shrink-0" />
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