import { requireUser } from "@/lib/clerk";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { EmployeeDashboardClient } from "./client";

export default async function EmployeePage() {
  const user = await requireUser();
  if (!user.isEmployee && !user.isAdmin) {
    redirect("/");
  }

  const pendingIdeas = await prisma.idea.findMany({
    where: { status: "PENDING" },
    include: { founder: { select: { name: true, username: true } } },
    orderBy: { createdAt: "asc" }
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-[28px] leading-tight text-deep-ink">Pending Ideas</h1>
        <p className="mt-1 text-[14px] text-text-secondary">Review pending Piqds to make them live or reject them.</p>
      </div>
      <EmployeeDashboardClient initialIdeas={pendingIdeas} />
    </div>
  );
}
