import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SCORE_TIER_COLORS } from "@/lib/constants";
import { getVotePercentages } from "@/lib/utils";
import type { ScoreTier } from "@prisma/client";

// Fetch font from Google Fonts (GitHub raw content for TTF)
const fetchFont = async () => {
  try {
    const res = await fetch("https://github.com/google/fonts/raw/main/ofl/instrumentserif/InstrumentSerif-Regular.ttf");
    if (res.ok) {
      return await res.arrayBuffer();
    }
  } catch (e) {
    console.error("Failed to fetch font", e);
  }
  return null;
};

const fetchInterFont = async () => {
  try {
    const res = await fetch("https://github.com/google/fonts/raw/main/ofl/inter/Inter%5Bslnt%2Cwght%5D.ttf");
    if (res.ok) {
      return await res.arrayBuffer();
    }
  } catch (e) {
    console.error("Failed to fetch Inter font", e);
  }
  return null;
};

export async function GET(
  req: Request,
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

    const tierColor = SCORE_TIER_COLORS[idea.scoreTier as ScoreTier] || "#F05A28";
    const percentages = getVotePercentages(
      idea.useThisCount,
      idea.maybeCount,
      idea.notForMeCount
    );

    // Always force the domain to piqd.tech in production
    let appUrl = "https://piqd.tech";
    
    if (process.env.NODE_ENV === "development") {
      appUrl = "http://localhost:3000";
    }

    const ideaUrl = `${appUrl}/idea/${idea.slug}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&color=181311&bgcolor=F8F6F4&data=${encodeURIComponent(ideaUrl)}`;

    const instrumentSerifData = await fetchFont();
    const interData = await fetchInterFont();

    const fonts: any[] = [];
    if (instrumentSerifData) {
      fonts.push({
        name: "Instrument Serif",
        data: instrumentSerifData,
        style: "normal" as const,
      });
    }
    if (interData) {
      fonts.push({
        name: "Inter",
        data: interData,
        style: "normal" as const,
      });
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#F8F6F4", // warm-canvas
            color: "#181311", // deep-ink
            fontFamily: '"Inter", sans-serif',
            padding: "80px",
            justifyContent: "space-between",
          }}
        >
          {/* Header - Massive Brand Logo */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontFamily: '"Instrument Serif", serif',
                  fontSize: "240px",
                  color: "#F05A28", // saffron
                  display: "flex",
                  lineHeight: 1,
                  letterSpacing: "-2px",
                }}
              >
                Piqd
              </div>
              <div style={{ fontSize: "38px", color: "#6B5E57", marginTop: "32px", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>
                Idea Validation Report
              </div>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "12px", paddingTop: "24px" }}>
              <div style={{ fontSize: "36px", color: "#6B5E57", fontWeight: "500" }}>
                {`@${idea.founder.username ?? idea.founder.name}'s Idea`}
              </div>
            </div>
          </div>

          {/* Idea Content */}
          <div style={{ display: "flex", flexDirection: "column", gap: "40px", margin: "60px 0", flexGrow: 1, justifyContent: "center" }}>
            <div style={{ fontSize: "100px", fontWeight: "800", lineHeight: 1.1, display: "flex", color: "#181311", letterSpacing: "-2px" }}>
              {idea.title}
            </div>
            <div style={{ fontSize: "52px", color: "#6B5E57", lineHeight: 1.4, display: "flex", fontWeight: "400", paddingRight: "40px" }}>
              {idea.pitch}
            </div>
          </div>

          {/* Validation Score & Breakdown Box */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#FFFFFF",
              borderRadius: "40px",
              padding: "70px",
              boxShadow: "0 24px 48px rgba(24, 19, 17, 0.05)",
              border: "3px solid #E6DEDB",
              gap: "60px",
            }}
          >
            {/* Score Row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ fontSize: "36px", color: "#6B5E57", fontWeight: "600", display: "flex", textTransform: "uppercase", letterSpacing: "2px" }}>
                  Validation Score
                </div>
                <div style={{ fontSize: "44px", color: "#181311", fontWeight: "700", display: "flex" }}>
                  {`Based on ${idea.totalVotes} votes`}
                </div>
              </div>
              <div
                style={{
                  width: "260px",
                  height: "260px",
                  borderRadius: "130px",
                  border: `20px solid ${tierColor}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "100px",
                  fontWeight: "800",
                  color: tierColor,
                  backgroundColor: `${tierColor}1a`,
                }}
              >
                {idea.validationScore}
              </div>
            </div>

            <div style={{ height: "3px", backgroundColor: "#E6DEDB", width: "100%" }} />

            {/* Breakdown Row (No Emojis, Larger Text) */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "8px" }}>
                <div style={{ fontSize: "56px", color: "#ef4444", fontWeight: "800", display: "flex" }}>{`${percentages.useThis}%`}</div>
                <div style={{ fontSize: "28px", color: "#6B5E57", fontWeight: "600", display: "flex", textTransform: "uppercase" }}>Use This</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "8px" }}>
                <div style={{ fontSize: "56px", color: "#eab308", fontWeight: "800", display: "flex" }}>{`${percentages.maybe}%`}</div>
                <div style={{ fontSize: "28px", color: "#6B5E57", fontWeight: "600", display: "flex", textTransform: "uppercase" }}>Maybe</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "8px" }}>
                <div style={{ fontSize: "56px", color: "#6b7280", fontWeight: "800", display: "flex" }}>{`${percentages.notForMe}%`}</div>
                <div style={{ fontSize: "28px", color: "#6B5E57", fontWeight: "600", display: "flex", textTransform: "uppercase" }}>Not For Me</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "70px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ fontSize: "52px", color: "#181311", fontWeight: "700", display: "flex" }}>
                Got an idea? Validate it.
              </div>
              <div style={{ fontSize: "44px", color: "#F05A28", fontWeight: "600", display: "flex" }}>
                piqd.tech
              </div>
            </div>
            
            {/* Bigger, More Beautiful QR Code */}
            <div style={{ 
              display: "flex", 
              padding: "24px", 
              backgroundColor: "#FFFFFF", 
              borderRadius: "32px", 
              border: "4px solid #E6DEDB",
              boxShadow: "0 12px 24px rgba(24, 19, 17, 0.05)"
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUrl} width={280} height={280} alt="QR Code" style={{ borderRadius: "12px" }} />
            </div>
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1920,
        fonts,
        headers: {
          "Cache-Control": "public, max-age=0, s-maxage=60", // Short cache for dynamic updates
        },
      }
    );
  } catch {
    return NextResponse.json({ error: "Failed to generate card" }, { status: 500 });
  }
}
