"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  Home,
  Compass,
  Plus,
  Trophy,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", icon: Home, label: "Home", isCenter: false },
  { href: "/explore", icon: Compass, label: "Explore", isCenter: false },
  { href: "/dashboard/ideas/new", icon: Plus, label: "Post", isCenter: true },
  { href: "/leaderboard", icon: Trophy, label: "Rank", isCenter: false },
  { href: "/dashboard", icon: User, label: "Me", isCenter: false },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { isSignedIn } = useUser();

  // Hide on onboarding and auth pages
  if (
    pathname === "/onboarding" ||
    pathname.startsWith("/sign-")
  ) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-warm-border bg-white pb-safe md:hidden">
      <div className="flex h-[60px] items-end justify-around px-2">
        {TABS.map((tab) => {
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);

          // Center "Post" button — elevated saffron circle
          if (tab.isCenter) {
            return (
              <Link
                key={tab.href}
                href={isSignedIn ? tab.href : "/sign-in"}
                className="flex flex-col items-center gap-0.5 pb-1.5"
              >
                <div className="-mt-5 flex h-[48px] w-[48px] items-center justify-center rounded-full bg-saffron shadow-saffron transition-transform active:scale-95">
                  <Plus className="h-5 w-5 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-medium text-saffron">
                  {tab.label}
                </span>
              </Link>
            );
          }

          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-0.5 pb-1.5 pt-2"
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isActive ? "text-saffron" : "text-text-muted"
                )}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive ? "text-saffron" : "text-text-muted"
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
