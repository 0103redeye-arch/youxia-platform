import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Vercel Cron：每小時執行，將逾期案件標為 EXPIRED
 * cron: "0 * * * *"
 */
export async function GET(req: NextRequest) {
  // 驗證 Vercel Cron 授權
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const result = await prisma.job.updateMany({
    where: {
      status: { in: ["OPEN", "QUOTED"] },
      quoteDeadline: { lt: now },
    },
    data: { status: "EXPIRED" },
  });

  console.log(`[Cron] expire-jobs: ${result.count} jobs expired at ${now.toISOString()}`);
  return NextResponse.json({ expired: result.count, ts: now.toISOString() });
}
