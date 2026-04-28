import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/getAuthUser";

export async function GET() {
  const user = await getAuthUser();
  if (!user?.id) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(notifications);
}

// 標記已讀
export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();
  if (!user?.id) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const { ids } = await req.json().catch(() => ({ ids: null }));

  if (ids && Array.isArray(ids)) {
    // 標記指定通知為已讀
    await prisma.notification.updateMany({
      where: { userId: user.id, id: { in: ids } },
      data: { isRead: true },
    });
  } else {
    // 全部標記已讀
    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });
  }

  return NextResponse.json({ success: true });
}
