"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Briefcase,
  Linkedin,
  Globe,
  FileText,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { submitInvestorRequest, getMyInvestorStatus } from "@/actions/investor-actions";
import {
  CATEGORY_LABELS,
  INVESTOR_STAGE_LABELS,
} from "@/lib/constants";
import type { Category, InvestorStagePreference, InvestorRequestStatus } from "@prisma/client";

type InvestorStatus = {
  hasProfile: boolean;
  hasPendingRequest: boolean;
  lastRequestStatus: InvestorRequestStatus | null;
};

export default function InvestorApplyPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<InvestorStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [firmName, setFirmName] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [investmentThesis, setInvestmentThesis] = useState("");
  const [sectorInterests, setSectorInterests] = useState<Category[]>([]);
  const [stagePreference, setStagePreference] = useState<InvestorStagePreference>("ANY");
  const [ticketSizeMin, setTicketSizeMin] = useState("");
  const [ticketSizeMax, setTicketSizeMax] = useState("");
  const [portfolioCompanies, setPortfolioCompanies] = useState("");
  const [website, setWebsite] = useState("");

  useEffect(() => {
    getMyInvestorStatus().then((result) => {
      if (result.success) {
        setStatus(result.data);
        // If already approved, redirect to dashboard
        if (result.data.hasProfile) {
          router.replace("/investor");
        }
      }
      setLoading(false);
    });
  }, [router]);

  const toggleSector = (category: Category) => {
    setSectorInterests((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleSubmit = () => {
    if (!linkedinUrl || !investmentThesis || sectorInterests.length === 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.append("firmName", firmName);
      fd.append("linkedinUrl", linkedinUrl);
      fd.append("investmentThesis", investmentThesis);
      for (const s of sectorInterests) {
        fd.append("sectorInterests", s);
      }
      fd.append("stagePreference", stagePreference);
      if (ticketSizeMin) fd.append("ticketSizeMin", ticketSizeMin);
      if (ticketSizeMax) fd.append("ticketSizeMax", ticketSizeMax);
      fd.append("portfolioCompanies", portfolioCompanies);
      fd.append("website", website);

      const result = await submitInvestorRequest(fd);
      if (result.success) {
        toast.success("Application submitted! We'll review it shortly.");
        setStatus({
          hasProfile: false,
          hasPendingRequest: true,
          lastRequestStatus: "PENDING",
        });
      } else {
        toast.error(result.error);
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
      </div>
    );
  }

  // If already has a profile — should have been redirected, but just in case
  if (status?.hasProfile) {
    return (
      <div className="mx-auto max-w-lg px-1 py-12 text-center">
        <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-brand-green" />
        <h1 className="mb-2 font-display text-[24px] text-deep-ink sm:text-[28px]">
          You&apos;re Approved
        </h1>
        <p className="mb-6 text-[13px] text-text-secondary sm:text-[14px]">
          You already have investor access. Head to your dashboard.
        </p>
        <Button
          onClick={() => router.push("/investor")}
          className="w-full bg-saffron text-white hover:bg-saffron-dark sm:w-auto"
        >
          Go to Dashboard
        </Button>
      </div>
    );
  }

  // If has a pending request
  if (status?.hasPendingRequest) {
    return (
      <div className="mx-auto max-w-lg px-1 py-12 text-center">
        <Clock className="mx-auto mb-4 h-12 w-12 text-brand-amber" />
        <h1 className="mb-2 font-display text-[24px] text-deep-ink sm:text-[28px]">
          Application Under Review
        </h1>
        <p className="mb-6 text-[13px] text-text-secondary sm:text-[14px]">
          We&apos;re reviewing your investor access request. You&apos;ll receive a notification once it&apos;s been reviewed.
        </p>
        <Button
          variant="outline"
          onClick={() => router.push("/explore")}
          className="w-full border-warm-border text-text-secondary sm:w-auto"
        >
          Explore Ideas
        </Button>
      </div>
    );
  }

  // If previously rejected, show message + allow reapply
  if (status?.lastRequestStatus === "REJECTED") {
    // Show form with rejection notice at top
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="mb-2 font-display text-[24px] leading-tight text-deep-ink sm:text-[32px]">
          Investor Access
        </h1>
        <p className="max-w-2xl text-[13px] leading-relaxed text-text-secondary sm:text-[14px]">
          Get early access to validated startup ideas, curated deal flow, and
          tools to track promising ventures. Applications are reviewed within
          48 hours.
        </p>
      </div>

      {status?.lastRequestStatus === "REJECTED" && (
        <div className="mb-6 rounded-xl border border-brand-red/20 bg-brand-red-light px-4 py-3">
          <div className="flex items-start gap-2">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-red" />
            <div>
              <p className="text-[13px] font-medium text-brand-red">
                Previous application was not approved
              </p>
              <p className="mt-0.5 text-[12px] text-text-secondary">
                You can submit a new application with updated information.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form — two-column on desktop, single-column on mobile */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        {/* Left Column — Identity & Track Record */}
        <div className="space-y-6">
          {/* Identity Card */}
          <div className="rounded-xl border border-warm-border bg-white p-4 shadow-sm sm:p-6">
            <p className="mb-4 text-[12px] font-semibold uppercase tracking-wider text-text-muted">
              Your Identity
            </p>
            <div className="space-y-4">
              {/* Firm / Fund Name */}
              <div>
                <Label htmlFor="firmName" className="text-[13px] font-medium text-deep-ink">
                  <Briefcase className="mr-1.5 inline h-3.5 w-3.5 text-text-muted" />
                  Firm / Fund Name
                  <span className="ml-1 text-text-muted">(optional)</span>
                </Label>
                <Input
                  id="firmName"
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                  placeholder="Sequoia Capital, Blume Ventures..."
                  className="mt-1.5 input-focus-ring"
                />
              </div>

              {/* LinkedIn URL */}
              <div>
                <Label htmlFor="linkedinUrl" className="text-[13px] font-medium text-deep-ink">
                  <Linkedin className="mr-1.5 inline h-3.5 w-3.5 text-text-muted" />
                  LinkedIn Profile
                  <span className="ml-1 text-brand-red">*</span>
                </Label>
                <Input
                  id="linkedinUrl"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/yourname"
                  className="mt-1.5 input-focus-ring"
                />
              </div>

              {/* Website */}
              <div>
                <Label htmlFor="website" className="text-[13px] font-medium text-deep-ink">
                  <Globe className="mr-1.5 inline h-3.5 w-3.5 text-text-muted" />
                  Website
                  <span className="ml-1 text-text-muted">(optional)</span>
                </Label>
                <Input
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yourfund.com"
                  className="mt-1.5 input-focus-ring"
                />
              </div>
            </div>
          </div>

          {/* Track Record Card */}
          <div className="rounded-xl border border-warm-border bg-white p-4 shadow-sm sm:p-6">
            <p className="mb-4 text-[12px] font-semibold uppercase tracking-wider text-text-muted">
              Track Record
            </p>
            <div>
              <Label htmlFor="portfolioCompanies" className="text-[13px] font-medium text-deep-ink">
                Notable Portfolio Companies
                <span className="ml-1 text-text-muted">(optional)</span>
              </Label>
              <Textarea
                id="portfolioCompanies"
                value={portfolioCompanies}
                onChange={(e) => setPortfolioCompanies(e.target.value)}
                maxLength={500}
                placeholder="List any notable startups you've invested in..."
                className="mt-1.5 resize-none input-focus-ring"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Right Column — Investment Profile */}
        <div className="rounded-xl border border-warm-border bg-white p-4 shadow-sm sm:p-6">
          <p className="mb-4 text-[12px] font-semibold uppercase tracking-wider text-text-muted">
            Investment Profile
          </p>
          <div className="space-y-4">
            {/* Investment Thesis */}
            <div>
              <Label htmlFor="investmentThesis" className="text-[13px] font-medium text-deep-ink">
                <FileText className="mr-1.5 inline h-3.5 w-3.5 text-text-muted" />
                Investment Thesis
                <span className="ml-1 text-brand-red">*</span>
              </Label>
              <Textarea
                id="investmentThesis"
                value={investmentThesis}
                onChange={(e) => setInvestmentThesis(e.target.value)}
                maxLength={500}
                placeholder="Describe your investment focus, typical check size, and what you look for in early-stage startups..."
                className="mt-1.5 resize-none input-focus-ring"
                rows={4}
              />
              <p className="mt-1 text-right font-mono text-[11px] text-text-muted">
                {investmentThesis.length}/500
              </p>
            </div>

            {/* Sector Interests */}
            <div>
              <Label className="text-[13px] font-medium text-deep-ink">
                Sectors of Interest
                <span className="ml-1 text-brand-red">*</span>
              </Label>
              <p className="mt-0.5 text-[12px] text-text-muted">
                Select one or more sectors you invest in
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5 sm:gap-2">
                {(Object.entries(CATEGORY_LABELS) as [Category, string][]).map(
                  ([value, label]) => {
                    const selected = sectorInterests.includes(value);
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => toggleSector(value)}
                        className={cn(
                          "rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition-all sm:px-3 sm:text-[13px]",
                          selected
                            ? "border-saffron bg-saffron-light text-saffron"
                            : "border-warm-border bg-white text-text-secondary hover:border-warm-border-strong"
                        )}
                      >
                        {label}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Stage Preference & Ticket Size — side by side */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="stagePreference" className="text-[13px] font-medium text-deep-ink">
                  Stage Preference
                </Label>
                <Select
                  value={stagePreference}
                  onValueChange={(val) => setStagePreference(val as InvestorStagePreference)}
                >
                  <SelectTrigger className="mt-1.5 border-warm-border">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(INVESTOR_STAGE_LABELS) as [InvestorStagePreference, string][]).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[13px] font-medium text-deep-ink">
                  Ticket Size (Lakhs)
                </Label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <Input
                    id="ticketSizeMin"
                    type="number"
                    value={ticketSizeMin}
                    onChange={(e) => setTicketSizeMin(e.target.value)}
                    placeholder="Min"
                    className="input-focus-ring"
                  />
                  <Input
                    id="ticketSizeMax"
                    type="number"
                    value={ticketSizeMax}
                    onChange={(e) => setTicketSizeMax(e.target.value)}
                    placeholder="Max"
                    className="input-focus-ring"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Row — full width */}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end lg:mt-8">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="w-full border-warm-border text-text-secondary sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isPending || !linkedinUrl || !investmentThesis || sectorInterests.length === 0}
          className="w-full gap-1.5 bg-saffron text-white hover:bg-saffron-dark disabled:opacity-50 sm:w-auto"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              Submit Application
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {/* Bottom spacer for mobile bottom-nav */}
      <div className="h-6 sm:h-0" />
    </div>
  );
}
