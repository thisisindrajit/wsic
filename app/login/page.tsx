"use client";

import { useEffect, useState } from "react";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { CALLBACK_URL } from "@/constants/common";

const LoginPage = () => {
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { data: session } = useSession();
    const params = useSearchParams();
    const gradientTextClass = "text-transparent bg-clip-text bg-gradient-to-br from-teal-600 to-teal-400";

    const handleSignInError = (errorMessage: string) => {
        setError(errorMessage);
    };

    const handleSignInStart = () => {
        // Clear any existing errors when starting a new sign-in attempt
        setError(null);
    };

    const dismissError = () => {
        setError(null);
    };

    useEffect(() => {
        if (session) {
            router.replace(params.get("redirect_url") ?? CALLBACK_URL);
        }
    }, [session, params, router])

    return (
        <>
            <div className="flex flex-col items-center justify-center flex-1 min-h-[calc(100dvh-5rem)] py-12">
                <div className="flex flex-col items-center justify-center gap-6 pb-32">
                    {/* Welcome Section */}
                    <h1 className="text-3xl/normal md:text-4xl/normal lg:text-5xl/normal font-light text-center flex flex-col md:flex-row md:gap-3">
                        Welcome to{' '}
                        <span className={gradientTextClass}>
                            Why Should I Care
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl font-light">
                        Sign in to discover what matters most.
                    </p>
                    <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />
                    {/* Google Sign-in Button */}
                    <GoogleSignInButton
                        onSignIn={handleSignInStart}
                        onError={handleSignInError}
                    />
                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-destructive p-2 pl-4 relative flex items-center justify-between gap-6" role="alert">
                            <span className="text-sm/relaxed">{error}</span>
                            <Button
                                onClick={dismissError}
                                variant="destructive"
                                size="icon"
                                className="bg-inherit text-destructive shadow-none hover:text-white"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default LoginPage;