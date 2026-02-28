import "server-only";
import Razorpay from "razorpay";
import crypto from "crypto";

// ═══════════════════════════════
// RAZORPAY CLIENT
// ═══════════════════════════════

// NOTE: Lazily initialized to avoid throwing at module load time
// in environments where keys might not be set (e.g., build step).
let _instance: Razorpay | null = null;

function getRazorpayInstance(): Razorpay {
  if (!_instance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error(
        "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in environment variables"
      );
    }

    _instance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return _instance;
}

// ═══════════════════════════════
// DONATION CONSTANTS
// ═══════════════════════════════

/** Allowed preset donation tiers in paise */
export const DONATION_TIERS_PAISE = [1000, 5000, 10000, 50000] as const;

/** Custom amount range in paise */
export const DONATION_MIN_PAISE = 500; // ₹5
export const DONATION_MAX_PAISE = 500000; // ₹5,000

/** Platform fee percentage (deducted on payout, not at payment time) */
export const PLATFORM_FEE_PERCENT = 10;

// ═══════════════════════════════
// CREATE ORDER
// ═══════════════════════════════

export async function createRazorpayOrder(params: {
  amountPaise: number;
  receipt: string;
  notes: Record<string, string>;
}): Promise<{ id: string; amount: number; currency: string }> {
  const razorpay = getRazorpayInstance();

  const order = await razorpay.orders.create({
    amount: params.amountPaise,
    currency: "INR",
    receipt: params.receipt,
    notes: params.notes,
  });

  return {
    id: order.id,
    amount: order.amount as number,
    currency: order.currency,
  };
}

// ═══════════════════════════════
// VERIFY SIGNATURE (HMAC-SHA256)
// ═══════════════════════════════

/**
 * Verify Razorpay payment signature using HMAC-SHA256.
 * Uses crypto.timingSafeEqual to prevent timing attacks.
 * NEVER use === for signature comparison.
 */
export function verifyRazorpaySignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    throw new Error("RAZORPAY_KEY_SECRET must be set");
  }

  const body = `${params.orderId}|${params.paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(body)
    .digest("hex");

  // Timing-safe comparison — MANDATORY per AGENTS.md
  const expected = Buffer.from(expectedSignature, "hex");
  const received = Buffer.from(params.signature, "hex");

  if (expected.length !== received.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, received);
}

// ═══════════════════════════════
// VALIDATION
// ═══════════════════════════════

/**
 * Validate a donation amount in paise.
 * Must be a known tier or within custom range.
 */
export function isValidDonationAmount(amountPaise: number): boolean {
  // Check preset tiers
  if ((DONATION_TIERS_PAISE as readonly number[]).includes(amountPaise)) {
    return true;
  }

  // Check custom range
  return (
    Number.isInteger(amountPaise) &&
    amountPaise >= DONATION_MIN_PAISE &&
    amountPaise <= DONATION_MAX_PAISE
  );
}

/**
 * Format paise as rupee string (e.g., 5000 → "₹50").
 */
export function formatPaiseToRupees(paise: number): string {
  const rupees = paise / 100;
  if (rupees >= 1000) {
    return `₹${(rupees / 1000).toFixed(rupees % 1000 === 0 ? 0 : 1)}K`;
  }
  return `₹${rupees % 1 === 0 ? rupees.toFixed(0) : rupees.toFixed(2)}`;
}
