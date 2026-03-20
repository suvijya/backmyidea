import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Lightbulb,
  Vote,
  Bell,
  Settings,
} from "lucide-react";
import { requireUser } from "@/lib/clerk";
import { Navbar } from "@/components/layout/navbar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { cn } from "@/lib/utils";
import { DashboardSidebarNav } from "@/components/dashboard/sidebar-nav";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-[1200px] px-4 py-6 lg:px-8">
        {/* Mobile Dashboard Nav - Horizontal scroll */}
        <div className="lg:hidden w-full overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide mb-2">
          <div className="flex gap-2 min-w-max">
            <DashboardSidebarNav horizontal />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
          {/* Sidebar — desktop only */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <DashboardSidebarNav />
            </div>
          </aside>

          {/* Main content */}
          <main className="min-w-0 pb-[76px] md:pb-0">{children}</main>
        </div>
      </div>
      <BottomNav />
    </>
  );
}
