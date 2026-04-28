import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calcYouxiaLevel, getYouxiaTitle } from "@/constants/fees";

/**
 * Vercel Cron：每月 1 日 00:00 重算遊俠等級
 * cron: "0 0 1 * *"
 *
 * 每個遊俠的等級根據 rolling 90 天的「已完成訂單數」與「平均評分」計算。
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  // 撈出所有啟用中的師傅
  const masters = await prisma.masterProfile.findMany({
    select: { id: true, userId: true, youxiaLevel: true },
  });

  let updated = 0;

  for (const master of masters) {
    // 90 天完成訂單數
    const completed90 = await prisma.order.count({
      where: {
        masterId: master.userId,
        status: "COMPLETED",
        completedAt: { gte: ninetyDaysAgo },
      },
    });

    // 90 天平均評分（客戶給師傅的評分）
    const ratingAgg = await prisma.review.aggregate({
      where: {
        revieweeId: master.userId,
        direction: "CLIENT_TO_MASTER",
        createdAt: { gte: ninetyDaysAgo },
      },
      _avg: { overallRating: true },
      _count: true,
    });

    const avgRating = ratingAgg._avg.overallRating ?? 0;
    const newLevel = calcYouxiaLevel(completed90, avgRating);

    if (newLevel !== master.youxiaLevel) {
      await prisma.masterProfile.update({
        where: { id: master.id },
        data: {
          youxiaLevel: newLevel,
          youxiaTitle: getYouxiaTitle(newLevel),
          avgRating,
        },
      });

      // 升/降級通知
      const isUp = newLevel > master.youxiaLevel;
      await prisma.notification.create({
        data: {
          userId: master.userId,
          type: isUp ? "LEVEL_UP" : "LEVEL_DOWN",
          title: isUp
            ? `🎉 恭喜升級！Lv.${newLevel} ${getYouxiaTitle(newLevel)}`
            : `📊 等級調整 Lv.${newLevel} ${getYouxiaTitle(newLevel)}`,
          body: isUp
            ? `你的努力有了回報！繼續加油，更高等級還在等你。`
            : `最近 90 天數據更新，繼續完成更多案件就能回升喔！`,
        },
      });

      updated++;
    }
  }

  console.log(`[Cron] recalculate-levels: ${updated}/${masters.length} updated`);
  return NextResponse.json({ total: masters.length, updated });
}
