"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";

function PaymentResultInner() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [status, setStatus] = useState<"loading" | "paid" | "failed">("loading");

  useEffect(() => {
    if (!orderId) { setStatus("failed"); return; }

    // 輪詢最多 10 秒等 webhook 處理完
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/orders/${orderId}`, {
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          const order = await res.json();
          if (order.status !== "PENDING_PAYMENT") {
            setStatus("paid");
            clearInterval(poll);
          }
        }
      } catch { /* ignore */ }
      if (attempts >= 10) {
        setStatus("failed");
        clearInterval(poll);
      }
    }, 1000);

    return () => clearInterval(poll);
  }, [orderId]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="animate-spin text-5xl mb-6">⏳</div>
        <p className="text-gray-600 font-medium">確認付款結果中…</p>
      </div>
    );
  }

  if (status === "paid") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <div className="text-7xl mb-6">✅</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">付款成功！</h1>
        <p className="text-gray-500 mb-8">師傅將盡快與您確認施工時間。</p>
        {orderId && (
          <Link
            href={`/order/${orderId}`}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-xl transition-colors"
          >
            查看訂單 →
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <div className="text-7xl mb-6">❌</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">付款未完成</h1>
      <p className="text-gray-500 mb-8">請返回訂單頁重新嘗試付款。</p>
      {orderId && (
        <Link
          href={`/order/${orderId}`}
          className="bg-gray-800 hover:bg-gray-900 text-white font-bold px-8 py-3 rounded-xl transition-colors"
        >
          返回訂單
        </Link>
      )}
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-5xl">⏳</div>
      </div>
    }>
      <PaymentResultInner />
    </Suspense>
  );
}
