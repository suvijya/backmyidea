import Link from "next/link";
import { requireAdmin } from "@/lib/clerk";
import { Navbar } from "@/components/layout/navbar";
import { AdminSidebarNav } from "@/components/admin/sidebar-nav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-brand-red animate-pulse" />
          <span className="text-[13px] font-semibold uppercase tracking-wider text-brand-red">
            Admin Panel
          </span>
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
          {/* Sidebar — desktop only */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <AdminSidebarNav />
            </div>
          </aside>

          {/* Main content */}
          <main className="min-w-0 pb-20 md:pb-0">{children}</main>
        </div>
      </div>
    </>
  );
}
