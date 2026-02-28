import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Terms of Service — ${APP_NAME}`,
  description: `Terms of service for ${APP_NAME}.`,
};

export default function TermsPage() {
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
        Terms of Service
      </h1>
      <p className="mt-2 text-[13px] text-text-muted">
        Last updated: March 1, 2026
      </p>

      <div className="mt-8 space-y-6 text-[15px] leading-[1.8] text-text-secondary">
        <h2 className="font-display text-[22px] text-deep-ink">
          Acceptance of Terms
        </h2>
        <p>
          By using {APP_NAME}, you agree to these Terms of Service. If you do
          not agree, please do not use the platform.
        </p>

        <h2 className="font-display text-[22px] text-deep-ink">
          Account Responsibilities
        </h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>You must provide accurate information during signup</li>
          <li>You are responsible for all activity under your account</li>
          <li>You must not create multiple accounts to manipulate votes</li>
          <li>You must be at least 18 years old to use the platform</li>
        </ul>

        <h2 className="font-display text-[22px] text-deep-ink">
          Content Guidelines
        </h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>Ideas posted must be original or properly attributed</li>
          <li>No spam, harassment, hate speech, or illegal content</li>
          <li>No posting of stolen or plagiarized ideas</li>
          <li>Comments must be constructive and respectful</li>
          <li>
            We reserve the right to remove content that violates these guidelines
          </li>
        </ul>

        <h2 className="font-display text-[22px] text-deep-ink">
          Intellectual Property
        </h2>
        <p>
          You retain ownership of any ideas you post on {APP_NAME}. By posting,
          you grant us a non-exclusive license to display your content on the
          platform. We do not claim ownership of your ideas.
        </p>
        <p>
          <strong className="text-deep-ink">Important:</strong> Posting your
          idea publicly on {APP_NAME} does not constitute legal protection.
          If you want to protect your idea, consider filing for patents or
          trademarks separately.
        </p>

        <h2 className="font-display text-[22px] text-deep-ink">
          Voting &amp; Validation
        </h2>
        <p>
          Validation scores are based on community votes and engagement. They
          are indicators of interest, not guarantees of market success. Do not
          rely solely on validation scores for business decisions.
        </p>

        <h2 className="font-display text-[22px] text-deep-ink">
          Micro-Donations
        </h2>
        <p>
          Donations made through the platform are voluntary contributions.
          {APP_NAME} charges a 10% platform fee on payouts. Refunds are handled
          on a case-by-case basis. We are not responsible for how founders use
          donated funds.
        </p>

        <h2 className="font-display text-[22px] text-deep-ink">
          Limitation of Liability
        </h2>
        <p>
          {APP_NAME} is provided &quot;as is&quot; without warranties of any
          kind. We are not liable for any damages arising from your use of the
          platform, including but not limited to lost profits, data loss, or
          business interruption.
        </p>

        <h2 className="font-display text-[22px] text-deep-ink">
          Termination
        </h2>
        <p>
          We may suspend or terminate your account at any time for violations of
          these terms. You may delete your account at any time through your
          settings.
        </p>

        <h2 className="font-display text-[22px] text-deep-ink">Contact</h2>
        <p>
          Questions about these terms? Contact us at{" "}
          <a
            href="mailto:legal@backmyidea.in"
            className="font-medium text-saffron hover:text-saffron-dark"
          >
            legal@backmyidea.in
          </a>
          .
        </p>
      </div>
    </div>
  );
}
