import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIQualityResult, AIDuplicateResult } from "@/types";
import { aiLimiter } from "./redis";

// NOTE: AI calls fail open per AGENTS.md — if Gemini is unavailable, allow the operation.

const genAI = process.env.GOOGLE_GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY)
  : null;

const MODEL_NAME = "gemini-3.1-flash-lite";

/**
 * AI quality check on an idea submission.
 * Returns null on failure (fail open).
 */
export async function checkIdeaQuality(idea: {
  title: string;
  pitch: string;
  problem: string;
  solution: string;
  category: string;
}): Promise<AIQualityResult | null> {
  if (!genAI) {
    return null;
  }

  try {
    // Rate limit AI calls
    const { success } = await aiLimiter.limit("ai-quality");
    if (!success) {
      return null;
    }

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = `You are a startup idea quality checker for an Indian startup validation platform.

Analyze this startup idea and return a JSON response:

Title: ${idea.title}
One-line pitch: ${idea.pitch}
Problem: ${idea.problem}
Solution: ${idea.solution}
Category: ${idea.category}

Return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "score": <number 0-100>,
  "isSpam": <boolean>,
  "feedback": [<array of 1-3 constructive feedback strings>],
  "suggestedTags": [<array of 1-5 relevant tag strings>]
}

Scoring guidelines:
- 80-100: Clear problem, specific solution, well-articulated
- 60-79: Good idea but could be more specific
- 40-59: Vague or generic, needs more detail
- 20-39: Very unclear or low effort
- 0-19: Likely spam, gibberish, or inappropriate content

Mark isSpam=true ONLY for: gibberish, promotional spam, hate speech, clearly inappropriate content.
Do NOT mark legitimate ideas as spam even if they seem weak.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Try to parse JSON — strip markdown fences if present
    const cleaned = text.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned) as AIQualityResult;

    // Validate structure
    if (
      typeof parsed.score !== "number" ||
      typeof parsed.isSpam !== "boolean" ||
      !Array.isArray(parsed.feedback) ||
      !Array.isArray(parsed.suggestedTags)
    ) {
      return null;
    }

    return {
      score: Math.max(0, Math.min(100, Math.round(parsed.score))),
      isSpam: parsed.isSpam,
      feedback: parsed.feedback.slice(0, 3),
      suggestedTags: parsed.suggestedTags.slice(0, 5),
    };
  } catch {
    // Fail open — allow the operation
    return null;
  }
}

/**
 * AI duplicate check — compare against existing idea titles.
 * Returns null on failure (fail open).
 */
export async function checkDuplicateIdea(
  title: string,
  pitch: string,
  existingIdeas: { id: string; title: string; slug: string; pitch: string }[]
): Promise<AIDuplicateResult | null> {
  if (!genAI || existingIdeas.length === 0) {
    return null;
  }

  try {
    const { success } = await aiLimiter.limit("ai-duplicate");
    if (!success) {
      return null;
    }

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const existingList = existingIdeas
      .map((i) => `- ID: ${i.id} | Title: "${i.title}" | Pitch: "${i.pitch}"`)
      .join("\n");

    const prompt = `You are checking if a new startup idea is a duplicate of existing ones on an Indian startup platform.

New idea:
Title: "${title}"
Pitch: "${pitch}"

Existing ideas:
${existingList}

Return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "isDuplicate": <boolean - true only if very similar concept>,
  "similarIdeas": [
    {
      "id": "<existing idea id>",
      "title": "<existing idea title>",
      "slug": "",
      "similarity": <number 0 to 1>
    }
  ]
}

Only include ideas with similarity > 0.3. Mark isDuplicate=true only if similarity > 0.7.
Similar problem space but different solutions should NOT be marked as duplicates.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    const cleaned = text.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned) as AIDuplicateResult;

    if (typeof parsed.isDuplicate !== "boolean" || !Array.isArray(parsed.similarIdeas)) {
      return null;
    }

    // Re-attach slug from original data
    const slugMap = new Map(existingIdeas.map((i) => [i.id, i.slug]));
    const similarIdeas = parsed.similarIdeas
      .filter(
        (s) =>
          typeof s.id === "string" &&
          typeof s.similarity === "number" &&
          s.similarity > 0.3
      )
      .map((s) => ({
        ...s,
        slug: slugMap.get(s.id) ?? "",
        similarity: Math.round(s.similarity * 100) / 100,
      }));

    return {
      isDuplicate: parsed.isDuplicate,
      similarIdeas,
    };
  } catch {
    // Fail open
    return null;
  }
}
