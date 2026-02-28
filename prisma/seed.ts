import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // ═══════════════════════════════
  // BADGES
  // ═══════════════════════════════

  const badges = [
    {
      name: "First Vote",
      slug: "first-vote",
      description: "Cast your first vote on an idea",
      icon: "🗳️",
      category: "VOTING" as const,
    },
    {
      name: "Validated 10",
      slug: "validated-10",
      description: "Voted on 10 different ideas",
      icon: "✅",
      category: "VOTING" as const,
    },
    {
      name: "Validated 50",
      slug: "validated-50",
      description: "Voted on 50 different ideas",
      icon: "🏅",
      category: "VOTING" as const,
    },
    {
      name: "Validated 100",
      slug: "validated-100",
      description: "Voted on 100 different ideas",
      icon: "🏆",
      category: "VOTING" as const,
    },
    {
      name: "Critic",
      slug: "critic",
      description: "Left 25 comments across ideas",
      icon: "💬",
      category: "COMMENTING" as const,
    },
    {
      name: "Early Believer",
      slug: "early-believer",
      description: "Voted on an idea before it reached 10 votes",
      icon: "🌟",
      category: "SPECIAL" as const,
    },
    {
      name: "Week Warrior",
      slug: "streak-7",
      description: "Maintained a 7-day voting streak",
      icon: "🔥",
      category: "STREAK" as const,
    },
    {
      name: "Streak Master",
      slug: "streak-30",
      description: "Maintained a 30-day voting streak",
      icon: "⚡",
      category: "STREAK" as const,
    },
    {
      name: "Idea Maker",
      slug: "idea-maker",
      description: "Posted your first startup idea",
      icon: "💡",
      category: "FOUNDING" as const,
    },
    {
      name: "Validated Founder",
      slug: "validated-founder",
      description: "Had an idea reach a validation score of 60+",
      icon: "🚀",
      category: "FOUNDING" as const,
    },
    {
      name: "OG",
      slug: "og",
      description: "One of the first 100 users on the platform",
      icon: "👑",
      category: "SPECIAL" as const,
    },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { slug: badge.slug },
      update: badge,
      create: badge,
    });
  }

  console.log(`✅ Seeded ${badges.length} badges`);

  // ═══════════════════════════════
  // SAMPLE USER (for seeded ideas)
  // ═══════════════════════════════

  const seedUser = await prisma.user.upsert({
    where: { clerkId: "seed_user_001" },
    update: {},
    create: {
      clerkId: "seed_user_001",
      name: "Arjun Mehta",
      email: "arjun@example.com",
      username: "arjun_mehta",
      bio: "Serial entrepreneur. Building for Bharat.",
      city: "Bengaluru",
      state: "Karnataka",
      role: "FOUNDER",
      onboarded: true,
      points: 250,
      level: "EXPLORER_LEVEL",
    },
  });

  const seedUser2 = await prisma.user.upsert({
    where: { clerkId: "seed_user_002" },
    update: {},
    create: {
      clerkId: "seed_user_002",
      name: "Priya Sharma",
      email: "priya@example.com",
      username: "priya_builds",
      bio: "Product designer turned founder. Passionate about edtech.",
      city: "Mumbai",
      state: "Maharashtra",
      role: "BOTH",
      onboarded: true,
      points: 180,
      level: "EXPLORER_LEVEL",
    },
  });

  console.log("✅ Seeded 2 sample users");

  // ═══════════════════════════════
  // SAMPLE IDEAS
  // ═══════════════════════════════

  const ideas = [
    {
      slug: "chai-subscription-box-india-a1b2c3",
      title: "Chai Subscription Box",
      pitch: "Curated regional chai blends delivered monthly to your doorstep",
      problem: "India has incredible regional chai varieties but most people only know their local blend. There's no easy way to discover and enjoy authentic chai from different states without traveling.",
      solution: "Monthly subscription box featuring 3-4 authentic chai blends from different Indian regions, with brewing guides and stories about the origin of each blend. Sourced directly from local tea gardens.",
      category: "FOOD" as const,
      stage: "PROTOTYPE" as const,
      targetAudience: ["WORKING_PROFESSIONALS" as const, "EVERYONE" as const],
      tags: ["chai", "subscription", "d2c", "food"],
      totalVotes: 45,
      useThisCount: 28,
      maybeCount: 12,
      notForMeCount: 5,
      totalViews: 320,
      totalComments: 15,
      validationScore: 62,
      scoreTier: "STRONG" as const,
      founderId: seedUser.id,
      donationsEnabled: true,
    },
    {
      slug: "rentmate-flatmate-finder-india-d4e5f6",
      title: "RentMate - Flatmate Finder",
      pitch: "AI-powered flatmate matching for Indian cities based on lifestyle compatibility",
      problem: "Finding compatible flatmates in Indian cities is a nightmare. Existing platforms are just listing sites with no compatibility matching, leading to conflicts and frequent moves.",
      solution: "An app that uses a detailed lifestyle questionnaire (food preferences, work schedule, cleanliness, noise tolerance, etc.) and AI to match compatible flatmates. Includes verified profiles and a chat system.",
      category: "REAL_ESTATE" as const,
      stage: "BUILDING" as const,
      targetAudience: ["STUDENTS" as const, "WORKING_PROFESSIONALS" as const, "TIER_1_CITIES" as const],
      tags: ["housing", "flatmate", "ai", "matching"],
      totalVotes: 78,
      useThisCount: 52,
      maybeCount: 18,
      notForMeCount: 8,
      totalViews: 560,
      totalComments: 32,
      validationScore: 75,
      scoreTier: "STRONG" as const,
      founderId: seedUser2.id,
      donationsEnabled: true,
    },
    {
      slug: "kisan-connect-farm-to-table-g7h8i9",
      title: "KisanConnect",
      pitch: "Direct farm-to-consumer platform for fresh produce in Tier 2/3 cities",
      problem: "Farmers in smaller cities lose 30-40% of their income to middlemen. Consumers pay inflated prices for produce that's days old. The supply chain is broken in Tier 2/3 India.",
      solution: "A hyperlocal platform connecting farmers within 50km to consumers directly. Features include harvest scheduling, quality grading via photos, and micro-logistics using existing delivery networks.",
      category: "AGRITECH" as const,
      stage: "JUST_AN_IDEA" as const,
      targetAudience: ["SMALL_BUSINESSES" as const, "TIER_2_3_CITIES" as const, "HOMEMAKERS" as const],
      tags: ["agriculture", "farm-to-table", "hyperlocal", "tier2"],
      totalVotes: 23,
      useThisCount: 15,
      maybeCount: 6,
      notForMeCount: 2,
      totalViews: 180,
      totalComments: 8,
      validationScore: 48,
      scoreTier: "INTERESTED" as const,
      founderId: seedUser.id,
    },
    {
      slug: "studybuddy-ai-tutor-vernacular-j0k1l2",
      title: "StudyBuddy AI",
      pitch: "AI tutor that explains concepts in Hindi, Tamil, Telugu, and 8 more Indian languages",
      problem: "Most AI tutoring tools only work well in English. 70% of Indian students prefer learning in their regional language but have no access to quality AI-powered education tools.",
      solution: "An AI tutoring platform built specifically for Indian languages. Uses fine-tuned models for NCERT/state board syllabi. Students can ask questions via voice in their language and get step-by-step explanations.",
      category: "EDTECH" as const,
      stage: "BUILDING" as const,
      targetAudience: ["STUDENTS" as const, "TIER_2_3_CITIES" as const],
      tags: ["edtech", "ai", "vernacular", "education"],
      totalVotes: 92,
      useThisCount: 65,
      maybeCount: 20,
      notForMeCount: 7,
      totalViews: 720,
      totalComments: 41,
      validationScore: 82,
      scoreTier: "CROWD_FAVORITE" as const,
      founderId: seedUser2.id,
      donationsEnabled: true,
    },
    {
      slug: "splitkhata-expense-sharing-m3n4o5",
      title: "SplitKhata",
      pitch: "UPI-native expense splitting for friend groups with auto-settlement",
      problem: "Splitting bills among Indian friend groups is chaos. Everyone uses UPI but tracking who owes whom across multiple outings is still done on WhatsApp or forgotten entirely.",
      solution: "A lightweight app that creates group 'khatas' (ledgers). Scan UPI receipts, auto-detect splits, and settle with one-tap UPI payments. Integrates with PhonePe/GPay for seamless settlement.",
      category: "FINTECH" as const,
      stage: "JUST_AN_IDEA" as const,
      targetAudience: ["STUDENTS" as const, "WORKING_PROFESSIONALS" as const, "EVERYONE" as const],
      tags: ["fintech", "upi", "expense-splitting", "social"],
      totalVotes: 56,
      useThisCount: 38,
      maybeCount: 14,
      notForMeCount: 4,
      totalViews: 410,
      totalComments: 22,
      validationScore: 68,
      scoreTier: "STRONG" as const,
      founderId: seedUser.id,
      donationsEnabled: true,
    },
    {
      slug: "dhobi-on-demand-laundry-p6q7r8",
      title: "Dhobi On Demand",
      pitch: "Hyperlocal laundry pickup and delivery connecting local dhobis with customers",
      problem: "Local dhobis struggle with customer acquisition while laundry apps charge exorbitant markups. Customers want affordable, quality ironing and washing but apps price out the middle class.",
      solution: "A platform that partners directly with neighborhood dhobis, providing them a digital storefront, route optimization, and payment collection. Customers get reliable, affordable laundry service.",
      category: "LOGISTICS" as const,
      stage: "PROTOTYPE" as const,
      targetAudience: ["WORKING_PROFESSIONALS" as const, "TIER_1_CITIES" as const, "TIER_2_3_CITIES" as const],
      tags: ["logistics", "hyperlocal", "laundry", "marketplace"],
      totalVotes: 34,
      useThisCount: 18,
      maybeCount: 11,
      notForMeCount: 5,
      totalViews: 240,
      totalComments: 12,
      validationScore: 45,
      scoreTier: "INTERESTED" as const,
      founderId: seedUser2.id,
    },
    {
      slug: "healthsathi-rural-telemedicine-s9t0u1",
      title: "HealthSathi",
      pitch: "WhatsApp-based telemedicine for rural India with AI triage in regional languages",
      problem: "Rural India has 1 doctor per 10,000 people. Villagers travel hours for basic consultations. Existing telemedicine apps need smartphones and good internet — both scarce in rural areas.",
      solution: "A WhatsApp bot that does initial symptom triage in the patient's language, connects to a doctor via voice call, and sends prescriptions as WhatsApp images. Works on any phone with WhatsApp.",
      category: "HEALTHTECH" as const,
      stage: "JUST_AN_IDEA" as const,
      targetAudience: ["TIER_2_3_CITIES" as const, "EVERYONE" as const],
      tags: ["healthtech", "telemedicine", "rural", "whatsapp"],
      totalVotes: 67,
      useThisCount: 48,
      maybeCount: 15,
      notForMeCount: 4,
      totalViews: 490,
      totalComments: 28,
      validationScore: 72,
      scoreTier: "STRONG" as const,
      founderId: seedUser.id,
      donationsEnabled: true,
    },
    {
      slug: "content-dal-creator-saas-v2w3x4",
      title: "ContentDal",
      pitch: "SaaS tool that converts long-form content into platform-optimized social media posts",
      problem: "Indian creators and SMBs produce blog posts and videos but struggle to repurpose content across Instagram, LinkedIn, Twitter, and YouTube Shorts. Each platform has different formats.",
      solution: "Upload any content — blog, video transcript, podcast — and ContentDal auto-generates optimized posts for each platform. Includes Hindi/Hinglish tone options and India-specific trending hashtags.",
      category: "SAAS" as const,
      stage: "LAUNCHED" as const,
      targetAudience: ["SMALL_BUSINESSES" as const, "WORKING_PROFESSIONALS" as const],
      tags: ["saas", "content", "creator-economy", "ai"],
      totalVotes: 41,
      useThisCount: 22,
      maybeCount: 13,
      notForMeCount: 6,
      totalViews: 290,
      totalComments: 18,
      validationScore: 52,
      scoreTier: "INTERESTED" as const,
      founderId: seedUser2.id,
    },
    {
      slug: "fitkar-gamified-fitness-india-y5z6a7",
      title: "FitKar",
      pitch: "Gamified fitness app with India-specific challenges — yoga, cricket fitness, desi diet plans",
      problem: "Global fitness apps don't resonate with Indian users. They push Western diets (no paneer, no dal!) and exercises that don't account for Indian lifestyle, weather, or food habits.",
      solution: "A fitness app designed for India: workout plans for small spaces, diet plans with Indian meals (calories for roti, rice, dal), cricket-based fitness challenges, and neighborhood walking groups.",
      category: "FITNESS" as const,
      stage: "BUILDING" as const,
      targetAudience: ["STUDENTS" as const, "WORKING_PROFESSIONALS" as const, "EVERYONE" as const],
      tags: ["fitness", "health", "gamification", "india"],
      totalVotes: 8,
      useThisCount: 5,
      maybeCount: 2,
      notForMeCount: 1,
      totalViews: 95,
      totalComments: 3,
      validationScore: 0,
      scoreTier: "EARLY_DAYS" as const,
      founderId: seedUser.id,
    },
    {
      slug: "greenshift-sustainability-tracker-b8c9d0",
      title: "GreenShift",
      pitch: "Track and reduce your carbon footprint with India-specific actions and rewards",
      problem: "Climate-conscious Indians want to reduce their footprint but existing carbon calculators use US/EU data. Indian emissions patterns (cooking fuel, transport, electricity mix) are completely different.",
      solution: "A carbon footprint tracker calibrated for India. Tracks auto/rickshaw usage, LPG/induction cooking, AC usage patterns, and suggests actionable India-specific changes. Partner with eco-brands for rewards.",
      category: "SUSTAINABILITY" as const,
      stage: "JUST_AN_IDEA" as const,
      targetAudience: ["STUDENTS" as const, "WORKING_PROFESSIONALS" as const, "TIER_1_CITIES" as const],
      tags: ["sustainability", "climate", "carbon-footprint", "green"],
      totalVotes: 15,
      useThisCount: 8,
      maybeCount: 5,
      notForMeCount: 2,
      totalViews: 130,
      totalComments: 6,
      validationScore: 38,
      scoreTier: "GETTING_NOTICED" as const,
      founderId: seedUser2.id,
    },
  ];

  for (const ideaData of ideas) {
    const { founderId, ...data } = ideaData;
    await prisma.idea.upsert({
      where: { slug: data.slug },
      update: { ...data, founderId },
      create: { ...data, founderId },
    });
  }

  console.log(`✅ Seeded ${ideas.length} sample ideas`);
  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
