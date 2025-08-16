"use client"

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FC, useState } from "react";
import { toast } from "sonner";
import { ErrorContext } from "better-auth/react";
import { Session, signOut } from "@/lib/auth-client";
import { APP_SHORT_NAME, CALLBACK_URL } from "@/constants/common";
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
    const router = useRouter();
    const pathname = usePathname();

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
        <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href={session ? CALLBACK_URL : "/"}>
                <div className="h-9 w-9 grid grid-cols-2 grid-rows-2 font-medium border border-foreground p-0.5 text-xs place-items-center cursor-pointer">
                    <div>W</div>
                    <div>S</div>
                    <div>I</div>
                    <div>C</div>
                </div>
            </Link>
            <div className="flex items-center gap-3">{showLoginOrUserButton()}</div>
        </div>
    )
}

export default TopBar;