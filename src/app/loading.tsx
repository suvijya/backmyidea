import { Loader2 } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-card">
          <Loader2 className="h-8 w-8 animate-spin text-saffron" />
        </div>
        <p className="font-display text-[15px] font-medium text-text-secondary tracking-wide animate-pulse">
          Loading...
        </p>
      </div>
    </div>
  );
}