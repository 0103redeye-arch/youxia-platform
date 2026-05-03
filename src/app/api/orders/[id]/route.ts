import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/getAuthUser";
import { z } from "zod";

const UpdateOrderSchema = z.object({
  action: z.enum([
    "start",           // 師傅：PAID → IN_PROGRESS
    "complete",        // 師傅：IN_PROGRESS → PENDING_CONFIRM (上傳完工照)
    "confirm",         // 客戶：PENDING_CONFIRM → COMPLETED
    "dispute",         // 客戶：PENDING_CONFIRM → DISPUTED
  ]),
  completionPhotos: z.array(z.string()).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser();
  if (!user?.id) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      job: {
        include: {
          issue: { select: { label: true, parentCategory: true } },
          client: { select: { id: true, name: true } },
        },
      },
      quote: true,
      reviews: true,
    },
  });

  if (!order) return NextResponse.json({ error: "找不到訂單" }, { status: 404 });

  // 只有訂單的客戶或師傅可查看
  if (order.clientId !== user.id && order.masterId !== user.id) {
    return NextResponse.json({ error: "無權限" }, { status: 403 });
  }

  return NextResponse.json({
    ...order,
    myRole: order.clientId === user.id ? "CLIENT" : "MASTER",
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser();
  if (!user?.id) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = UpdateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { action, completionPhotos } = parsed.data;

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: "找不到訂單" }, { status: 404 });

  const isMaster = order.masterId === user.id;
  const isClient = order.clientId === user.id;

  if (!isMaster && !isClient) {
    return NextResponse.json({ error: "無權限" }, { status: 403 });
  }

  // helper: fire-and-forget notification
  async function notify(userId: string, type: string, title: string, body: string) {
    await prisma.notification.create({
      data: { userId, type, title, body, data: JSON.stringify({ orderId: params.id }) },
    }).catch(() => {});
  }

  switch (action) {
    case "start": {
      if (!isMaster) return NextResponse.json({ error: "只有師傅可操作" }, { status: 403 });
      if (order.status !== "PAID") return NextResponse.json({ error: "訂單未付款或狀態不符" }, { status: 400 });
      await prisma.order.update({
        where: { id: params.id },
        data: { status: "IN_PROGRESS", startedAt: new Date() },
      });
      await notify(order.clientId, "ORDER_STARTED", "師傅已開始施工", "你的訂單正在施工中，完工後會通知你確認");
      break;
    }
    case "complete": {
      if (!isMaster) return NextResponse.json({ error: "只有師傅可操作" }, { status: 403 });
      if (order.status !== "IN_PROGRESS") return NextResponse.json({ error: "尚未開始施工" }, { status: 400 });
      await prisma.order.update({
        where: { id: params.id },
        data: {
          status: "PENDING_CONFIRM",
          completionPhotos: JSON.stringify(completionPhotos ?? []),
        },
      });
      await notify(order.clientId, "ORDER_COMPLETED", "⚡ 師傅已完工，請確認", "請進入訂單確認完工，或申請複查");
      break;
    }
    case "confirm": {
      if (!isClient) return NextResponse.json({ error: "只有客戶可確認完工" }, { status: 403 });
      if (order.status !== "PENDING_CONFIRM") return NextResponse.json({ error: "師傅尚未標記完工" }, { status: 400 });
      await prisma.$transaction([
        prisma.order.update({
          where: { id: params.id },
          data: { status: "COMPLETED", clientConfirmed: true, completedAt: new Date() },
        }),
        prisma.job.update({
          where: { id: order.jobId },
          data: { status: "COMPLETED" },
        }),
        // 累計師傅接案數（totalOrders = 累計；monthlyOrders = 月度，用於區域宗師排名）
        prisma.masterProfile.updateMany({
          where: { userId: order.masterId },
          data: {
            totalOrders:   { increment: 1 },
            monthlyOrders: { increment: 1 },
          },
        }),
      ]);
      await notify(order.masterId, "ORDER_COMPLETED", "🎉 客戶確認完工！", "款項將於結算日撥入，感謝你的服務！");
      break;
    }
    case "dispute": {
      if (!isClient) return NextResponse.json({ error: "只有客戶可申請爭議" }, { status: 403 });
      if (order.status !== "PENDING_CONFIRM") return NextResponse.json({ error: "師傅尚未標記完工" }, { status: 400 });
      await prisma.order.update({
        where: { id: params.id },
        data: { status: "DISPUTED" },
      });
      await notify(order.masterId, "SYSTEM", "客戶申請爭議", "客戶對完工有疑問，客服人員將與你聯繫");
      break;
    }
  }

  return NextResponse.json({ success: true });
}
