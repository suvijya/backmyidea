import Link from "next/link";
import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  actionHref,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-warm-border bg-warm-subtle/50 px-6 py-16 text-center",
        className
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-warm-subtle">
        {icon ?? <Lightbulb className="h-5 w-5 text-text-muted" />}
      </div>
      <h3 className="mb-1 text-[15px] font-semibold text-deep-ink">{title}</h3>
      <p className="mb-6 max-w-sm text-[13px] leading-relaxed text-text-secondary">
        {description}
      </p>
      {actionLabel && actionHref && (
        <Link href={actionHref}>
          <Button
            size="sm"
            className="bg-saffron text-white hover:bg-saffron-dark"
          >
            {actionLabel}
          </Button>
        </Link>
      )}
    </div>
  );
}
