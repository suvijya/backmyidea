import Link from "next/link";
import { requireUser } from "@/lib/clerk";
import { Navbar } from "@/components/layout/navbar";
import { EmployeeSidebarNav } from "@/components/employee/sidebar-nav";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  if (!user.isEmployee && !user.isAdmin) {
    redirect("/");
  }

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[13px] font-semibold uppercase tracking-wider text-blue-600">
            Employee Portal
          </span>
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
          {/* Sidebar — desktop only */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <EmployeeSidebarNav />
            </div>
          </aside>

          {/* Main content */}
          <main className="min-w-0 pb-20 md:pb-0">{children}</main>
        </div>
      </div>
    </>
  );
}
