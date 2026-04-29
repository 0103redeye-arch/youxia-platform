import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/getAuthUser";
import { calculateFees } from "@/constants/fees";
import type { YouxiaLevel } from "@/constants/fees";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser();
  if (!user?.id) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  const quote = await prisma.quote.findUnique({
    where: { id: params.id },
    include: {
      job: true,
      master: {
        select: {
          id: true,
          masterProfile: { select: { youxiaLevel: true } },
        },
      },
    },
  });

  if (!quote) {
    return NextResponse.json({ error: "報價不存在" }, { status: 404 });
  }

  // 只有案件的發案人才能接受報價
  if (quote.job.clientId !== user.id) {
    return NextResponse.json({ error: "無權限" }, { status: 403 });
  }

  // 報價必須仍處於 PENDING 狀態（防止同一報價被雙重接受）
  if (quote.status !== "PENDING") {
    return NextResponse.json({ error: "此報價已被處理" }, { status: 400 });
  }

  // OPEN 和 QUOTED 都可接受報價；ASSIGNED 以後才真正結案
  if (!["OPEN", "QUOTED"].includes(quote.job.status)) {
    return NextResponse.json({ error: "此案件已結案" }, { status: 400 });
  }

  // 計算抽成
  const youxiaLevel = (quote.master.masterProfile?.youxiaLevel ?? 1) as YouxiaLevel;
  const { platformFee, masterPayout, feeRate } = calculateFees(quote.price, youxiaLevel);

  // 接受此報價，拒絕其他報價，更新案件狀態，建立訂單
  const [, , , order] = await prisma.$transaction([
    prisma.quote.update({
      where: { id: params.id },
      data: { status: "ACCEPTED" },
    }),
    prisma.quote.updateMany({
      where: { jobId: quote.jobId, id: { not: params.id } },
      data: { status: "REJECTED" },
    }),
    prisma.job.update({
      where: { id: quote.jobId },
      data: { status: "ASSIGNED" },
    }),
    prisma.order.create({
      data: {
        jobId:       quote.jobId,
        quoteId:     quote.id,
        clientId:    quote.job.clientId,
        masterId:    quote.masterId,
        totalAmount: quote.price,
        platformFee,
        feeRate,
        masterPayout,
        status:      "PENDING_PAYMENT",
      },
    }),
  ]);

  return NextResponse.json({ success: true, orderId: order.id });
}
