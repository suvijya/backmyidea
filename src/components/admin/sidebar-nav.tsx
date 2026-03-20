"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Flag,
  Lightbulb,
  Users,
  BadgeDollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: Flag,
  },
  {
    label: "Ideas",
    href: "/admin/ideas",
    icon: Lightbulb,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Investors",
    href: "/admin/investors",
    icon: BadgeDollarSign,
  },
] as const;

export function AdminSidebarNav({ horizontal }: { horizontal?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className={cn(horizontal ? "flex gap-2" : "space-y-1")}>
      {NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/admin" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-[14px] font-medium transition-colors",
              isActive
                ? "bg-brand-red-light text-brand-red"
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
