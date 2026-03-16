"use client";

import { useState, useCallback, useEffect } from "react";
import { X, Heart, Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ═══════════════════════════════
// TYPES
// ═══════════════════════════════

interface DonationModalProps {
  ideaId: string;
  ideaTitle: string;
  founderName: string;
  open: boolean;
  onClose: () => void;
}

type ModalStep = "select" | "processing" | "success" | "error";

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

// Extend Window for Razorpay
declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, callback: () => void) => void;
    };
  }
}

// ═══════════════════════════════
// CONSTANTS
// ═══════════════════════════════

const TIERS = [
  { label: "₹10", paise: 1000 },
  { label: "₹50", paise: 5000 },
  { label: "₹100", paise: 10000 },
  { label: "₹500", paise: 50000 },
] as const;

const MIN_CUSTOM_RUPEES = 5;
const MAX_CUSTOM_RUPEES = 5000;

// ═══════════════════════════════
// RAZORPAY SCRIPT LOADER
// ═══════════════════════════════

let razorpayScriptLoaded = false;
let razorpayScriptLoading = false;

function loadRazorpayScript(): Promise<void> {
  if (razorpayScriptLoaded) return Promise.resolve();
  if (razorpayScriptLoading) {
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (razorpayScriptLoaded) {
          clearInterval(check);
          resolve();
        }
      }, 100);
    });
  }

  razorpayScriptLoading = true;
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      razorpayScriptLoaded = true;
      razorpayScriptLoading = false;
      resolve();
    };
    script.onerror = () => {
      razorpayScriptLoading = false;
      reject(new Error("Failed to load Razorpay SDK"));
    };
    document.body.appendChild(script);
  });
}

// ═══════════════════════════════
// COMPONENT
// ═══════════════════════════════

export function DonationModal({
  ideaId,
  ideaTitle,
  founderName,
  open,
  onClose,
}: DonationModalProps) {
  const [step, setStep] = useState<ModalStep>("select");
  const [selectedPaise, setSelectedPaise] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep("select");
      setSelectedPaise(null);
      setCustomAmount("");
      setIsCustom(false);
      setIsAnonymous(false);
      setMessage("");
      setErrorMessage("");
    }
  }, [open]);

  // Load Razorpay script when modal opens
  useEffect(() => {
    if (open) {
      loadRazorpayScript().catch(console.error);
    }
  }, [open]);

  const getAmountPaise = useCallback((): number | null => {
    if (isCustom) {
      const rupees = parseFloat(customAmount);
      if (isNaN(rupees) || rupees < MIN_CUSTOM_RUPEES || rupees > MAX_CUSTOM_RUPEES) {
        return null;
      }
      return Math.round(rupees * 100);
    }
    return selectedPaise;
  }, [isCustom, customAmount, selectedPaise]);

  const handleDonate = useCallback(async () => {
    const amountPaise = getAmountPaise();
    if (!amountPaise) return;

    setStep("processing");
    setErrorMessage("");

    try {
      // 1. Create order
      const createRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaId,
          amountPaise,
          isAnonymous,
          message: message.trim() || undefined,
        }),
      });

      if (!createRes.ok) {
        const data = await createRes.json() as { error?: string };
        throw new Error(data.error ?? "Failed to create order");
      }

      const orderData = await createRes.json() as {
        orderId: string;
        donationId: string;
        amount: number;
        currency: string;
        keyId: string;
      };

      // 2. Ensure Razorpay SDK is loaded
      await loadRazorpayScript();

      // 3. Open Razorpay checkout
      const rzp = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: "Piqd",
        description: `Donation for "${ideaTitle}"`,
        handler: async (response: RazorpayResponse) => {
          // 4. Verify payment
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                donationId: orderData.donationId,
              }),
            });

            if (!verifyRes.ok) {
              const data = await verifyRes.json() as { error?: string };
              throw new Error(data.error ?? "Verification failed");
            }

            setStep("success");
          } catch (err) {
            setErrorMessage(
              err instanceof Error ? err.message : "Verification failed"
            );
            setStep("error");
          }
        },
        modal: {
          ondismiss: () => {
            setStep("select");
          },
        },
        theme: {
          color: "#F05A28",
        },
      });

      rzp.open();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong"
      );
      setStep("error");
    }
  }, [getAmountPaise, ideaId, ideaTitle, isAnonymous, message]);

  if (!open) return null;

  const amountPaise = getAmountPaise();
  const isValid = amountPaise !== null && amountPaise > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-[420px] rounded-[12px] border border-warm-border bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-warm-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-saffron" />
            <h2 className="text-[16px] font-semibold text-deep-ink">
              Piq this Idea
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-text-muted transition-colors hover:bg-warm-subtle hover:text-deep-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-5">
          {/* ── SELECT STEP ── */}
          {step === "select" && (
            <>
              <p className="text-[13px] text-text-secondary">
                Support <span className="font-medium text-deep-ink">{founderName}</span>{" "}
                by donating to{" "}
                <span className="font-medium text-deep-ink">{ideaTitle}</span>
              </p>

              {/* Tier buttons */}
              <div className="mt-4 grid grid-cols-4 gap-2">
                {TIERS.map((tier) => (
                  <button
                    key={tier.paise}
                    onClick={() => {
                      setSelectedPaise(tier.paise);
                      setIsCustom(false);
                    }}
                    className={cn(
                      "rounded-[8px] border py-2.5 text-[14px] font-semibold transition-all",
                      !isCustom && selectedPaise === tier.paise
                        ? "border-saffron bg-saffron-light text-saffron"
                        : "border-warm-border bg-white text-deep-ink hover:border-saffron/40"
                    )}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>

              {/* Custom amount */}
              <button
                onClick={() => {
                  setIsCustom(true);
                  setSelectedPaise(null);
                }}
                className={cn(
                  "mt-2 w-full rounded-[8px] border py-2 text-[13px] font-medium transition-all",
                  isCustom
                    ? "border-saffron bg-saffron-light text-saffron"
                    : "border-warm-border text-text-secondary hover:border-saffron/40"
                )}
              >
                Custom amount
              </button>

              {isCustom && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 rounded-[8px] border border-warm-border px-3 py-2 focus-within:border-saffron">
                    <span className="text-[14px] font-medium text-text-muted">₹</span>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder={`${MIN_CUSTOM_RUPEES} - ${MAX_CUSTOM_RUPEES}`}
                      min={MIN_CUSTOM_RUPEES}
                      max={MAX_CUSTOM_RUPEES}
                      className="w-full bg-transparent text-[14px] text-deep-ink outline-none placeholder:text-text-muted"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-text-muted">
                    Min ₹{MIN_CUSTOM_RUPEES}, Max ₹{MAX_CUSTOM_RUPEES.toLocaleString()}
                  </p>
                </div>
              )}

              {/* Optional message */}
              <div className="mt-4">
                <label className="text-[12px] font-medium text-text-muted">
                  Message (optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 200))}
                  placeholder="Leave a note for the founder..."
                  rows={2}
                  className="mt-1 w-full resize-none rounded-[8px] border border-warm-border px-3 py-2 text-[13px] text-deep-ink outline-none placeholder:text-text-muted focus:border-saffron"
                />
                <p className="text-right text-[11px] text-text-muted">
                  {message.length}/200
                </p>
              </div>

              {/* Anonymous toggle */}
              <label className="mt-2 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-warm-border accent-saffron"
                />
                <span className="text-[12px] text-text-secondary">
                  Donate anonymously
                </span>
              </label>

              {/* Donate button */}
              <Button
                onClick={handleDonate}
                disabled={!isValid}
                className="mt-5 w-full gap-1.5 bg-saffron text-white hover:bg-saffron-dark disabled:opacity-50"
              >
                <Heart className="h-3.5 w-3.5" />
                {isValid
                  ? `Donate ₹${(amountPaise / 100).toFixed(amountPaise % 100 === 0 ? 0 : 2)}`
                  : "Select an amount"}
              </Button>
            </>
          )}

          {/* ── PROCESSING STEP ── */}
          {step === "processing" && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-saffron" />
              <p className="mt-3 text-[14px] font-medium text-deep-ink">
                Processing...
              </p>
              <p className="mt-1 text-[12px] text-text-muted">
                Please complete payment in the Razorpay window
              </p>
            </div>
          )}

          {/* ── SUCCESS STEP ── */}
          {step === "success" && (
            <div className="flex flex-col items-center py-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-green-light">
                <Check className="h-6 w-6 text-brand-green" />
              </div>
              <h3 className="mt-3 text-[16px] font-semibold text-deep-ink">
                Thank you!
              </h3>
              <p className="mt-1 text-center text-[13px] text-text-secondary">
                Your donation has been confirmed. The founder will be notified.
              </p>
              <Button
                onClick={() => {
                  onClose();
                  // Refresh to show updated counts
                  window.location.reload();
                }}
                className="mt-5 bg-saffron text-white hover:bg-saffron-dark"
                size="sm"
              >
                Done
              </Button>
            </div>
          )}

          {/* ── ERROR STEP ── */}
          {step === "error" && (
            <div className="flex flex-col items-center py-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-red-light">
                <AlertCircle className="h-6 w-6 text-brand-red" />
              </div>
              <h3 className="mt-3 text-[16px] font-semibold text-deep-ink">
                Something went wrong
              </h3>
              <p className="mt-1 text-center text-[13px] text-text-secondary">
                {errorMessage || "Payment could not be completed."}
              </p>
              <Button
                onClick={() => setStep("select")}
                variant="outline"
                className="mt-5"
                size="sm"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
