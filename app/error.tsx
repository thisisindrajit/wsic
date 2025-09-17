"use client"

import { Button } from "@/components/ui/button";
import { AlertTriangle, Home } from "lucide-react";
import Link from "next/link";

export default function Error() {
  return (
    <div className="min-h-[60dvh] flex flex-col items-center justify-center text-center">
      {/* Error Visual */}
      <div className="mb-8">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto">
        <h1 className="text-3xl mb-4">Something went wrong!</h1>
        <p className="text-muted-foreground text-lg mb-6">
          We encountered an unexpected error.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">        
        <Link href="/">
          <Button variant="outline" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}