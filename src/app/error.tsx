"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Root Error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center max-w-md mx-auto">
      <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4 mb-6">
        <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-500" />
      </div>
      <h2 className="text-2xl font-bold mb-3 tracking-tight">
        Something went wrong!
      </h2>
      <p className="text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
        An unexpected error occurred. We've been notified and are looking into it.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <Button
          onClick={() => reset()}
          size="lg"
          className="bg-brand-blue hover:bg-brand-blue/90 text-white"
        >
          Try again
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/">Return to home</Link>
        </Button>
      </div>
    </div>
  );
}
