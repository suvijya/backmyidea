import { requireUser } from "@/lib/clerk";
import { SettingsForm } from "@/components/dashboard/settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div>
      <h1 className="font-display text-[28px] leading-tight text-deep-ink">
        Settings
      </h1>
      <p className="mt-0.5 text-[14px] text-text-secondary">
        Update your profile information
      </p>

      <SettingsForm
        user={{
          name: user.name,
          image: user.image,
          email: user.email,
          bio: user.bio,
          city: user.city,
          state: user.state,
          college: user.college,
          company: user.company,
          linkedinUrl: user.linkedinUrl,
          role: user.role,
        }}
      />
    </div>
  );
}
