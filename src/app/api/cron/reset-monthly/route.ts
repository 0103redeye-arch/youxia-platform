import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Vercel Cron：每月最後一天 23:30 重置月度統計
 * cron: "30 23 28-31 * *"  (每月 28-31 日都跑，自行判斷是否月底)
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 判斷是否真的是月底
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (tomorrow.getMonth() === today.getMonth()) {
    // 不是月底，跳過
    return NextResponse.json({ skipped: true, reason: "not last day of month" });
  }

  // 重置月度訂單計數
  const [masterResult, hallResult] = await Promise.all([
    prisma.masterProfile.updateMany({ data: { monthlyOrders: 0 } }),
    prisma.hall.updateMany({ data: { monthlyOrders: 0 } }),
  ]);

  console.log(`[Cron] reset-monthly: masters=${masterResult.count}, halls=${hallResult.count}`);
  return NextResponse.json({
    masters: masterResult.count,
    halls: hallResult.count,
    ts: today.toISOString(),
  });
}
