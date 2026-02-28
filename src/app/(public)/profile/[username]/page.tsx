import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
import { getUserProfile } from "@/actions/user-actions";
import { getIdeasByUser } from "@/actions/idea-actions";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileIdeaList } from "@/components/profile/profile-idea-list";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const result = await getUserProfile(username);

  if (!result.success || !result.data) {
    notFound();
  }

  const user = result.data;
  const ideas = await getIdeasByUser(user.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <ProfileHeader user={user} />
      <ProfileIdeaList ideas={ideas} />
    </div>
  );
}
