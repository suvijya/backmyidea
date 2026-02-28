import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `About — ${APP_NAME}`,
  description: `Learn about ${APP_NAME}, India's startup idea validation platform.`,
};

export default function AboutPage() {
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
        About {APP_NAME}
      </h1>

      <div className="mt-8 space-y-6 text-[15px] leading-[1.8] text-text-secondary">
        <p>
          <strong className="text-deep-ink">{APP_NAME}</strong> is India&apos;s
          startup idea validation platform. We help founders test their ideas
          with real people before writing a single line of code.
        </p>

        <h2 className="font-display text-[22px] text-deep-ink">How it works</h2>
        <p>
          Founders post their startup ideas in a structured format — the problem
          they&apos;re solving, their proposed solution, and who it&apos;s for.
          The community then votes and provides feedback, generating a validation
          score that helps founders understand real demand.
        </p>

        <h2 className="font-display text-[22px] text-deep-ink">Who it&apos;s for</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong className="text-deep-ink">Founders</strong> — Validate your
            idea before investing time and money.
          </li>
          <li>
            <strong className="text-deep-ink">Everyone</strong> — Discover
            interesting ideas, vote on what you&apos;d actually use, and help
            shape India&apos;s startup ecosystem.
          </li>
          <li>
            <strong className="text-deep-ink">Investors</strong> — Get a curated
            deal flow of validated ideas with real demand signals.
          </li>
        </ul>

        <h2 className="font-display text-[22px] text-deep-ink">Built for India</h2>
        <p>
          Every idea on {APP_NAME} is focused on solving problems for the Indian
          market. From tier-1 cities to small towns, we believe the next wave of
          innovation will come from founders who truly understand local needs.
        </p>

        <h2 className="font-display text-[22px] text-deep-ink">Contact</h2>
        <p>
          Have questions or feedback? Reach out to us at{" "}
          <a
            href="mailto:hello@backmyidea.in"
            className="font-medium text-saffron hover:text-saffron-dark"
          >
            hello@backmyidea.in
          </a>
        </p>
      </div>
    </div>
  );
}
