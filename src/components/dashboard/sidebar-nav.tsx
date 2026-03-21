"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Lightbulb,
  Vote,
  Bell,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "My Ideas",
    href: "/dashboard/ideas",
    icon: Lightbulb,
  },
  {
    label: "My Votes",
    href: "/dashboard/votes",
    icon: Vote,
  },
  {
    label: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
] as const;

export function DashboardSidebarNav({ horizontal }: { horizontal?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className={cn(horizontal ? "flex gap-2" : "space-y-1")}>
      {NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-[14px] font-medium transition-colors",
              isActive
                ? "bg-saffron-light text-saffron"
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
