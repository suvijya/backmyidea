"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  Save,
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
import { cn } from "@/lib/utils";
import { updateIdea } from "@/actions/idea-actions";
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
import type { Idea, Category, IdeaStage, TargetAudience } from "@prisma/client";

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [Category, string][];
const STAGES = Object.entries(STAGE_LABELS) as [IdeaStage, string][];
const AUDIENCES = Object.entries(TARGET_AUDIENCE_LABELS) as [TargetAudience, string][];

interface EditIdeaFormProps {
  idea: Idea;
}

export function EditIdeaForm({ idea }: EditIdeaFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(idea.title);
  const [pitch, setPitch] = useState(idea.pitch);
  const [problem, setProblem] = useState(idea.problem);
  const [solution, setSolution] = useState(idea.solution);
  const [category, setCategory] = useState<Category>(idea.category as Category);
  const [stage, setStage] = useState<IdeaStage>(idea.stage as IdeaStage);
  const [targetAudience, setTargetAudience] = useState<TargetAudience[]>(
    idea.targetAudience as TargetAudience[]
  );
  const [feedbackQuestion, setFeedbackQuestion] = useState(
    idea.feedbackQuestion ?? ""
  );
  const [linkUrl, setLinkUrl] = useState(idea.linkUrl ?? "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(idea.tags);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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

      const result = await updateIdea(idea.id, fd);

      if (result.success) {
        toast.success("Idea updated!");
        router.push(`/idea/${result.data.slug}`);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      {/* Title */}
      <div>
        <Label htmlFor="title" className="text-[13px] font-semibold text-deep-ink">
          Idea Title *
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={MAX_TITLE_LENGTH}
          className="mt-1.5 input-focus-ring"
          required
        />
        <p className="mt-1 text-right text-[11px] text-text-muted">
          {title.length}/{MAX_TITLE_LENGTH}
        </p>
      </div>

      {/* Pitch */}
      <div>
        <Label htmlFor="pitch" className="text-[13px] font-semibold text-deep-ink">
          One-Line Pitch *
        </Label>
        <Textarea
          id="pitch"
          value={pitch}
          onChange={(e) => setPitch(e.target.value)}
          maxLength={MAX_PITCH_LENGTH}
          rows={2}
          className="mt-1.5 resize-none input-focus-ring"
          required
        />
        <p className="mt-1 text-right text-[11px] text-text-muted">
          {pitch.length}/{MAX_PITCH_LENGTH}
        </p>
      </div>

      {/* Category & Stage */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label className="text-[13px] font-semibold text-deep-ink">Category *</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
            <SelectTrigger className="mt-1.5 input-focus-ring">
              <SelectValue />
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
          <Label className="text-[13px] font-semibold text-deep-ink">Stage *</Label>
          <Select value={stage} onValueChange={(v) => setStage(v as IdeaStage)}>
            <SelectTrigger className="mt-1.5 input-focus-ring">
              <SelectValue />
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

      {/* Problem */}
      <div>
        <Label htmlFor="problem" className="text-[13px] font-semibold text-deep-ink">
          The Problem *
        </Label>
        <Textarea
          id="problem"
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          maxLength={MAX_PROBLEM_LENGTH}
          rows={4}
          className="mt-1.5 resize-none input-focus-ring"
          required
        />
        <p className="mt-1 text-right text-[11px] text-text-muted">
          {problem.length}/{MAX_PROBLEM_LENGTH}
        </p>
      </div>

      {/* Solution */}
      <div>
        <Label htmlFor="solution" className="text-[13px] font-semibold text-deep-ink">
          Your Solution *
        </Label>
        <Textarea
          id="solution"
          value={solution}
          onChange={(e) => setSolution(e.target.value)}
          maxLength={MAX_SOLUTION_LENGTH}
          rows={4}
          className="mt-1.5 resize-none input-focus-ring"
          required
        />
        <p className="mt-1 text-right text-[11px] text-text-muted">
          {solution.length}/{MAX_SOLUTION_LENGTH}
        </p>
      </div>

      {/* Target Audience */}
      <div>
        <Label className="text-[13px] font-semibold text-deep-ink">
          Target Audience *
        </Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {AUDIENCES.map(([key, label]) => (
            <button
              key={key}
              type="button"
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

      {/* Feedback Question */}
      <div>
        <Label htmlFor="feedback" className="text-[13px] font-semibold text-deep-ink">
          Question for Validators
        </Label>
        <Textarea
          id="feedback"
          value={feedbackQuestion}
          onChange={(e) => setFeedbackQuestion(e.target.value)}
          maxLength={MAX_FEEDBACK_QUESTION_LENGTH}
          rows={2}
          placeholder="e.g., Would you pay for this?"
          className="mt-1.5 resize-none input-focus-ring"
        />
      </div>

      {/* Link */}
      <div>
        <Label htmlFor="link" className="text-[13px] font-semibold text-deep-ink">
          Link
        </Label>
        <Input
          id="link"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder="https://"
          className="mt-1.5 input-focus-ring"
        />
      </div>

      {/* Tags */}
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
                  type="button"
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

      {/* Submit */}
      <div className="flex items-center justify-between border-t border-warm-border pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="border-warm-border text-text-secondary"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={
            isPending ||
            !title.trim() ||
            !pitch.trim() ||
            !problem.trim() ||
            !solution.trim() ||
            targetAudience.length === 0
          }
          className="gap-1.5 bg-saffron text-white hover:bg-saffron-dark"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
