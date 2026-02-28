"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Auth error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-red-light">
        <AlertTriangle className="h-7 w-7 text-brand-red" />
      </div>
      <h2 className="mb-2 text-[22px] font-bold text-deep-ink">
        Authentication Error
      </h2>
      <p className="mb-6 max-w-[400px] text-[15px] text-text-secondary">
        There was a problem with authentication. Please try again.
      </p>
      <Button
        variant="outline"
        className="gap-2 border-warm-border"
        onClick={reset}
      >
        <RotateCcw className="h-4 w-4" />
        Try Again
      </Button>
    </div>
  );
}
