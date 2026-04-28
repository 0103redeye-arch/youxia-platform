import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/getAuthUser";

// GET /api/achievements — 取得所有成就定義 + 我已解鎖的
export async function GET() {
  const user = await getAuthUser();

  const allDefs = await prisma.achievementDef.findMany({
    where: { isActive: true },
    orderBy: [{ rarity: "desc" }, { name: "asc" }],  // 稀有度高的排前面
  });

  if (!user?.id) {
    return NextResponse.json({ defs: allDefs, earned: [] });
  }

  const profile = await prisma.masterProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!profile) {
    return NextResponse.json({ defs: allDefs, earned: [] });
  }

  const earned = await prisma.masterAchievement.findMany({
    where: { masterProfileId: profile.id },
    select: { achievementId: true, earnedAt: true, note: true },
  });

  return NextResponse.json({ defs: allDefs, earned });
}
