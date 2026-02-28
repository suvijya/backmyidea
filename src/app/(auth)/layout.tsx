import { Lightbulb } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-warm-canvas px-4 py-12">
      {/* Logo */}
      <Link href="/" className="mb-8 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-saffron">
          <Lightbulb className="h-5 w-5 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-xl font-bold tracking-tight text-deep-ink">
          BackMyIdea
        </span>
      </Link>

      {children}

      {/* Footer link */}
      <p className="mt-8 text-center text-[13px] text-text-muted">
        By continuing, you agree to our{" "}
        <Link href="/terms" className="text-saffron underline-offset-2 hover:underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-saffron underline-offset-2 hover:underline">
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}
