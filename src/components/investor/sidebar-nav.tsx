"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bookmark,
  GitCompareArrows,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "Deal Flow",
    href: "/investor",
    icon: LayoutDashboard,
  },
  {
    label: "Watchlist",
    href: "/investor/watchlist",
    icon: Bookmark,
  },
  {
    label: "Compare",
    href: "/investor/compare",
    icon: GitCompareArrows,
  },
] as const;

export function InvestorSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/investor" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition-colors",
              isActive
                ? "bg-saffron-light text-saffron"
                : "text-text-secondary hover:bg-warm-hover hover:text-deep-ink"
            )}
          >
            <item.icon className="h-[18px] w-[18px]" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
