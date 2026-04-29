import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/getAuthUser";
import { sendSmsBatch } from "@/lib/sms";
import { z } from "zod";

const CreateJobSchema = z.object({
  issueId:       z.string(),
  title:         z.string().min(2),
  description:   z.string().min(10),
  city:          z.string(),
  district:      z.string().optional(),
  address:       z.string().optional(),
  budgetMin:     z.number().positive().nullable().optional(),
  budgetMax:     z.number().positive().nullable().optional(),
  preferredDate: z.string().nullable().optional(),
  jobType:       z.enum(["LICENSED", "OPEN"]),
});

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user?.id) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = CreateJobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const deadline = new Date(Date.now() + 48 * 60 * 60 * 1000);

  const job = await prisma.job.create({
    data: {
      clientId:      user.id,
      issueId:       data.issueId,
      title:         data.title,
      description:   data.description,
      city:          data.city,
      district:      data.district ?? "",
      address:       data.address ?? "",
      budgetMin:     data.budgetMin ?? null,
      budgetMax:     data.budgetMax ?? null,
      preferredDate: data.preferredDate ? new Date(data.preferredDate) : null,
      jobType:       data.jobType,
      quoteDeadline: deadline,
    },
  });

  // ── 非同步通知附近師傅（不 await，不阻塞回應）──
  notifyNearbyMasters({
    jobId:       job.id,
    posterUserId: user.id,
    title:       data.title,
    city:        data.city,
    district:    data.district ?? "",
    jobType:     data.jobType,
    budgetMax:   data.budgetMax ?? null,
  }).catch((e) => console.error("[SMS notify error]", e));

  return NextResponse.json({ id: job.id }, { status: 201 });
}

async function notifyNearbyMasters(params: {
  jobId: string;
  posterUserId: string;
  title: string;
  city: string;
  district: string;
  jobType: "LICENSED" | "OPEN";
  budgetMax: number | null;
}) {
  const { jobId, posterUserId, title, city, district, jobType, budgetMax } = params;

  // 撈出可接案的師傅（相同縣市、可接案中），排除發案人本身
  const masters = await prisma.masterProfile.findMany({
    where: {
      isAvailable: true,
      userId: { not: posterUserId },  // 不通知發案人自己
      ...(jobType === "LICENSED" ? { isLicensed: true } : {}),
    },
    include: {
      user: { select: { phone: true } },
    },
  });

  // 過濾：serviceAreas（JSON 陣列）包含目標縣市
  const targets = masters.filter((m) => {
    try {
      const areas: string[] = JSON.parse(m.serviceAreas as string ?? "[]");
      return areas.includes(city);
    } catch {
      return false;
    }
  });

  if (targets.length === 0) return;

  const safeTitle  = title.replace(/[\r\n]/g, " ");   // 防 SMS 換行注入
  const budgetNote = budgetMax ? `，預算上限 NT$${budgetMax.toLocaleString()}` : "";
  const location   = district ? `${city}${district}` : city;
  const appUrl     = process.env.NEXT_PUBLIC_APP_URL ?? "https://youxia.app";

  const recipients = targets
    .filter((m) => !!m.user.phone)
    .map((m) => ({
      phone:   m.user.phone!,
      message: `【俠客行不行】新案件來了！\n` +
               `📋 ${safeTitle}\n` +
               `📍 ${location}${budgetNote}\n` +
               `👉 立即報價：${appUrl}/jobs/${jobId}`,
    }));

  console.log(`[SMS] 通知 ${recipients.length} 位師傅（共 ${targets.length} 位在冊）`);
  await sendSmsBatch(recipients);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city    = searchParams.get("city");
  const jobType = searchParams.get("jobType") as "LICENSED" | "OPEN" | null;

  // 若登入用戶是遊俠，標記哪些案件已報過價
  const authUser = await getAuthUser();

  const jobs = await prisma.job.findMany({
    where: {
      status: { in: ["OPEN", "QUOTED"] },  // 兩種狀態都開放瀏覽與報價
      ...(city    && { city }),
      ...(jobType && { jobType }),
    },
    include: {
      issue: true,
      _count: { select: { quotes: true } },
      ...(authUser ? {
        quotes: {
          where: { masterId: authUser.id },
          select: { id: true, price: true, status: true },
        },
      } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // 整理：myQuote = 已報價資訊，移除 quotes 陣列避免洩漏其他人的報價
  const result = jobs.map((job: any) => {
    const myQuote = job.quotes?.[0] ?? null;
    const { quotes: _, ...rest } = job;
    return { ...rest, myQuote };
  });

  return NextResponse.json(result);
}
