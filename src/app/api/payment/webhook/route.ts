import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCheckMacValue } from "@/lib/ecpay";

/**
 * POST /api/payment/webhook
 * 綠界 ECPay 付款結果通知（ReturnURL）
 *
 * 注意：此路由必須是公開 HTTPS，本地開發用 ngrok 暴露：
 *   npx ngrok http 3010
 *   → 填 https://xxxx.ngrok.io/api/payment/webhook 到 ECPay 後台
 */
export async function POST(req: NextRequest) {
  // 綠界用 application/x-www-form-urlencoded 發送
  const body = await req.text();
  const params: Record<string, string> = Object.fromEntries(
    new URLSearchParams(body)
  );

  console.log("[ECPay Webhook]", params);

  // 驗證 CheckMacValue 防止偽造
  if (!verifyCheckMacValue(params)) {
    console.error("[ECPay Webhook] CheckMacValue 驗證失敗");
    return new NextResponse("0|CheckMacValue Error", { status: 200 }); // 綠界要求回 200
  }

  const { RtnCode, CustomField1: orderId, MerchantTradeNo } = params;

  if (!orderId) {
    return new NextResponse("0|Missing orderId", { status: 200 });
  }

  if (RtnCode === "1") {
    // 付款成功
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (order && order.status === "PENDING_PAYMENT") {
      await prisma.$transaction([
        prisma.order.update({
          where: { id: orderId },
          data: {
            status: "PAID",
            paidAt: new Date(),
            paymentTradeNo: MerchantTradeNo,
          },
        }),
        // 通知師傅
        prisma.notification.create({
          data: {
            userId: order.masterId,
            type: "ORDER_PAID",
            title: "💰 客戶已付款！",
            body: "客戶已完成付款，請與客戶確認施工時間。",
            data: JSON.stringify({ orderId }),
          },
        }),
        // 通知客戶
        prisma.notification.create({
          data: {
            userId: order.clientId,
            type: "ORDER_PAID",
            title: "✅ 付款成功",
            body: "付款已完成，師傅將盡快與你確認施工時間。",
            data: JSON.stringify({ orderId }),
          },
        }),
      ]);
      console.log(`[ECPay Webhook] 訂單 ${orderId} 付款成功`);
    }
  } else {
    // 付款失敗
    console.log(`[ECPay Webhook] 訂單 ${orderId} 付款失敗，RtnCode=${RtnCode}`);
    // 不更新狀態，讓客戶重試
  }

  // 必須回傳 "1|OK" 告知綠界已收到
  return new NextResponse("1|OK", { status: 200 });
}
