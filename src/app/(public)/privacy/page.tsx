import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Privacy Policy — ${APP_NAME}`,
  description: `Privacy policy for ${APP_NAME}.`,
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-[720px] px-4 py-10 lg:px-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-text-secondary transition-colors hover:text-deep-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Home
      </Link>

      <h1 className="font-display text-[36px] leading-tight text-deep-ink">
        Privacy Policy
      </h1>
      <p className="mt-2 text-[13px] text-text-muted">
        Last updated: March 1, 2026
      </p>

      <div className="mt-8 space-y-6 text-[15px] leading-[1.8] text-text-secondary">
        <h2 className="font-display text-[22px] text-deep-ink">
          Information We Collect
        </h2>
        <p>
          When you sign up for {APP_NAME} using Google OAuth, we receive your
          name, email address, and profile photo from Google. We also collect
          information you voluntarily provide, such as your username, city, bio,
          and LinkedIn URL during onboarding.
        </p>

        <h2 className="font-display text-[22px] text-deep-ink">
          How We Use Your Information
        </h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>To create and manage your account</li>
          <li>To display your public profile and activity</li>
          <li>To send you notifications about votes, comments, and milestones</li>
          <li>To generate aggregated analytics about platform trends</li>
          <li>To prevent abuse, spam, and maintain platform integrity</li>
        </ul>

        <h2 className="font-display text-[22px] text-deep-ink">
          What We Share
        </h2>
        <p>
          We do not sell your personal data. Your public profile information
          (name, username, city, bio) is visible to other users. Your email
          address is never displayed publicly. We may share anonymized,
          aggregated data for analytics purposes.
        </p>

        <h2 className="font-display text-[22px] text-deep-ink">
          Data Storage
        </h2>
        <p>
          Your data is stored securely on Supabase (PostgreSQL) with encryption
          at rest. Authentication is handled by Clerk, which maintains its own
          security standards. We use Upstash Redis for rate limiting data, which
          is ephemeral.
        </p>

        <h2 className="font-display text-[22px] text-deep-ink">
          Your Rights
        </h2>
        <p>
          You can update or delete your profile information at any time from your
          dashboard settings. To request complete account deletion, contact us at{" "}
          <a
            href="mailto:privacy@backmyidea.in"
            className="font-medium text-saffron hover:text-saffron-dark"
          >
            privacy@backmyidea.in
          </a>
          .
        </p>

        <h2 className="font-display text-[22px] text-deep-ink">Cookies</h2>
        <p>
          We use essential cookies for authentication (managed by Clerk). We do
          not use tracking cookies or third-party advertising cookies.
        </p>

        <h2 className="font-display text-[22px] text-deep-ink">Contact</h2>
        <p>
          For privacy-related questions, reach out to{" "}
          <a
            href="mailto:privacy@backmyidea.in"
            className="font-medium text-saffron hover:text-saffron-dark"
          >
            privacy@backmyidea.in
          </a>
          .
        </p>
      </div>
    </div>
  );
}
