import Link from "next/link";
import { Quote } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-warm-canvas">
      {/* Left Side - Brand & Visuals (Hidden on mobile) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-deep-ink p-12 lg:flex">
        {/* Background Effects */}
        <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-saffron/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-[#3b82f6]/20 blur-[150px]" />
        <div className="absolute top-[40%] right-[20%] h-[300px] w-[300px] rounded-full bg-brand-amber/10 blur-[100px]" />

        {/* Dynamic Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Content */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="font-display text-4xl font-bold tracking-tight text-white">
              Piqd
            </span>
          </Link>
          <div className="mt-28">
            <h1 className="font-display text-[56px] font-bold leading-[1.1] text-white">
              Stop building in the dark.
              <br />
              <span className="text-saffron">Validate your idea</span> first.
            </h1>
            <p className="mt-6 max-w-md text-[18px] leading-relaxed text-white/70">
              Join the community of founders and validators shaping the future of Indian startups. Get real feedback, iterate fast, and build what people actually want.
            </p>
          </div>
        </div>

        {/* Footer Quote */}
        <div className="relative z-10 mt-auto">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
            <Quote className="mb-4 h-10 w-10 text-saffron/40" />
            <p className="text-[17px] italic leading-relaxed text-white/90">
              &ldquo;Piqd completely changed how I approach product development. I saved months of work by discovering what users actually cared about before writing a single line of code.&rdquo;
            </p>
            <div className="mt-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-saffron/20 text-[16px] font-bold text-saffron">
                A
              </div>
              <div>
                <p className="text-[15px] font-semibold text-white">Aditi S.</p>
                <p className="text-[13px] text-white/60">Validated 3 ideas on Piqd</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Forms */}
      <div className="flex w-full flex-col justify-center px-4 py-12 lg:w-1/2 sm:px-6 lg:px-8 xl:px-24 bg-white">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Logo */}
          <div className="mb-10 flex justify-center lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="font-display text-4xl font-bold tracking-tight text-deep-ink">
                Piqd
              </span>
            </Link>
          </div>

          <div className="flex flex-col items-center justify-center w-full">
            {children}
          </div>

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
      </div>
    </div>
  );
}
