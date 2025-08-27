import { APP_NAME, CALLBACK_URL } from "@/constants/common";
import { auth } from "@/lib/auth";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: `Login - ${APP_NAME}`
};

export default async function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    // If user is authenticated, navigate to dashboard page
    if (session) {
        redirect(CALLBACK_URL);
    }

    return children;
}