import { NavigationItem } from "@/interfaces/NavigationItem";
import { Home, Compass, Bookmark, FileText, Users, User } from "lucide-react";

export const APP_SHORT_NAME = "WSIC";
export const APP_NAME = "Why Should I Care";
export const APP_DESCRIPTION =
  "Discover and understand topics you might not initially find interesting. WSIC presents information in an engaging, accessible format to spark curiosity and learning.";
export const CALLBACK_URL = "/user/dashboard";
export const NEW_USER_CALLBACK_URL = "/user/dashboard?newUser=1";
export const TOPBAR_SCROLL_THRESHOLD = 5;
export const navigationItems: NavigationItem[] = [
  {
    id: "home",
    label: "Home",
    href: "/user/dashboard",
    icon: Home,
  },
  {
    id: "explore",
    label: "Explore",
    href: "/user/explore",
    icon: Compass,
  },
  {
    id: "saved",
    label: "Saved",
    href: "/user/saved",
    icon: Bookmark,
  },
  {
    id: "notes",
    label: "Notes",
    href: "/user/notes",
    icon: FileText,
  },
  {
    id: "communities",
    label: "Communities",
    href: "/user/communities",
    icon: Users,
  },
];
export const mobileNavigationItems: NavigationItem[] = [
  {
    id: "home",
    label: "Home",
    href: "/user/dashboard",
    icon: Home,
  },
  {
    id: "explore",
    label: "Explore",
    href: "/user/explore",
    icon: Compass,
  },
  {
    id: "saved",
    label: "Saved",
    href: "/user/saved",
    icon: Bookmark,
  },
  {
    id: "notes",
    label: "Notes",
    href: "/user/notes",
    icon: FileText,
  },
  {
    id: "communities",
    label: "Communities",
    href: "/user/communities",
    icon: Users,
  },
  {
    id: "profile",
    label: "Profile",
    href: "/user/profile",
    icon: User,
  },
];

// Difficulty color mappings
export const DIFFICULTY_COLORS = {
  beginner: {
    text: 'text-green-500',
    pill: 'bg-green-500/40 text-green-200 border border-green-500/40',
  },
  intermediate: {
    text: 'text-orange-500',
    pill: 'bg-orange-500/40 text-orange-200 border border-orange-500/40',
  },
  advanced: {
    text: 'text-fuchsia-500',
    pill: 'bg-fuchsia-500/40 text-fuchsia-200 border border-fuchsia-500/40',
  },
} as const;
