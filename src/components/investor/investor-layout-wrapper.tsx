"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { InvestorSidebarNav } from "@/components/investor/sidebar-nav";

export function InvestorLayoutWrapper({
  children,
  hasProfile,
}: {
  children: React.ReactNode;
  hasProfile: boolean;
}) {
  const pathname = usePathname();
  const isApplyPage = pathname?.includes("/investor/apply");
  const showSidebar = hasProfile && !isApplyPage;

  return (
    <>
      {!isApplyPage && (
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-saffron animate-pulse" />
            <span className="text-[13px] font-semibold uppercase tracking-wider text-saffron">
              Investor Dashboard
            </span>
          </div>
          {/* Mobile Investor Nav - Horizontal scroll */}
          {showSidebar && (
            <div className="lg:hidden w-full overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              <div className="flex gap-2 min-w-max">
                <InvestorSidebarNav horizontal />
              </div>
            </div>
          )}
        </div>
      )}
      <div className={cn("grid grid-cols-1 gap-8", showSidebar && "lg:grid-cols-[220px_1fr]")}>
        {/* Sidebar — desktop only, only show if investor has a profile and not on apply page */}
        {showSidebar && (
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <InvestorSidebarNav />
            </div>
          </aside>
        )}

        {/* Main content */}
        <main className={cn("min-w-0", !showSidebar && "lg:col-span-full")}>
          {children}
        </main>
      </div>
    </>
  );
}
