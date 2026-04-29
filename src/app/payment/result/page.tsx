"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";

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
        const res = await fetch(`/api/orders/${orderId}`);
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
      <div className="flex flex-col items-center justify-center flex-1 py-24">
        <div className="animate-spin text-6xl mb-6">⏳</div>
        <p className="text-slate-700 text-lg font-medium">確認付款結果中…</p>
        <p className="text-slate-500 text-sm mt-2">請稍候，最多等待 10 秒</p>
      </div>
    );
  }

  if (status === "paid") {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-24 text-center px-6">
        <div className="text-8xl mb-6">✅</div>
        <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">付款成功！</h1>
        <p className="text-base text-slate-700 mb-8">師傅將盡快與您確認施工時間。</p>
        {orderId && (
          <Link
            href={`/order/${orderId}`}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-9 py-4 rounded-xl transition-colors text-base"
          >
            查看訂單 →
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-24 text-center px-6">
      <div className="text-8xl mb-6">❌</div>
      <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">付款未完成</h1>
      <p className="text-base text-slate-700 mb-8">請返回訂單頁重新嘗試付款。</p>
      {orderId && (
        <Link
          href={`/order/${orderId}`}
          className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-9 py-4 rounded-xl transition-colors text-base"
        >
          返回訂單
        </Link>
      )}
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      <Navbar />
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center flex-1 py-24">
          <div className="animate-spin text-6xl">⏳</div>
        </div>
      }>
        <PaymentResultInner />
      </Suspense>
    </div>
  );
}
