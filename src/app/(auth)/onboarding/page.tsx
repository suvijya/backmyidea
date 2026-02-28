"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  User,
  MapPin,
  Briefcase,
  GraduationCap,
  Linkedin,
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { completeOnboarding } from "@/actions/user-actions";
import {
  MIN_USERNAME_LENGTH,
  MAX_USERNAME_LENGTH,
  MAX_BIO_LENGTH,
} from "@/lib/constants";
import type { UserRole } from "@prisma/client";

const STEPS = [
  { id: "role", title: "How do you want to use BackMyIdea?" },
  { id: "username", title: "Choose your username" },
  { id: "details", title: "Tell us about yourself" },
] as const;

const ROLES: { value: UserRole; title: string; desc: string; emoji: string }[] = [
  {
    value: "FOUNDER",
    title: "Founder",
    desc: "I want to post and validate my startup ideas",
    emoji: "🚀",
  },
  {
    value: "EXPLORER",
    title: "Explorer",
    desc: "I want to discover and vote on ideas",
    emoji: "🔍",
  },
  {
    value: "BOTH",
    title: "Both",
    desc: "I want to post ideas and vote on others",
    emoji: "⚡",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState(0);
  const [role, setRole] = useState<UserRole | "">("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [college, setCollege] = useState("");
  const [company, setCompany] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  const checkUsername = useCallback(
    async (value: string) => {
      if (value.length < MIN_USERNAME_LENGTH) {
        setUsernameStatus("idle");
        return;
      }
      setUsernameStatus("checking");
      try {
        const res = await fetch(
          `/api/users/check-username?username=${encodeURIComponent(value)}`
        );
        const data = await res.json();
        setUsernameStatus(data.available ? "available" : "taken");
      } catch {
        setUsernameStatus("idle");
      }
    },
    []
  );

  const canProceed = () => {
    if (step === 0) return role !== "";
    if (step === 1) return username.length >= MIN_USERNAME_LENGTH && usernameStatus === "available";
    return true;
  };

  const handleSubmit = () => {
    if (!canProceed()) return;

    startTransition(async () => {
      const fd = new FormData();
      fd.append("username", username);
      fd.append("role", role);
      fd.append("bio", bio);
      fd.append("city", city);
      fd.append("state", state);
      fd.append("college", college);
      fd.append("company", company);
      fd.append("linkedinUrl", linkedinUrl);

      const result = await completeOnboarding(fd);
      if (result.success) {
        toast.success("Welcome to BackMyIdea!");
        router.push("/explore");
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="w-full max-w-lg">
      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-semibold transition-colors",
                i < step
                  ? "bg-brand-green text-white"
                  : i === step
                    ? "bg-saffron text-white"
                    : "bg-warm-subtle text-text-muted"
              )}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-[2px] w-8 rounded-full transition-colors",
                  i < step ? "bg-brand-green" : "bg-warm-border"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step title */}
      <h1 className="mb-1 text-center font-display text-[28px] leading-tight text-deep-ink">
        {STEPS[step].title}
      </h1>
      <p className="mb-8 text-center text-[14px] text-text-secondary">
        {step === 0 && "This helps us personalize your experience"}
        {step === 1 && "This is how others will find you"}
        {step === 2 && "Optional — you can always add this later"}
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Step 0: Role selection */}
          {step === 0 && (
            <div className="space-y-3">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-xl border-[1.5px] p-4 text-left transition-all",
                    role === r.value
                      ? "border-saffron bg-saffron-light shadow-sm"
                      : "border-warm-border bg-white hover:border-warm-border-strong hover:shadow-sm"
                  )}
                >
                  <span className="text-2xl">{r.emoji}</span>
                  <div>
                    <p className="text-[15px] font-semibold text-deep-ink">{r.title}</p>
                    <p className="text-[13px] text-text-secondary">{r.desc}</p>
                  </div>
                  {role === r.value && (
                    <Check className="ml-auto h-5 w-5 text-saffron" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Step 1: Username */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="username" className="text-[13px] font-medium text-deep-ink">
                  Username
                </Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-text-muted">
                    @
                  </span>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, "");
                      setUsername(val);
                      checkUsername(val);
                    }}
                    maxLength={MAX_USERNAME_LENGTH}
                    placeholder="yourname"
                    className="pl-8 input-focus-ring"
                  />
                  {usernameStatus === "checking" && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-text-muted" />
                  )}
                  {usernameStatus === "available" && (
                    <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-green" />
                  )}
                </div>
                {usernameStatus === "taken" && (
                  <p className="mt-1 text-[12px] text-brand-red">
                    This username is already taken
                  </p>
                )}
                {usernameStatus === "available" && (
                  <p className="mt-1 text-[12px] text-brand-green">
                    Username is available
                  </p>
                )}
                <p className="mt-1 text-[12px] text-text-muted">
                  {MIN_USERNAME_LENGTH}-{MAX_USERNAME_LENGTH} characters, letters, numbers, underscores
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="bio" className="text-[13px] font-medium text-deep-ink">
                  <User className="mr-1 inline h-3.5 w-3.5" />
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={MAX_BIO_LENGTH}
                  placeholder="What are you working on or passionate about?"
                  className="mt-1.5 resize-none input-focus-ring"
                  rows={3}
                />
                <p className="mt-1 text-right text-[11px] text-text-muted">
                  {bio.length}/{MAX_BIO_LENGTH}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="city" className="text-[13px] font-medium text-deep-ink">
                    <MapPin className="mr-1 inline h-3.5 w-3.5" />
                    City
                  </Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Mumbai"
                    className="mt-1.5 input-focus-ring"
                  />
                </div>
                <div>
                  <Label htmlFor="state" className="text-[13px] font-medium text-deep-ink">
                    State
                  </Label>
                  <Input
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Maharashtra"
                    className="mt-1.5 input-focus-ring"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="college" className="text-[13px] font-medium text-deep-ink">
                  <GraduationCap className="mr-1 inline h-3.5 w-3.5" />
                  College / University
                </Label>
                <Input
                  id="college"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="IIT Bombay"
                  className="mt-1.5 input-focus-ring"
                />
              </div>

              <div>
                <Label htmlFor="company" className="text-[13px] font-medium text-deep-ink">
                  <Briefcase className="mr-1 inline h-3.5 w-3.5" />
                  Company
                </Label>
                <Input
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Zerodha, Razorpay, etc."
                  className="mt-1.5 input-focus-ring"
                />
              </div>

              <div>
                <Label htmlFor="linkedin" className="text-[13px] font-medium text-deep-ink">
                  <Linkedin className="mr-1 inline h-3.5 w-3.5" />
                  LinkedIn URL
                </Label>
                <Input
                  id="linkedin"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/yourname"
                  className="mt-1.5 input-focus-ring"
                />
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="mt-8 flex items-center justify-between">
        {step > 0 ? (
          <Button
            variant="outline"
            onClick={() => setStep((s) => s - 1)}
            className="gap-1.5 border-warm-border text-text-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        ) : (
          <div />
        )}

        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            className="gap-1.5 bg-saffron text-white hover:bg-saffron-dark disabled:opacity-50"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="gap-1.5 bg-saffron text-white hover:bg-saffron-dark disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                Get Started
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
