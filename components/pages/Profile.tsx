"use client"

import { useSession, signOut } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorContext } from "better-auth/react";

const Profile = () => {
    const { data: session } = useSession();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const router = useRouter();

    const handleLogout = async () => {
        await signOut({
            fetchOptions: {
                onRequest: () => {
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
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl xs:text-4xl lg:text-4xl/normal font-light">Profile</h1>
                <p className="text-muted-foreground">Manage your account settings</p>
            </div>

            {session && (
                <div className="mt-8 flex flex-col gap-6">
                    <div className="flex items-center gap-6">
                        <Avatar className="size-20 ring-2 ring-white/20 dark:ring-white/10 shadow-lg">
                            <AvatarImage src={session.user?.image ?? undefined} />
                            <AvatarFallback className="text-xl font-medium bg-gradient-to-br from-primary/30 to-primary/20 backdrop-blur-sm">
                                {session.user?.name?.substring(0, 1) ?? ":)"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="space-y-2">
                            <h3 className="text-xl font-semibold text-foreground/90">
                                {session.user?.name ?? "User"}
                            </h3>
                            {session.user?.email && (
                                <p className="text-sm text-muted-foreground/80">
                                    {session.user.email}
                                </p>
                            )}
                        </div>
                    </div>
                    <Button
                        variant="destructive"
                        size="lg"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                    >
                        {isLoggingOut ? "Logging out..." : "Logout"}
                    </Button>
                </div>
            )}
        </div>
    );
}

export default Profile;