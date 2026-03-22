import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Metadata } from "next";

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `@${username} | Piqd Profile`,
    description: `Check out ${username}'s profile on Piqd. See their startup ideas and validation activity.`,
  };
}

export const dynamic = "force-dynamic";
import { getUserProfile } from "@/actions/user-actions";
import { getIdeasByUser } from "@/actions/idea-actions";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileIdeaList } from "@/components/profile/profile-idea-list";
import { Skeleton } from "@/components/ui/skeleton";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

async function ProfileLoader({ username }: { username: string }) {
  const result = await getUserProfile(username);

  if (!result.success || !result.data) {
    notFound();
  }

  const user = result.data;
  const ideas = await getIdeasByUser(user.id);

  return (
    <>
      <ProfileHeader user={user} />
      <ProfileIdeaList ideas={ideas} />
    </>
  );
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Suspense fallback={
        <div className="space-y-8">
          <Skeleton className="h-[200px] w-full rounded-2xl" />
          <Skeleton className="h-[400px] w-full rounded-2xl" />
        </div>
      }>
        <ProfileLoader username={username} />
      </Suspense>
    </div>
  );
}
