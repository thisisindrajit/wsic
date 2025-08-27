"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navigationItems } from "@/constants/common";

interface NavigationSidebarProps {
  currentPath?: string;
  className?: string;
}

const NavigationSidebar: React.FC<NavigationSidebarProps> = ({ 
  currentPath, 
  className 
}) => {
  const pathname = usePathname();
  const activePath = currentPath || pathname;

  return (
    <nav className={cn("flex flex-col gap-2", className)}>
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = activePath === item.href;
        
        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              isActive 
                ? "bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800" 
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className={cn(
              "size-4 shrink-0",
              isActive ? "text-teal-600 dark:text-teal-400" : ""
            )} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default NavigationSidebar;