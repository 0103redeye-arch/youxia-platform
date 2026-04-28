import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/getAuthUser";
import { safeParseJson } from "@/lib/json";

export async function GET() {
  const user = await getAuthUser();
  if (!user?.id) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: {
      OR: [{ clientId: user.id }, { masterId: user.id }],
    },
    include: {
      job: {
        select: {
          id: true, title: true, city: true, district: true,
          issue: { select: { label: true, parentCategory: true } },
        },
      },
      quote: { select: { price: true, description: true } },
      reviews: {
        where: { reviewerId: user.id },
        select: { id: true, overallRating: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // 標記使用者角色（此訂單中）
  const result = orders.map((o) => ({
    ...o,
    myRole: o.clientId === user.id ? "CLIENT" : "MASTER",
    myReview: o.reviews[0] ?? null,
    reviews: undefined,
  }));

  return NextResponse.json(result);
}
