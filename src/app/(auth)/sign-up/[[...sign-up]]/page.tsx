import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <SignUp
      fallbackRedirectUrl="/api/sync-onboarding"
      appearance={{
        elements: {
          rootBox: "w-full mx-auto flex justify-center",
          card: "w-full shadow-none border-0 bg-transparent rounded-none p-0 mx-0",
          headerTitle: "font-display text-3xl text-deep-ink font-bold",
          headerSubtitle: "text-text-secondary text-[15px]",
          socialButtonsBlockButton:
            "border-warm-border bg-white text-deep-ink hover:bg-warm-hover h-11",
          formButtonPrimary:
            "bg-saffron hover:bg-saffron-dark text-white shadow-none h-11 text-[15px] font-medium",
          footerActionLink: "text-saffron hover:text-saffron-dark font-medium",
          formFieldInput: "h-11 rounded-lg border-warm-border focus:ring-saffron focus:border-saffron",
          formFieldLabel: "text-deep-ink font-medium text-[13px]",
          dividerLine: "bg-warm-border",
          dividerText: "text-text-muted text-[13px]",
          identityPreviewText: "text-deep-ink",
          identityPreviewEditButtonIcon: "text-saffron",
        },
      }}
    />
  );
}
