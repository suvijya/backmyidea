import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <SignUp
      fallbackRedirectUrl="/api/sync-onboarding"
      appearance={{
        elements: {
          rootBox: "mx-auto",
          card: "rounded-xl border border-warm-border shadow-card",
          headerTitle: "text-deep-ink font-bold",
          headerSubtitle: "text-text-secondary",
          socialButtonsBlockButton:
            "border-warm-border bg-white text-deep-ink hover:bg-warm-hover",
          formButtonPrimary:
            "bg-saffron hover:bg-saffron-dark text-white shadow-none",
          footerActionLink: "text-saffron hover:text-saffron-dark",
        },
      }}
    />
  );
}
