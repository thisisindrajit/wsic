"use client"

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FC, useState, useEffect } from "react";
import { toast } from "sonner";
import { ErrorContext } from "better-auth/react";
import { Session, signOut } from "@/lib/auth-client";
import { APP_SHORT_NAME, CALLBACK_URL, TOPBAR_SCROLL_THRESHOLD } from "@/constants/common";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TopBarProps {
    session: Session | null;
}

const TopBar: FC<TopBarProps> = ({ session }) => {
    const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
    const [isVisible, setIsVisible] = useState<boolean>(true);
    const [isAtTop, setIsAtTop] = useState<boolean>(true);
    const [lastScrollY, setLastScrollY] = useState<number>(0);
    const router = useRouter();
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

    const logout = async () => {
        await signOut({
            fetchOptions: {
                onRequest: () => {
                    // Show logging out in button
                    setIsLoggingOut(true);
                },
                onSuccess: () => {
                    toast.success("You have been logged out successfully!");
                    router.push("/");
                    router.refresh();
                    setIsLoggingOut(false);
                },
                onError: (error: ErrorContext) => {
                    console.error("Error during logout:", error);
                    toast.error("An error occurred while logging out. Please try again.");
                    setIsLoggingOut(false);
                },
            },
        });
    }

    const showLoginOrUserButton = () => {
        // If user is logged in
        if (session) {
            return (
                <>
                    {isLoggingOut && (
                        <div className="border border-foreground/50 border-dashed text-sm h-9 p-2 flex items-center justify-center">
                            Logging out...
                        </div>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Avatar className="size-10">
                            <AvatarImage src={session.user?.image ?? undefined} />
                            <AvatarFallback>
                                {session.user?.name.substring(0, 1) ?? ":)"}
                            </AvatarFallback>
                        </Avatar></DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="min-w-56"
                            align="end"
                            sideOffset={10}
                        >
                            <DropdownMenuLabel>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">
                                        {session.user?.name ?? `${APP_SHORT_NAME} User`}
                                    </span>
                                    {session.user?.email && (
                                        <span className="truncate text-xs text-muted-foreground">
                                            {session.user.email}
                                        </span>
                                    )}
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                                {/* <DropdownMenuItem>
                                Feedback
                                </DropdownMenuItem> */}
                                <DropdownMenuItem onClick={logout}>
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </>);
        } else {
            switch (pathname) {
                case "/":
                    return (
                        <Link href="/login">
                            <Button className="uppercase cursor-pointer">Login</Button>
                        </Link>
                    );
                default:
                    return null;
            }
        }
    }

    return (
        <div className={cn(
            "fixed top-0 left-0 right-0 z-50 transition-all ease-in-out",
            // Background and border styling based on scroll position
            isAtTop 
                ? "bg-transparent" 
                : "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b",
            // Show/hide based on scroll direction (only when not at top)
            !isAtTop && !isVisible && "-translate-y-full"
        )}>
            <div className="container mx-auto px-4 py-3">
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
                    <div className="flex items-center gap-3">{showLoginOrUserButton()}</div>
                </div>
            </div>
        </div>
    )
}

export default TopBar;