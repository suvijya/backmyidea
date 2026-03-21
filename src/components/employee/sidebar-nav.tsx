"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Flag,
  Lightbulb,
  Archive,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "Pending Ideas",
    href: "/employee",
    icon: Lightbulb,
  },
  {
    label: "All Ideas",
    href: "/employee/ideas",
    icon: Archive,
  },
  {
    label: "Reports",
    href: "/employee/reports",
    icon: Flag,
  },
] as const;

export function EmployeeSidebarNav({ horizontal }: { horizontal?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className={cn(horizontal ? "flex gap-2" : "space-y-1")}>
      {NAV_ITEMS.map((item) => {
        // Special match for exact path
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-[14px] font-medium transition-colors",
              isActive
                ? "bg-blue-100 text-blue-700"
                : "text-text-secondary hover:bg-warm-hover hover:text-deep-ink",
              horizontal && "shrink-0 whitespace-nowrap"
            )}
          >
            <item.icon className="h-[16px] w-[16px]" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
