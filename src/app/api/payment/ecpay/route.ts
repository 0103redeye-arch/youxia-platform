import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/getAuthUser";
import { buildPaymentForm } from "@/lib/ecpay";

/**
 * POST /api/payment/ecpay
 * 建立 ECPay 付款表單，回傳 form 欄位與 URL
 */
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user?.id) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const { orderId } = await req.json().catch(() => ({}));
  if (!orderId) return NextResponse.json({ error: "缺少 orderId" }, { status: 400 });

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { job: { select: { title: true } } },
  });

  if (!order) return NextResponse.json({ error: "找不到訂單" }, { status: 404 });
  if (order.clientId !== user.id) return NextResponse.json({ error: "無權限" }, { status: 403 });
  if (order.status !== "PENDING_PAYMENT") return NextResponse.json({ error: "訂單狀態不符" }, { status: 400 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://youxia.app";

  const { params, tradeNo, formUrl } = buildPaymentForm({
    orderId:      order.id,
    amount:       order.totalAmount,
    itemName:     order.job.title.slice(0, 50),
    returnUrl:    `${appUrl}/payment/result?orderId=${order.id}`,
    notifyUrl:    `${appUrl}/api/payment/webhook`,
    clientBackUrl: `${appUrl}/order/${order.id}`,
  });

  // 記錄 tradeNo 供 webhook 對帳
  await prisma.order.update({
    where: { id: orderId },
    data: { paymentProvider: "ECPAY", paymentTradeNo: tradeNo },
  });

  return NextResponse.json({ formUrl, params });
}
