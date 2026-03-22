import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SCORE_TIER_COLORS, APP_NAME } from "@/lib/constants";
import { getVotePercentages } from "@/lib/utils";
import type { ScoreTier } from "@prisma/client";

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
        slug: true,
        founder: {
          select: { name: true, username: true },
        },
      },
    });

    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    const tierColor = SCORE_TIER_COLORS[idea.scoreTier as ScoreTier];
    const percentages = getVotePercentages(
      idea.useThisCount,
      idea.maybeCount,
      idea.notForMeCount
    );

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://piqd.in";
    const ideaUrl = `${appUrl}/idea/${idea.slug}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(ideaUrl)}`;

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
            <div style={{ fontSize: "24px", color: "#a1a1aa", fontWeight: "bold", display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ color: "#fff", display: "flex" }}>{APP_NAME}</div>
              <div style={{ display: "flex" }}>Validation Card</div>
            </div>
            <div style={{ fontSize: "18px", color: "#a1a1aa", display: "flex" }}>
              {`by @${idea.founder.username ?? idea.founder.name}`}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ fontSize: "44px", fontWeight: "bold", lineHeight: 1.2, display: "flex" }}>
              {idea.title}
            </div>
            <div style={{ fontSize: "22px", color: "#a1a1aa", lineHeight: 1.4, display: "flex" }}>
              {idea.pitch}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
              <div
                style={{
                  width: "140px",
                  height: "140px",
                  borderRadius: "70px",
                  border: `8px solid ${tierColor}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "56px",
                  fontWeight: "bold",
                  color: tierColor,
                  backgroundColor: `${tierColor}1a`, // slight tint
                }}
              >
                {idea.validationScore}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ fontSize: "24px", color: "#e4e4e7", fontWeight: "600", display: "flex" }}>
                  {`${idea.totalVotes} people validated this idea`}
                </div>
                <div style={{ fontSize: "20px", display: "flex", gap: "20px", marginTop: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ fontSize: "24px", display: "flex" }}>🔥</div>
                    <div style={{ color: "#ef4444", fontWeight: "bold", display: "flex" }}>{`${percentages.useThis}%`}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ fontSize: "24px", display: "flex" }}>🤔</div>
                    <div style={{ color: "#eab308", fontWeight: "bold", display: "flex" }}>{`${percentages.maybe}%`}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ fontSize: "24px", display: "flex" }}>👎</div>
                    <div style={{ color: "#6b7280", fontWeight: "bold", display: "flex" }}>{`${percentages.notForMe}%`}</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUrl} width={100} height={100} alt="QR Code" style={{ borderRadius: "8px", border: "4px solid white" }} />
              <div style={{ fontSize: "16px", color: "#a1a1aa", fontWeight: "500", display: "flex" }}>
                Scan to vote
              </div>
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
