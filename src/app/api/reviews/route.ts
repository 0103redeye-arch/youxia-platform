import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/getAuthUser";
import { z } from "zod";

const CreateReviewSchema = z.object({
  orderId:           z.string(),
  overallRating:     z.number().int().min(1).max(5),
  qualityRating:     z.number().int().min(1).max(5).optional(),
  punctualityRating: z.number().int().min(1).max(5).optional(),
  attitudeRating:    z.number().int().min(1).max(5).optional(),
  comment:           z.string().max(500).optional(),
  photos:            z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user?.id) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = CreateReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { orderId, overallRating, qualityRating, punctualityRating, attitudeRating, comment, photos } = parsed.data;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ error: "找不到訂單" }, { status: 404 });

  // 只有客戶或師傅可評分
  if (order.clientId !== user.id && order.masterId !== user.id) {
    return NextResponse.json({ error: "無權限" }, { status: 403 });
  }

  // 只有完成的訂單可評分
  if (order.status !== "COMPLETED") {
    return NextResponse.json({ error: "訂單尚未完成，無法評分" }, { status: 400 });
  }

  // direction: CLIENT_TO_MASTER or MASTER_TO_CLIENT
  const direction = order.clientId === user.id ? "CLIENT_TO_MASTER" : "MASTER_TO_CLIENT";
  const revieweeId = direction === "CLIENT_TO_MASTER" ? order.masterId : order.clientId;

  const review = await prisma.review.create({
    data: {
      orderId,
      reviewerId: user.id,
      revieweeId,
      direction,
      overallRating,
      qualityRating: qualityRating ?? null,
      punctualityRating: punctualityRating ?? null,
      attitudeRating: attitudeRating ?? null,
      comment: comment ?? null,
      photos: JSON.stringify(photos ?? []),
    },
  });

  // 更新師傅的平均分（只在客戶評師傅時更新）
  if (direction === "CLIENT_TO_MASTER") {
    const stats = await prisma.review.aggregate({
      where: { revieweeId: order.masterId, direction: "CLIENT_TO_MASTER" },
      _avg: { overallRating: true },
      _count: true,
    });
    await prisma.masterProfile.updateMany({
      where: { userId: order.masterId },
      data: {
        avgRating: stats._avg.overallRating ?? 0,
        totalReviews: stats._count,
      },
    });
  }

  return NextResponse.json({ id: review.id }, { status: 201 });
}
