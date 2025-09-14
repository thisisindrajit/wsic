"use client"

import NavigationSidebar from "@/components/navigation/NavigationSidebar";
import MobileBottomNavigation from "@/components/navigation/MobileBottomNavigation";
import SubscriptionCard from "@/components/features/SubscriptionCard";
import TrendingTopics from "@/components/content/TrendingTopics";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { TOPBAR_SCROLL_THRESHOLD } from "@/constants/common";
import { usePathname } from "next/navigation";

export default function UserLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session } = useSession();
    const pathname = usePathname();

    // Track scroll states for sidebar height calculations
    const [isAtTop, setIsAtTop] = useState<boolean>(true);
    const [isVisible, setIsVisible] = useState<boolean>(true);
    const [lastScrollY, setLastScrollY] = useState<number>(0);

    useEffect(() => {
        const currentScrollY = window.scrollY;
        setLastScrollY(currentScrollY);
        setIsAtTop(currentScrollY < TOPBAR_SCROLL_THRESHOLD);

        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Check if we're at the top
            setIsAtTop(currentScrollY < TOPBAR_SCROLL_THRESHOLD);

            // Only apply show/hide logic when not at top
            if (currentScrollY >= TOPBAR_SCROLL_THRESHOLD) {
                // Show TopBar when scrolling up
                if (currentScrollY < lastScrollY) {
                    setIsVisible(true);
                }
                // Hide TopBar when scrolling down (but only after 100px to avoid flickering)
                else if (currentScrollY > lastScrollY && currentScrollY > 100) {
                    setIsVisible(false);
                }
            } else {
                // Always visible when at top
                setIsVisible(true);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [lastScrollY]);

    useEffect(() => {
        // Scroll to top on page load
        window.scrollTo(0, 0);
    }, [pathname]);

    // Calculate sidebar height based on scroll state
    const getSidebarHeight = () => {
        if (isAtTop) {
            return "h-[calc(100dvh-8rem)]"; // At top
        } else if (isVisible) {
            return "h-[calc(100dvh-6rem)]"; // Not at top but topbar visible
        } else {
            return "h-[calc(100dvh-2rem)]"; // Not at top and topbar not visible
        }
    };

    const getSidebarTop = () => {
        if (isAtTop || isVisible) {
            return "top-20"; // At top (or) Not at top but topbar visible
        } else {
            return "top-4"; // Not at top and topbar not visible
        }
    };

    return (
        <>
            <div className="w-full lg:max-w-6xl lg:mx-auto mt-4 pb-24 lg:pb-0">
                <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 md:gap-6 lg:px-4">
                    {/* Left Sidebar - Navigation (hidden on mobile and tablet) */}
                    <div className={cn(
                        "hidden lg:block lg:col-span-3 sticky transition-all mt-3",
                        getSidebarTop(),
                        getSidebarHeight()
                    )}>
                        <NavigationSidebar session={session} />
                    </div>

                    {/* Center Content */}
                    <div className="flex flex-col gap-6 min-h-[calc(100dvh-8rem)] lg:col-span-5">
                        {children}
                    </div>

                    {/* Right Sidebar - Subscription and Trending */}
                    <div className={cn(
                        "hidden lg:block lg:col-span-4 lg:sticky lg:overflow-auto pr-3 transition-all mt-3 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-track]:bg-neutral-700 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500",
                        getSidebarTop(),
                        getSidebarHeight()
                    )}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                            <TrendingTopics />
                            <SubscriptionCard />
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <MobileBottomNavigation />
        </>
    );
}