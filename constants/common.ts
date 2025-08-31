import { NavigationItem } from "@/interfaces/NavigationItem";
import { Home, Compass, Bookmark, Blocks, User } from "lucide-react";

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
    id: "topics",
    label: "My Topics",
    href: "/user/topics",
    icon: Blocks,
  },
  {
    id: "profile",
    label: "Profile",
    href: "/user/profile",
    icon: User,
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
    id: "topics",
    label: "My Topics",
    href: "/user/topics",
    icon: Blocks,
  },
  {
    id: "profile",
    label: "Profile",
    href: "/user/profile",
    icon: User,
  },
];
