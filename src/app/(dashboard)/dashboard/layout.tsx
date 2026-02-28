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
