"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Compass, 
  Bookmark, 
  GraduationCap, 
  User 
} from "lucide-react";

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigationItems: NavigationItem[] = [
  {
    id: "home",
    label: "Home",
    href: "/user/dashboard",
    icon: Home,
  },
  {
    id: "explore",
    label: "Explore",
    href: "/explore",
    icon: Compass,
  },
  {
    id: "saved",
    label: "Saved",
    href: "/user/saved",
    icon: Bookmark,
  },
  {
    id: "courses",
    label: "Courses",
    href: "/user/courses",
    icon: GraduationCap,
  },
  {
    id: "profile",
    label: "Profile",
    href: "/user/profile",
    icon: User,
  },
];

const MobileBottomNavigation: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden pb-safe">
      <div className="flex items-center justify-around px-2 py-2 pb-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-md text-xs font-medium transition-colors min-w-0 flex-1",
                isActive 
                  ? "text-teal-600 dark:text-teal-400" 
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cn(
                "size-5 shrink-0",
                isActive ? "text-teal-600 dark:text-teal-400" : ""
              )} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNavigation;