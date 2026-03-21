import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/clerk";
import { prisma } from "@/lib/prisma";
import InvestorDashboardClient from "@/components/investor/investor-dashboard-client";

export default async function InvestorPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  if (!user.onboarded) {
    redirect("/onboarding");
  }

  // Check if user has an investor profile
  const investorProfile = await prisma.investorProfile.findUnique({
    where: { userId: user.id },
  });

  if (!investorProfile) {
    redirect("/investor/apply");
  }

  return <InvestorDashboardClient />;
}
