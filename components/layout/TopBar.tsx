"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FC, useEffect, useState } from "react";
import { Session } from "@/lib/auth-client";
import { CALLBACK_URL, TOPBAR_SCROLL_THRESHOLD } from "@/constants/common";
import { cn } from "@/lib/utils";
import Notification from "@/components/layout/Notification";
import ThemeToggle from "@/components/layout/ThemeToggle";

interface TopBarProps {
    session: Session | null;
}

const TopBar: FC<TopBarProps> = ({ session }) => {
    const [isVisible, setIsVisible] = useState<boolean>(true);
    const [isAtTop, setIsAtTop] = useState<boolean>(true);
    const [lastScrollY, setLastScrollY] = useState<number>(0);
    const pathname = usePathname();

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



    const showRightContent = () => {
        if (session) {
            return (
                <>
                    <ThemeToggle />
                    <Notification userId={session.user?.id} />
                </>
            );
        } else {
            switch (pathname) {
                case "/":
                    return (
                        <>
                            <ThemeToggle />
                            <Link href="/login">
                                <Button className="uppercase cursor-pointer">Login</Button>
                            </Link>
                        </>
                    );
                default:
                    return <ThemeToggle />;
            }
        }
    }

    return (
        <div className={cn(
            "fixed top-0 left-0 right-0 z-50 transition-all ease-in-out max-w-[1440px] mx-auto",
            // Background and border styling based on scroll position
            isAtTop
                ? "bg-transparent"
                : "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b",
            // Show/hide based on scroll direction (only when not at top)
            !isAtTop && !isVisible && "-translate-y-full"
        )}>
            <div className="mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href={session ? CALLBACK_URL : "/"}>
                        <div className="h-9 w-9 grid grid-cols-2 grid-rows-2 font-medium border border-foreground p-0.5 text-xs place-items-center cursor-pointer select-none">
                            <div>W</div>
                            <div>S</div>
                            <div>I</div>
                            <div>C</div>
                        </div>
                    </Link>
                    <div className="flex items-center gap-3">
                        {showRightContent()}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TopBar;