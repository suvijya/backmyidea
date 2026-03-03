import { requireUser } from "@/lib/clerk";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { EmployeeReportsClient } from "./client";

export default async function EmployeeReportsPage() {
  const user = await requireUser();
  if (!user.isEmployee && !user.isAdmin) {
    redirect("/");
  }

  const pendingReports = await prisma.report.findMany({
    where: { status: "PENDING" },
    include: { 
      user: { select: { username: true } },
      idea: { select: { title: true, slug: true } }
    },
    orderBy: { createdAt: "asc" }
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-[28px] leading-tight text-deep-ink">Reports</h1>
        <p className="mt-1 text-[14px] text-text-secondary">Review and resolve user reports.</p>
      </div>
      <EmployeeReportsClient initialReports={pendingReports} />
    </div>
  );
}
