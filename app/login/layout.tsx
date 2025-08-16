import { APP_NAME } from "@/constants/common";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: `Login - ${APP_NAME}`,
};

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}