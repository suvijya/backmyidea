"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  LayoutDashboard,
  Flag,
  Lightbulb,
  Users,
  BadgeDollarSign,
  ShieldCheck,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
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

export function MobileAdminNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8 lg:hidden border-warm-border">
          <Menu className="h-4 w-4" />
          <span className="sr-only">Toggle Admin Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <SheetHeader className="p-6 border-b border-warm-border text-left">
          <SheetTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand-red" />
            <span className="font-display text-[20px]">Admin Control</span>
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 p-4">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium transition-all active:scale-[0.98]",
                  isActive
                    ? "bg-brand-red text-white shadow-lg shadow-brand-red/20"
                    : "text-text-secondary hover:bg-warm-hover hover:text-deep-ink"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-text-muted")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-6 left-6 right-6">
          <div className="rounded-2xl bg-warm-subtle p-4 border border-warm-border">
            <p className="text-[12px] font-bold text-text-muted uppercase tracking-widest mb-1">System Version</p>
            <p className="text-[14px] font-data font-bold text-deep-ink">Piqd v1.2.4-stable</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
