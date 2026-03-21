import { redirect } from "next/navigation";
import { requireUser } from "@/lib/clerk";
import { prisma } from "@/lib/prisma";
import { InvestorDashboardClient } from "@/components/investor/investor-dashboard-client";

export const dynamic = "force-dynamic";

export default async function InvestorDashboardPage() {
  const user = await requireUser();

  // Check if user has an approved investor profile
  const profile = await prisma.investorProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    redirect("/investor/apply");
  }

  return <InvestorDashboardClient />;
}
