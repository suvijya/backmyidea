import { requireUser } from "@/lib/clerk";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/navbar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { InvestorLayoutWrapper } from "@/components/investor/investor-layout-wrapper";

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

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-[1200px] px-4 py-6 lg:px-8">
        <InvestorLayoutWrapper hasProfile={!!profile}>
          {children}
        </InvestorLayoutWrapper>
      </div>
      <BottomNav />
    </>
  );
}
