import { APP_NAME, APP_SHORT_NAME } from "@/constants/common";
import { auth } from "@/lib/auth";
import type { Metadata } from "next";
import { headers } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    return {
        title: `${session?.user.name}'s Dashboard - ${APP_NAME}`,
        description: `This is the ${APP_SHORT_NAME} dashboard for ${session?.user.name}`,
    };
}

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}