import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { APP_DESCRIPTION, APP_NAME } from "@/constants/common";

import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.className} antialiased p-4 lg:p-6`}
      >
        {children}
      </body>
    </html>
  );
}
