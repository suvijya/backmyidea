"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-red-light">
        <AlertTriangle className="h-7 w-7 text-brand-red" />
      </div>
      <h2 className="mb-2 text-[22px] font-bold text-deep-ink">
        Admin Panel Error
      </h2>
      <p className="mb-6 max-w-[400px] text-[15px] text-text-secondary">
        Something went wrong in the admin panel. Try refreshing or contact
        engineering.
      </p>
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="gap-2 border-warm-border"
          onClick={reset}
        >
          <RotateCcw className="h-4 w-4" />
          Try Again
        </Button>
        <Button asChild className="gap-2 bg-saffron hover:bg-saffron-dark">
          <Link href="/admin">
            <Home className="h-4 w-4" />
            Admin Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
