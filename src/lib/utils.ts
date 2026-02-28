import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import slugify from "slugify";
import { nanoid } from "nanoid";
import { formatDistanceToNow, format } from "date-fns";

/**
 * Merge Tailwind classes with clsx.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a unique slug from a title.
 * Always appends nanoid(6) to ensure uniqueness.
 */
export function generateSlug(title: string): string {
  const base = slugify(title, {
    lower: true,
    strict: true,
    trim: true,
  });
  // Truncate base to leave room for nanoid suffix
  const truncated = base.slice(0, 100);
  return `${truncated}-${nanoid(6)}`;
}

/**
 * Format a date as relative time (e.g., "2 hours ago").
 */
export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Format a date as "MMM d, yyyy" (e.g., "Jan 5, 2025").
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MMM d, yyyy");
}

/**
 * Format a number with compact notation (e.g., 1234 → "1.2K").
 */
export function formatNumber(num: number): string {
  if (num < 1000) return num.toString();
  if (num < 1_000_000) return `${(num / 1000).toFixed(1)}K`;
  return `${(num / 1_000_000).toFixed(1)}M`;
}

/**
 * Calculate vote breakdown percentages.
 */
export function getVotePercentages(
  useThis: number,
  maybe: number,
  notForMe: number
): { useThis: number; maybe: number; notForMe: number } {
  const total = useThis + maybe + notForMe;
  if (total === 0) return { useThis: 0, maybe: 0, notForMe: 0 };
  return {
    useThis: Math.round((useThis / total) * 100),
    maybe: Math.round((maybe / total) * 100),
    notForMe: Math.round((notForMe / total) * 100),
  };
}

/**
 * Truncate text to a max length with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Validate and clean a URL.
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate the absolute URL for a given path.
 */
export function absoluteUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}${path}`;
}

/**
 * Pluralize a word (simple English rules).
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return singular;
  return plural ?? `${singular}s`;
}
