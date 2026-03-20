"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  Lightbulb,
  Users,
  BarChart3,
  Rocket,
  Vote,
  TrendingUp,
  ChevronRight,
  MessageSquare,
  Eye,
  Share2,
  Star,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════
   ANIMATED COUNTER — counts up from 0 on viewport enter
   ═══════════════════════════════════════════════════ */
function AnimatedCounter({
  end,
  suffix = "",
  prefix = "",
  duration = 1500,
}: {
  end: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!inView) return;
    const startTime = Date.now();
    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, end, duration]);

  return (
    <span ref={ref} className="font-data text-[40px] font-bold leading-none text-saffron md:text-[48px]">
      {prefix}
      {count.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}

/* ═══════════════════════════════════════════════════
   HERO IDEA CARD — floating demo card in the hero
   ═══════════════════════════════════════════════════ */
function HeroIdeaCard() {
  return (
    <div className="relative">
      {/* Trending badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="absolute -top-3 right-4 z-10 flex items-center gap-1 rounded-full border border-brand-green/30 bg-brand-green-light px-2.5 py-1 text-[11px] font-medium text-brand-green"
      >
        <Zap className="h-3 w-3" /> Trending right now
      </motion.div>

      {/* Background card (peeking) */}
      <div
        className="absolute -bottom-3 left-3 right-3 h-full rounded-[16px] border border-warm-border bg-white shadow-card"
        style={{ transform: "rotate(1deg)" }}
      />

      {/* Main card */}
      <motion.div
        className="relative rounded-[16px] border border-warm-border bg-white p-4 shadow-elevated sm:p-6"
        style={{ transform: "rotate(-1.5deg)" }}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Card header */}
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-saffron-muted" />
          <span className="text-[13px] font-medium text-deep-ink">
            Priya S.
          </span>
          <span className="text-[11px] text-text-muted">&middot; 3h ago</span>
          <span className="ml-auto rounded-full border border-warm-border bg-warm-subtle px-2 py-0.5 text-[10px] font-medium text-text-secondary">
            Food
          </span>
        </div>

        {/* Title */}
        <h4 className="mt-3 text-[17px] font-bold leading-snug text-deep-ink">
          AI Tiffin Service for Hostel Students
        </h4>
        <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">
          Homemade food delivered to your hostel by local aunties, powered by AI matching
        </p>

        {/* Score */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border border-brand-green/25 bg-brand-green-light/60 px-1.5 py-0.5">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              className="-rotate-90"
            >
              <circle
                cx="8"
                cy="8"
                r="6"
                fill="none"
                stroke="#F4F2F0"
                strokeWidth="2"
              />
              <circle
                cx="8"
                cy="8"
                r="6"
                fill="none"
                stroke="#2CA87F"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 6}
                strokeDashoffset={2 * Math.PI * 6 - 0.72 * 2 * Math.PI * 6}
              />
            </svg>
            <span className="font-data text-[12px] font-medium text-brand-green">
              72
            </span>
          </div>
          <span className="rounded-full bg-warm-subtle px-2 py-0.5 text-[11px] font-medium text-text-secondary">
            Early Stage
          </span>
        </div>

        {/* Vote buttons (static demo) */}
        <div className="mt-3 flex flex-wrap gap-2">
          <div className="flex flex-1 items-center justify-center gap-1 rounded-md border-[1.5px] border-brand-green bg-brand-green-light py-2 text-[12px] font-medium text-brand-green">
            <span>🔥</span>
            <span className="hidden sm:inline">I&apos;d Use This</span>
            <span className="font-data">142</span>
          </div>
          <div className="flex flex-1 items-center justify-center gap-1 rounded-md border-[1.5px] border-warm-border bg-warm-subtle py-2 text-[12px] font-medium text-text-secondary">
            <span>🤔</span>
            <span className="font-data">38</span>
          </div>
          <div className="flex flex-1 items-center justify-center gap-1 rounded-md border-[1.5px] border-warm-border bg-warm-subtle py-2 text-[12px] font-medium text-text-secondary">
            <span>👎</span>
            <span className="font-data">21</span>
          </div>
        </div>

        {/* Meta */}
        <div className="mt-3 flex items-center gap-4 text-[11px] text-text-muted">
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" /> 23
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" /> 847
          </span>
          <span className="flex items-center gap-1">
            <Share2 className="h-3 w-3" /> 34
          </span>
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN LANDING PAGE
   ═══════════════════════════════════════════════════ */
export default function LandingPage() {
  const { isSignedIn } = useUser();

  return (
    <div className="bg-warm-canvas">
      {/* ════════════════════════════════════════════
          HERO SECTION
          ════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-warm-canvas to-warm-canvas" />

        <div className="relative mx-auto max-w-[1200px] px-4 pb-16 pt-16 md:px-8 md:pb-20 md:pt-24 lg:pb-24 lg:pt-28">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_420px] lg:gap-16">
            {/* Left column */}
            <div>
              {/* Eyebrow badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="inline-flex items-center gap-1.5 rounded-full bg-saffron-muted px-3 py-1.5 text-[12px] font-medium text-saffron">
                  <span>🇮🇳</span> Built for India&apos;s startup ecosystem
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mt-5 font-display text-[40px] leading-[1.05] tracking-tight text-deep-ink sm:text-[48px] md:text-[64px] lg:text-[72px]"
              >
                Validate your{" "}
                <br className="hidden sm:block" />
                startup idea.
                <br />
                <span className="font-display italic text-text-secondary" style={{ fontSize: "0.82em" }}>
                  Before you build anything.
                </span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-5 max-w-[480px] text-[16px] leading-[1.7] text-text-secondary md:text-[18px]"
              >
                Post your idea. 10,000+ real people vote.
                Get a validation score, honest feedback,
                and a path to your first investor.
              </motion.p>

              {/* CTA Row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-8 flex flex-wrap items-center gap-3"
              >
                {isSignedIn ? (
                  <Link href="/dashboard/ideas/new">
                    <Button
                      size="lg"
                      className="gap-2 bg-saffron px-7 text-[15px] font-semibold text-white shadow-saffron hover:bg-saffron-dark"
                    >
                      Post Your Idea — Free
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/sign-up">
                    <Button
                      size="lg"
                      className="gap-2 bg-saffron px-7 text-[15px] font-semibold text-white shadow-saffron hover:bg-saffron-dark"
                    >
                      Post Your Idea — Free
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
                <Link href="/explore">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-warm-border-strong text-[15px] font-medium text-deep-ink hover:bg-warm-hover"
                  >
                    Browse 500+ ideas
                  </Button>
                </Link>
              </motion.div>

              {/* Trust signal */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="mt-6 flex items-center gap-3"
              >
                {/* Stacked avatars */}
                <div className="flex -space-x-2">
                  {[
                    "bg-saffron-muted text-saffron",
                    "bg-brand-green-light text-brand-green",
                    "bg-brand-blue-light text-brand-blue",
                    "bg-brand-amber-light text-brand-amber",
                    "bg-warm-subtle text-text-secondary",
                  ].map((cls, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold",
                        cls
                      )}
                    >
                      {["P", "A", "R", "S", "K"][i]}
                    </div>
                  ))}
                </div>
                <span className="text-[13px] text-text-muted">
                  12,400+ founders & validators &middot; No credit card
                </span>
              </motion.div>
            </div>

            {/* Right column — floating idea card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden lg:block"
            >
              <HeroIdeaCard />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          STATS TICKER
          ════════════════════════════════════════════ */}
      <section className="border-y border-warm-border bg-warm-subtle">
        <div className="mx-auto flex max-w-[900px] flex-wrap items-center justify-between gap-4 px-4 py-6 md:gap-0 md:px-6 md:py-5">
          {[
            { end: 500, suffix: "+", label: "ideas validated" },
            { end: 12400, suffix: "+", label: "community members" },
            { end: 78, suffix: "%", label: "positive vote rate" },
            { end: 0, prefix: "\u20B9", suffix: "", label: "to get started" },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={cn(
                "flex flex-1 flex-col items-center gap-1",
                i < 3 && "md:border-r md:border-warm-border"
              )}
            >
              <AnimatedCounter
                end={stat.end}
                suffix={stat.suffix}
                prefix={stat.prefix}
              />
              <span className="text-[13px] text-text-secondary">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════
          HOW IT WORKS
          ════════════════════════════════════════════ */}
      <section className="bg-white py-20 md:py-24">
        <div className="mx-auto max-w-[1000px] px-4 md:px-8">
          {/* Section label */}
          <div className="text-center">
            <span className="font-data text-[11px] font-medium uppercase tracking-[0.15em] text-text-muted">
              THE PROCESS
            </span>
            <h2 className="mt-2 font-display text-[36px] leading-tight text-deep-ink md:text-[48px]">
              From idea to validation
              <br className="hidden sm:block" /> in minutes
            </h2>
          </div>

          {/* 3 Steps */}
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                step: "01",
                icon: Lightbulb,
                title: "Post your idea in 5 minutes",
                desc: "Fill a structured form. No pitch deck needed. Just describe the problem you\u2019re solving and who it\u2019s for.",
              },
              {
                step: "02",
                icon: Users,
                title: "Real people vote and comment",
                desc: "Thousands of validators discover your idea in the feed and tell you if they\u2019d actually use it.",
              },
              {
                step: "03",
                icon: BarChart3,
                title: "Get a score that means something",
                desc: "Our algorithm gives you a 0\u2013100 validation score based on real demand signals \u2014 not a friend\u2019s opinion.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative overflow-hidden rounded-[16px] border border-warm-border bg-warm-canvas p-8 transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover"
              >
                {/* Large background step number */}
                <span className="absolute -top-2 right-3 font-data text-[80px] font-bold leading-none text-saffron/[0.07]">
                  {item.step}
                </span>

                <item.icon
                  className="h-9 w-9 text-saffron"
                  strokeWidth={1.5}
                />
                <h3 className="mt-4 text-[17px] font-bold text-deep-ink">
                  {item.title}
                </h3>
                <p className="mt-2 text-[14px] leading-[1.7] text-text-secondary">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          BUILT FOR EVERYONE
          ════════════════════════════════════════════ */}
      <section className="bg-warm-canvas py-20 md:py-24">
        <div className="mx-auto max-w-[1100px] px-4 md:px-8">
          <div className="text-center">
            <h2 className="font-display text-[36px] leading-tight text-deep-ink md:text-[48px]">
              Built for everyone
              <br className="hidden sm:block" /> in the ecosystem
            </h2>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                eyebrow: "FOR FOUNDERS",
                icon: Rocket,
                title: "Get your idea out of your head",
                bullets:
                  "Post in 5 min \u00B7 Real validation score \u00B7 Shareable cards \u00B7 Attract investors",
                cta: "Post your idea",
                href: "/dashboard/ideas/new",
              },
              {
                eyebrow: "FOR EVERYONE",
                icon: Vote,
                title: "Have a say in what gets built",
                bullets:
                  "Vote on ideas \u00B7 Earn badges \u00B7 Top the leaderboard \u00B7 Be first to spot the next big thing",
                cta: "Start exploring",
                href: "/explore",
              },
              {
                eyebrow: "FOR INVESTORS",
                icon: TrendingUp,
                title: "Deal flow backed by real demand",
                bullets:
                  "Curated validated ideas \u00B7 Voter demographics \u00B7 Compare ideas \u00B7 Connect with founders",
                cta: "Learn more",
                href: "/explore",
              },
            ].map((card, i) => (
              <motion.div
                key={card.eyebrow}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group rounded-[16px] border border-warm-border bg-white p-7 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover"
              >
                <span className="font-data text-[11px] font-medium uppercase tracking-[0.15em] text-saffron">
                  {card.eyebrow}
                </span>
                <card.icon
                  className="mt-3 h-8 w-8 text-saffron"
                  strokeWidth={1.5}
                />
                <h3 className="mt-3 text-[18px] font-bold text-deep-ink">
                  {card.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-text-secondary">
                  {card.bullets}
                </p>
                <Link
                  href={card.href}
                  className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-saffron transition-colors hover:text-saffron-dark"
                >
                  {card.cta}
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          TESTIMONIALS
          ════════════════════════════════════════════ */}
      <section className="overflow-hidden bg-white py-20 md:py-24">
        <div className="mx-auto max-w-[1200px] px-4 md:px-8">
          <div className="text-center">
            <h2 className="font-display text-[36px] leading-tight text-deep-ink md:text-[48px]">
              What the community says
            </h2>
          </div>

          {/* Testimonial cards */}
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                quote:
                  "I was building in stealth for 6 months. Posted here, got 200 votes in a week. Turns out people actually want this.",
                name: "Arjun M.",
                role: "Founder",
                idea: "AI Tiffin Service",
              },
              {
                quote:
                  "As a student, I love discovering what other young Indians are building. Voted on 50+ ideas this month!",
                name: "Sneha R.",
                role: "Validator",
                idea: "Voted on 53 ideas",
              },
              {
                quote:
                  "The validation score gave me confidence to pitch my idea. Got a pre-seed meeting the same week.",
                name: "Karthik P.",
                role: "Founder",
                idea: "Score: 81/100",
              },
            ].map((testimonial, i) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative rounded-[16px] border border-warm-border bg-white p-6 shadow-card"
              >
                {/* Quote mark */}
                <span className="absolute -top-2 left-5 font-display text-[56px] leading-none text-saffron/20">
                  &ldquo;
                </span>

                <p className="mt-4 text-[14px] italic leading-[1.7] text-deep-ink">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>

                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-warm-subtle text-[13px] font-semibold text-text-secondary">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <span className="block text-[13px] font-medium text-deep-ink">
                      {testimonial.name}
                    </span>
                    <span className="text-[11px] text-text-muted">
                      {testimonial.role} &middot; {testimonial.idea}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          FINAL CTA
          ════════════════════════════════════════════ */}
      <section className="bg-warm-canvas py-20 md:py-24">
        <div className="mx-auto max-w-[600px] px-4 text-center md:px-8">
          <h2 className="font-display text-[36px] leading-tight text-deep-ink md:text-[48px]">
            Ready to validate
            <br />
            <span className="italic">your idea?</span>
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-text-secondary">
            Join 12,400+ founders and validators building
            India&apos;s startup ecosystem together.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {isSignedIn ? (
              <Link href="/dashboard/ideas/new">
                <Button
                  size="lg"
                  className="gap-2 bg-saffron px-8 text-[15px] font-semibold text-white shadow-saffron hover:bg-saffron-dark"
                >
                  Post Your Idea — Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="gap-2 bg-saffron px-8 text-[15px] font-semibold text-white shadow-saffron hover:bg-saffron-dark"
                >
                  Get Started — Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <Link href="/explore">
              <Button
                variant="outline"
                size="lg"
                className="border-warm-border-strong text-[15px] font-medium text-deep-ink hover:bg-warm-hover"
              >
                Explore Ideas
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
