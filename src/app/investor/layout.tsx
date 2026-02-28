import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { requireUser } from "@/lib/clerk";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/navbar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { InvestorSidebarNav } from "@/components/investor/sidebar-nav";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InvestorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  // Check if user has an approved investor profile
  const profile = await prisma.investorProfile.findUnique({
    where: { userId: user.id },
  });

  // Determine if this is the apply page (don't show dashboard header/sidebar)
  const headersList = await headers();
  const url = headersList.get("x-url") || headersList.get("x-invoke-path") || "";
  const isApplyPage = url.includes("/investor/apply");

  // NOTE: We allow access to layout even without profile,
  // because the apply page lives under /investor/apply.
  // Each page (except apply) should check for profile and redirect if missing.

  const showSidebar = !!profile && !isApplyPage;

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-[1200px] px-4 py-6 lg:px-8">
        {!isApplyPage && (
          <div className="mb-6 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-saffron animate-pulse" />
            <span className="text-[13px] font-semibold uppercase tracking-wider text-saffron">
              Investor Dashboard
            </span>
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
          <main className={cn("min-w-0 pb-[76px] md:pb-0", !showSidebar && "lg:col-span-full")}>
            {children}
          </main>
        </div>
      </div>
      <BottomNav />
    </>
  );
}
