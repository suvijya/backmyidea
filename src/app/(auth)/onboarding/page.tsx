import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/clerk";
import { auth } from "@clerk/nextjs/server";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export const metadata: Metadata = {
  title: "Onboarding | Piqd",
  description: "Complete your profile to start validating and discovering startup ideas on Piqd.",
};

export default async function OnboardingPage(props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const returnTo = searchParams?.returnTo;
  const { userId: clerkId } = await auth();

  // Not signed in — shouldn't happen (middleware protects this route)
  if (!clerkId) {
    redirect("/sign-in");
  }

  // Check if user is already onboarded in Prisma
  const user = await getCurrentUser();
  if (user?.onboarded) {
    const returnToQuery = returnTo && typeof returnTo === "string" ? `?returnTo=${encodeURIComponent(returnTo)}` : "";
    redirect(`/api/sync-onboarding${returnToQuery}`);
  }

  return <OnboardingForm />;
}
