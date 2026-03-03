import "server-only";
import { Resend } from "resend";
import { APP_NAME, APP_URL } from "./constants";

// ═══════════════════════════════
// RESEND CLIENT
// ═══════════════════════════════

// NOTE: Lazily initialized. Email sending is fire-and-forget —
// if Resend key is not configured, emails silently fail.
let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (_resend) return _resend;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // NOTE: Resend is optional. If key is missing, we skip emails silently.
    return null;
  }

  _resend = new Resend(apiKey);
  return _resend;
}

const FROM_EMAIL = `${APP_NAME} <noreply@piqd.in>`;

// ═══════════════════════════════
// DONOR CONFIRMATION EMAIL
// ═══════════════════════════════

/**
 * Send confirmation email to the donor after successful payment.
 * Fire-and-forget — never throws, never blocks.
 */
export async function sendDonorConfirmation(params: {
  donorEmail: string;
  donorName: string;
  ideaTitle: string;
  ideaSlug: string;
  amountPaise: number;
}): Promise<void> {
  try {
    const resend = getResend();
    if (!resend) return;

    const rupees = (params.amountPaise / 100).toFixed(
      params.amountPaise % 100 === 0 ? 0 : 2
    );

    await resend.emails.send({
      from: FROM_EMAIL,
      to: params.donorEmail,
      subject: `Thanks for backing "${params.ideaTitle}" on ${APP_NAME}`,
      html: `
        <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
          <h1 style="font-size: 24px; color: #181311; margin-bottom: 16px;">
            Thank you, ${params.donorName}!
          </h1>
          <p style="font-size: 15px; color: #896B61; line-height: 1.7;">
            Your donation of <strong style="color: #181311;">₹${rupees}</strong>
            to <strong style="color: #181311;">${params.ideaTitle}</strong>
            has been confirmed.
          </p>
          <p style="font-size: 15px; color: #896B61; line-height: 1.7;">
            Your support helps founders validate and build ideas that matter.
          </p>
          <a href="${APP_URL}/idea/${params.ideaSlug}" 
             style="display: inline-block; margin-top: 16px; padding: 10px 20px; background: #F05A28; color: white; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600;">
            View Idea
          </a>
          <p style="margin-top: 32px; font-size: 12px; color: #A8A29E;">
            ${APP_NAME} — Validate before you build.
          </p>
        </div>
      `,
    });
  } catch (error) {
    // Fire-and-forget — log but never throw
    console.error("[resend] Failed to send donor confirmation:", error);
  }
}

// ═══════════════════════════════
// FOUNDER DONATION ALERT EMAIL
// ═══════════════════════════════

/**
 * Notify the founder when they receive a donation.
 * Fire-and-forget — never throws, never blocks.
 */
export async function sendFounderDonationAlert(params: {
  founderEmail: string;
  founderName: string;
  donorName: string;
  ideaTitle: string;
  ideaSlug: string;
  amountPaise: number;
  isAnonymous: boolean;
}): Promise<void> {
  try {
    const resend = getResend();
    if (!resend) return;

    const rupees = (params.amountPaise / 100).toFixed(
      params.amountPaise % 100 === 0 ? 0 : 2
    );
    const donorDisplay = params.isAnonymous ? "An anonymous supporter" : params.donorName;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: params.founderEmail,
      subject: `${donorDisplay} backed "${params.ideaTitle}" with ₹${rupees}`,
      html: `
        <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
          <h1 style="font-size: 24px; color: #181311; margin-bottom: 16px;">
            You received a donation!
          </h1>
          <p style="font-size: 15px; color: #896B61; line-height: 1.7;">
            <strong style="color: #181311;">${donorDisplay}</strong>
            just donated <strong style="color: #F05A28;">₹${rupees}</strong>
            to your idea <strong style="color: #181311;">${params.ideaTitle}</strong>.
          </p>
          <p style="font-size: 15px; color: #896B61; line-height: 1.7;">
            People are putting money where their mouth is. Keep building!
          </p>
          <a href="${APP_URL}/idea/${params.ideaSlug}" 
             style="display: inline-block; margin-top: 16px; padding: 10px 20px; background: #F05A28; color: white; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600;">
            View Idea
          </a>
          <p style="margin-top: 32px; font-size: 12px; color: #A8A29E;">
            ${APP_NAME} — Validate before you build.
          </p>
        </div>
      `,
    });
  } catch (error) {
    // Fire-and-forget — log but never throw
    console.error("[resend] Failed to send founder donation alert:", error);
  }
}
