import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { SCORE_TIER_LABELS, SCORE_TIER_COLORS, APP_NAME } from "@/lib/constants";
import { getVotePercentages } from "@/lib/utils";

export const alt = "BackMyIdea - Idea Validation Card";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const idea = await prisma.idea.findUnique({
    where: { slug },
    select: {
      title: true,
      pitch: true,
      validationScore: true,
      scoreTier: true,
      totalVotes: true,
      useThisCount: true,
      maybeCount: true,
      notForMeCount: true,
      founder: {
        select: { name: true, username: true },
      },
    },
  });

  if (!idea) {
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#09090b",
            color: "white",
            fontSize: "48px",
            fontFamily: "sans-serif",
          }}
        >
          Idea Not Found
        </div>
      ),
      { ...size }
    );
  }

  const tierColor = SCORE_TIER_COLORS[idea.scoreTier];
  const tierLabel = SCORE_TIER_LABELS[idea.scoreTier];
  const percentages = getVotePercentages(
    idea.useThisCount,
    idea.maybeCount,
    idea.notForMeCount
  );

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#09090b",
          color: "white",
          fontFamily: "sans-serif",
          padding: "48px",
          justifyContent: "space-between",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "24px", color: "#71717a", fontWeight: "bold" }}>
            {APP_NAME}
          </div>
          <div
            style={{
              fontSize: "20px",
              color: tierColor,
              border: `2px solid ${tierColor}`,
              padding: "8px 16px",
              borderRadius: "8px",
            }}
          >
            {tierLabel}
          </div>
        </div>

        {/* Title & Pitch */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ fontSize: "48px", fontWeight: "bold", lineHeight: 1.2 }}>
            {idea.title}
          </div>
          <div style={{ fontSize: "24px", color: "#a1a1aa", lineHeight: 1.4 }}>
            {idea.pitch}
          </div>
        </div>

        {/* Score + Votes */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          {/* Score circle */}
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <div
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "60px",
                border: `6px solid ${tierColor}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "48px",
                fontWeight: "bold",
                color: tierColor,
              }}
            >
              {idea.validationScore}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ fontSize: "20px", color: "#71717a" }}>
                {idea.totalVotes} votes
              </div>
              <div style={{ fontSize: "18px", display: "flex", gap: "16px" }}>
                <span style={{ color: "#ef4444" }}>🔥 {percentages.useThis}%</span>
                <span style={{ color: "#eab308" }}>🤔 {percentages.maybe}%</span>
                <span style={{ color: "#6b7280" }}>👎 {percentages.notForMe}%</span>
              </div>
            </div>
          </div>

          {/* Founder */}
          <div style={{ fontSize: "18px", color: "#71717a" }}>
            by @{idea.founder.username ?? idea.founder.name}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
