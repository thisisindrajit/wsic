"use client"

import { useEffect, useState } from "react";
import { TOPBAR_SCROLL_THRESHOLD } from "@/constants/common";

export const useTopBarVisibility = () => {
    // Initialize states based on current scroll position
    const [isVisible, setIsVisible] = useState<boolean>(true);
    const [isAtTop, setIsAtTop] = useState<boolean>(true);
    const [lastScrollY, setLastScrollY] = useState<number>(0);

    useEffect(() => {
        // Initialize with current scroll position
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

    // Return true when TopBar should have background styling (not at top AND visible)
    return !isAtTop && isVisible;
};