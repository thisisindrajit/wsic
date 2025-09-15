"use client"

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      {/* 404 Visual */}
      <div className="mb-8">
        <div className="text-8xl text-teal-500">404</div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto mb-8">
        <h1 className="text-3xl mb-4">Page Not Found</h1>
        <p className="text-muted-foreground text-lg">
          {`Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.`}
        </p>
      </div>

      {/* Action Button */}
      <Link href="/">
        <Button className="flex items-center gap-2">
          <Home className="h-4 w-4" />
          Go Home
        </Button>
      </Link>
    </div>
  );
}