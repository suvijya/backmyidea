"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  Lightbulb,
  Target,
  Sparkles,
  AlertTriangle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { createIdea } from "@/actions/idea-actions";
import {
  CATEGORY_LABELS,
  CATEGORY_EMOJIS,
  STAGE_LABELS,
  TARGET_AUDIENCE_LABELS,
  MAX_TITLE_LENGTH,
  MAX_PITCH_LENGTH,
  MAX_PROBLEM_LENGTH,
  MAX_SOLUTION_LENGTH,
  MAX_FEEDBACK_QUESTION_LENGTH,
  MAX_TAGS,
} from "@/lib/constants";
import type { Category, IdeaStage, TargetAudience } from "@prisma/client";

const STEPS = [
  { id: "basics", title: "The Basics", icon: Lightbulb },
  { id: "details", title: "The Details", icon: Target },
  { id: "extras", title: "Final Touches", icon: Sparkles },
] as const;

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [Category, string][];
const STAGES = Object.entries(STAGE_LABELS) as [IdeaStage, string][];
const AUDIENCES = Object.entries(TARGET_AUDIENCE_LABELS) as [TargetAudience, string][];

export default function NewIdeaPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState(0);

  // Form state
  const [title, setTitle] = useState("");
  const [pitch, setPitch] = useState("");
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [stage, setStage] = useState<IdeaStage | "">("");
  const [targetAudience, setTargetAudience] = useState<TargetAudience[]>([]);
  const [feedbackQuestion, setFeedbackQuestion] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [donationsEnabled, setDonationsEnabled] = useState(false);

  // AI feedback state
  const [qualityWarning, setQualityWarning] = useState<string[] | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<{ title: string; slug: string }[] | null>(null);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);

  const toggleAudience = (aud: TargetAudience) => {
    setTargetAudience((prev) =>
      prev.includes(aud) ? prev.filter((a) => a !== aud) : [...prev, aud]
    );
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < MAX_TAGS) {
      setTags((prev) => [...prev, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const canProceed = () => {
    if (step === 0) {
      return title.trim().length > 0 && pitch.trim().length > 0 && category !== "" && stage !== "";
    }
    if (step === 1) {
      return problem.trim().length > 0 && solution.trim().length > 0 && targetAudience.length > 0;
    }
    return true;
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("pitch", pitch.trim());
      fd.append("problem", problem.trim());
      fd.append("solution", solution.trim());
      fd.append("category", category);
      fd.append("stage", stage);
      for (const aud of targetAudience) {
        fd.append("targetAudience", aud);
      }
      fd.append("feedbackQuestion", feedbackQuestion.trim());
      fd.append("linkUrl", linkUrl.trim());
      for (const tag of tags) {
        fd.append("tags", tag);
      }
      fd.append("donationsEnabled", donationsEnabled ? "true" : "false");

      const result = await createIdea(fd);

      if (result.success) {
        const idea = result.data;
        const hasQualityWarning =
          idea.qualityResult &&
          idea.qualityResult.score < 30 &&
          idea.qualityResult.feedback.length > 0;
        const hasDuplicateWarning =
          idea.duplicateResult?.isDuplicate &&
          idea.duplicateResult.similarIdeas.length > 0;

        if (hasQualityWarning || hasDuplicateWarning) {
          // Show warnings before navigating
          if (hasQualityWarning) {
            setQualityWarning(idea.qualityResult!.feedback);
          }
          if (hasDuplicateWarning) {
            setDuplicateWarning(
              idea.duplicateResult!.similarIdeas.map((s) => ({
                title: s.title,
                slug: s.slug,
              }))
            );
          }
          setPublishedSlug(idea.slug);
          toast.success("Idea published! Review the suggestions below.");
        } else {
          toast.success("Idea published!");
          router.push(`/idea/${idea.slug}`);
        }
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Published with AI warnings */}
      {publishedSlug && (qualityWarning || duplicateWarning) ? (
        <div className="space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-green-light">
              <Check className="h-6 w-6 text-brand-green" />
            </div>
            <h1 className="font-display text-[28px] leading-tight text-deep-ink">
              Idea Published!
            </h1>
            <p className="mt-1 text-[14px] text-text-secondary">
              Your idea is live. Our AI flagged a few things to consider.
            </p>
          </div>

          {/* Quality warnings */}
          {qualityWarning && qualityWarning.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <h3 className="text-[14px] font-semibold text-amber-800">
                  Quality Suggestions
                </h3>
              </div>
              <ul className="space-y-1.5">
                {qualityWarning.map((feedback, i) => (
                  <li
                    key={i}
                    className="text-[13px] text-amber-700 before:mr-2 before:content-['•']"
                  >
                    {feedback}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[12px] text-amber-600">
                You can edit your idea to address these suggestions.
              </p>
            </div>
          )}

          {/* Duplicate warnings */}
          {duplicateWarning && duplicateWarning.length > 0 && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <h3 className="text-[14px] font-semibold text-blue-800">
                  Similar Ideas Found
                </h3>
              </div>
              <p className="mb-2 text-[13px] text-blue-700">
                We found ideas that look similar to yours. Consider how yours is
                different:
              </p>
              <ul className="space-y-1.5">
                {duplicateWarning.map((idea) => (
                  <li key={idea.slug}>
                    <a
                      href={`/idea/${idea.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] font-medium text-blue-700 underline underline-offset-2 hover:text-blue-900"
                    >
                      {idea.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/ideas`)}
              className="flex-1 border-warm-border text-text-secondary"
            >
              Go to Dashboard
            </Button>
            <Button
              onClick={() => router.push(`/idea/${publishedSlug}`)}
              className="flex-1 gap-1.5 bg-saffron text-white hover:bg-saffron-dark"
            >
              <Sparkles className="h-4 w-4" />
              View Your Idea
            </Button>
          </div>
        </div>
      ) : (
      <>
      {/* Header */}
      <h1 className="font-display text-[28px] leading-tight text-deep-ink">
        Submit Your Idea
      </h1>
      <p className="mt-1 text-[14px] text-text-secondary">
        Describe your startup idea and get it validated by real people.
      </p>

      {/* Step indicator */}
      <div className="mt-6 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <button
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
                i < step
                  ? "bg-brand-green-light text-brand-green"
                  : i === step
                    ? "bg-saffron-light text-saffron"
                    : "bg-warm-subtle text-text-muted"
              )}
            >
              {i < step ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <s.icon className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">{s.title}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-[2px] w-6 rounded-full",
                  i < step ? "bg-brand-green" : "bg-warm-border"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form steps */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="mt-8"
        >
          {/* Step 0: Basics */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <Label htmlFor="title" className="text-[13px] font-semibold text-deep-ink">
                  Idea Title *
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={MAX_TITLE_LENGTH}
                  placeholder="e.g., AI-Powered Tiffin Service for Hostels"
                  className="mt-1.5 input-focus-ring"
                />
                <p className="mt-1 text-right text-[11px] text-text-muted">
                  {title.length}/{MAX_TITLE_LENGTH}
                </p>
              </div>

              <div>
                <Label htmlFor="pitch" className="text-[13px] font-semibold text-deep-ink">
                  One-Line Pitch *
                </Label>
                <Textarea
                  id="pitch"
                  value={pitch}
                  onChange={(e) => setPitch(e.target.value)}
                  maxLength={MAX_PITCH_LENGTH}
                  placeholder="Explain your idea in one sentence. What does it do and for whom?"
                  rows={2}
                  className="mt-1.5 resize-none input-focus-ring"
                />
                <p className="mt-1 text-right text-[11px] text-text-muted">
                  {pitch.length}/{MAX_PITCH_LENGTH}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-[13px] font-semibold text-deep-ink">
                    Category *
                  </Label>
                  <Select
                    value={category}
                    onValueChange={(v) => setCategory(v as Category)}
                  >
                    <SelectTrigger className="mt-1.5 input-focus-ring">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {CATEGORY_EMOJIS[key]} {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[13px] font-semibold text-deep-ink">
                    Stage *
                  </Label>
                  <Select
                    value={stage}
                    onValueChange={(v) => setStage(v as IdeaStage)}
                  >
                    <SelectTrigger className="mt-1.5 input-focus-ring">
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Details */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <Label htmlFor="problem" className="text-[13px] font-semibold text-deep-ink">
                  The Problem *
                </Label>
                <p className="text-[12px] text-text-muted">
                  What pain point or gap are you addressing?
                </p>
                <Textarea
                  id="problem"
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  maxLength={MAX_PROBLEM_LENGTH}
                  placeholder="Describe the problem clearly. Who faces it? How big is it?"
                  rows={4}
                  className="mt-1.5 resize-none input-focus-ring"
                />
                <p className="mt-1 text-right text-[11px] text-text-muted">
                  {problem.length}/{MAX_PROBLEM_LENGTH}
                </p>
              </div>

              <div>
                <Label htmlFor="solution" className="text-[13px] font-semibold text-deep-ink">
                  Your Solution *
                </Label>
                <p className="text-[12px] text-text-muted">
                  How does your idea solve this problem?
                </p>
                <Textarea
                  id="solution"
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  maxLength={MAX_SOLUTION_LENGTH}
                  placeholder="Describe your approach. What makes it unique?"
                  rows={4}
                  className="mt-1.5 resize-none input-focus-ring"
                />
                <p className="mt-1 text-right text-[11px] text-text-muted">
                  {solution.length}/{MAX_SOLUTION_LENGTH}
                </p>
              </div>

              <div>
                <Label className="text-[13px] font-semibold text-deep-ink">
                  Target Audience *
                </Label>
                <p className="mb-2 text-[12px] text-text-muted">
                  Select all that apply
                </p>
                <div className="flex flex-wrap gap-2">
                  {AUDIENCES.map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => toggleAudience(key)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors",
                        targetAudience.includes(key)
                          ? "border-saffron bg-saffron-light text-saffron"
                          : "border-warm-border bg-white text-text-secondary hover:border-warm-border-strong"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Extras */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <Label htmlFor="feedback" className="text-[13px] font-semibold text-deep-ink">
                  Question for Validators
                </Label>
                <p className="text-[12px] text-text-muted">
                  Ask voters a specific question to get targeted feedback
                </p>
                <Textarea
                  id="feedback"
                  value={feedbackQuestion}
                  onChange={(e) => setFeedbackQuestion(e.target.value)}
                  maxLength={MAX_FEEDBACK_QUESTION_LENGTH}
                  placeholder="e.g., Would you pay ₹99/month for this?"
                  rows={2}
                  className="mt-1.5 resize-none input-focus-ring"
                />
              </div>

              <div>
                <Label htmlFor="link" className="text-[13px] font-semibold text-deep-ink">
                  Link
                </Label>
                <p className="text-[12px] text-text-muted">
                  Landing page, prototype, or demo link
                </p>
                <Input
                  id="link"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://"
                  className="mt-1.5 input-focus-ring"
                />
              </div>

              <div>
                <Label className="text-[13px] font-semibold text-deep-ink">
                  Tags (up to {MAX_TAGS})
                </Label>
                <div className="mt-1.5 flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Type and press Enter"
                    className="input-focus-ring"
                    disabled={tags.length >= MAX_TAGS}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addTag}
                    disabled={tags.length >= MAX_TAGS || !tagInput.trim()}
                    className="border-warm-border"
                  >
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="gap-1 bg-warm-subtle text-text-secondary"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-0.5 rounded-full hover:bg-warm-hover"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Donations toggle */}
              <div className="flex items-center justify-between rounded-xl border border-warm-border bg-white p-4">
                <div>
                  <Label htmlFor="donations" className="text-[13px] font-semibold text-deep-ink">
                    Accept Donations
                  </Label>
                  <p className="text-[12px] text-text-muted">
                    Let supporters back your idea with micro-donations
                  </p>
                </div>
                <Switch
                  id="donations"
                  checked={donationsEnabled}
                  onCheckedChange={setDonationsEnabled}
                  className="data-[state=checked]:bg-saffron"
                />
              </div>

              {/* Preview summary */}
              <div className="rounded-xl border border-warm-border bg-warm-subtle/50 p-5">
                <h3 className="text-[13px] font-bold uppercase tracking-wide text-text-muted">
                  Preview
                </h3>
                <div className="mt-3 space-y-2">
                  <p className="text-[17px] font-bold text-deep-ink">{title}</p>
                  <p className="text-[14px] text-text-secondary">{pitch}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-warm-subtle px-2 py-0.5 text-[11px] font-medium text-text-secondary">
                      {category && CATEGORY_EMOJIS[category as Category]}{" "}
                      {category && CATEGORY_LABELS[category as Category]}
                    </span>
                    <span className="rounded-full bg-warm-subtle px-2 py-0.5 text-[11px] font-medium text-text-secondary">
                      {stage && STAGE_LABELS[stage as IdeaStage]}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between border-t border-warm-border pt-6">
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
            disabled={isPending || !canProceed()}
            className="gap-1.5 bg-saffron text-white hover:bg-saffron-dark disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Publish Idea
              </>
            )}
          </Button>
        )}
      </div>
      </>
      )}
    </div>
  );
}
