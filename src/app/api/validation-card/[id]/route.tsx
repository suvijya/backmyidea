import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SCORE_TIER_COLORS, APP_NAME } from "@/lib/constants";
import { getVotePercentages } from "@/lib/utils";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: ideaId } = await params;

  try {
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
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
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    const tierColor = SCORE_TIER_COLORS[idea.scoreTier];
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "24px", color: "#71717a", fontWeight: "bold" }}>
              {APP_NAME} Validation Card
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ fontSize: "44px", fontWeight: "bold", lineHeight: 1.2 }}>
              {idea.title}
            </div>
            <div style={{ fontSize: "22px", color: "#a1a1aa", lineHeight: 1.4 }}>
              {idea.pitch}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
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

            <div style={{ fontSize: "18px", color: "#71717a" }}>
              by @{idea.founder.username ?? idea.founder.name}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          "Cache-Control": "public, max-age=3600",
        },
      }
    );
  } catch {
    return NextResponse.json({ error: "Failed to generate card" }, { status: 500 });
  }
}
