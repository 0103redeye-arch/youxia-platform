import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/getAuthUser";
import { MIN_TRANSACTION_QUIRKY, MIN_TRANSACTION_NORMAL } from "@/constants/fees";
import { z } from "zod";

const CreateQuoteSchema = z.object({
  jobId:          z.string(),
  price:          z.number().min(MIN_TRANSACTION_QUIRKY, `報價最低 NT$${MIN_TRANSACTION_QUIRKY}`),
  description:    z.string().min(10),
  availableDate:  z.string().optional(),   // 選填，預設明天
  estimatedHours: z.number().positive().optional(),
});

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user?.id) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = CreateQuoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { jobId, price, description, availableDate } = parsed.data;
  const avDate = availableDate
    ? new Date(availableDate)
    : new Date(Date.now() + 24 * 60 * 60 * 1000); // 預設明天

  // 確認案件存在且可接單（OPEN 或 QUOTED 都允許繼續報價，ASSIGNED 以後才關閉）
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  const acceptingStatuses = ["OPEN", "QUOTED"];
  if (!job || !acceptingStatuses.includes(job.status)) {
    return NextResponse.json({ error: "案件不存在或已關閉" }, { status: 400 });
  }

  // 不能對自己的案件報價
  if (job.clientId === user.id) {
    return NextResponse.json({ error: "不能對自己的案件報價" }, { status: 400 });
  }

  const quote = await prisma.quote.upsert({
    where: { jobId_masterId: { jobId, masterId: user.id } },
    update: { price, description, availableDate: avDate },
    create: {
      jobId,
      masterId: user.id,
      price,
      description,
      availableDate: avDate,
    },
  });

  // 案件有報價時同步更新狀態（只有 OPEN → QUOTED 方向，不降級）
  if (job.status === "OPEN") {
    await prisma.job.update({
      where: { id: jobId },
      data:  { status: "QUOTED" },
    });
  }

  // 通知發案客戶
  const master = await prisma.user.findUnique({ where: { id: user.id }, select: { name: true } });
  await prisma.notification.create({
    data: {
      userId: job.clientId,
      type:   "NEW_QUOTE",
      title:  "你的案件收到新報價",
      body:   `${master?.name ?? "一位遊俠"} 對「${job.title}」報價 NT$${price.toLocaleString()}`,
      data:   JSON.stringify({ jobId }),
    },
  }).catch(() => {}); // 不讓通知失敗影響主流程

  return NextResponse.json({ id: quote.id }, { status: 201 });
}
