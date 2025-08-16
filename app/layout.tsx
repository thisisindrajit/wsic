import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { APP_DESCRIPTION, APP_NAME } from "@/constants/common";

import "./globals.css";
import Footer from "@/components/Footer";

const geistSans = Geist({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
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
      <head>
        <link rel="icon" type="image/png" href="/favicons/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicons/favicon.svg" />
        <link rel="shortcut icon" href="/favicons/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content={APP_NAME} />
        <link rel="manifest" href="/favicons/site.webmanifest" />
      </head>
      <body
        className={`${geistSans.className} antialiased`}
      >
        <div className="flex flex-col gap-8 min-h-[100dvh] p-4 relative z-10 bg-background">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
