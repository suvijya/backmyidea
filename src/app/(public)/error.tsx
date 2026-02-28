"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Public page error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-[480px] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-red-light">
        <AlertTriangle className="h-7 w-7 text-brand-red" />
      </div>
      <h2 className="mb-2 text-[22px] font-bold text-deep-ink">
        Something went wrong
      </h2>
      <p className="mb-6 text-[15px] text-text-secondary">
        We hit an unexpected error loading this page. This has been logged and
        we&apos;ll look into it.
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
          <Link href="/">
            <Home className="h-4 w-4" />
            Go Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
