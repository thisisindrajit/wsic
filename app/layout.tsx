import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { APP_DESCRIPTION, APP_NAME } from "@/constants/common";
import { Toaster } from "sonner";
import TopBar from "@/components/layout/TopBar";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { QueryClientProvider } from "@/providers/QueryClientProvider";
import { ConvexClientProvider } from "@/providers/ConvexClientProvider";
import MetaThemeAndBgColor from "@/components/layout/MetaThemeAndBgColor";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Footer } from "@/components/layout";
import MobileBottomNavigation from "@/components/navigation/MobileBottomNavigation";

import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover'
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <html lang="en" suppressHydrationWarning>
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
        <MetaThemeAndBgColor />
        <ConvexClientProvider>
          <QueryClientProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <TopBar session={session} />
              <div className="flex flex-col gap-8 p-4 w-full mx-auto max-w-[1440px] relative z-10 bg-background">
                {children}
              </div>
              <Footer />
              <Toaster richColors closeButton className="font-(family-name:var(--font-family))" />
              <Analytics />
              <SpeedInsights />
            </ThemeProvider>
          </QueryClientProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
