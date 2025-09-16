"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { mobileNavigationItems } from "@/constants/common";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "@/lib/auth-client";

const MobileBottomNavigation: React.FC = () => {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <nav className="bottom-bar fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border lg:hidden">
      <div className="flex items-center justify-around px-1 py-3">
        {mobileNavigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          // Handle profile item differently
          if (item.id === "profile") {
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center justify-center p-2 rounded-md transition-colors",
                  isActive
                    ? "text-teal-600 dark:text-teal-400"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {session ? (
                  <Avatar className="size-[22px]">
                    <AvatarImage src={session.user?.image ?? undefined} />
                    <AvatarFallback className="text-xs">
                      {session.user?.name?.substring(0, 1) ?? ":)"}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Icon className={cn(
                    "size-[22px]",
                    isActive ? "text-teal-600 dark:text-teal-400" : ""
                  )} />
                )}
              </Link>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex items-center justify-center p-2 rounded-md transition-colors",
                isActive
                  ? "text-teal-600 dark:text-teal-400"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cn(
                "size-[22px]",
                isActive ? "text-teal-600 dark:text-teal-400" : ""
              )} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNavigation;