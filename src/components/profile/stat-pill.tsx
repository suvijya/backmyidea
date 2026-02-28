import { formatNumber } from "@/lib/utils";

export function StatPill({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-[13px]">
      <span className="text-text-muted">{icon}</span>
      <span className="font-data font-bold text-deep-ink">
        {formatNumber(value)}
      </span>
      <span className="text-text-muted">{label}</span>
    </div>
  );
}
