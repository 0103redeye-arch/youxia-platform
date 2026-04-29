"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";

function PaymentStartInner() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const formRef = useRef<HTMLFormElement>(null);

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [formFields, setFormFields] = useState<Record<string, string>>({});
  const [formUrl, setFormUrl] = useState("");

  useEffect(() => {
    if (!orderId) {
      setErrorMsg("缺少訂單編號");
      setStatus("error");
      return;
    }

    fetch("/api/payment/ecpay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "建立付款失敗");
        return data;
      })
      .then(({ formUrl, params }) => {
        setFormUrl(formUrl);
        setFormFields(params as Record<string, string>);
        setStatus("ready");
      })
      .catch(err => {
        setErrorMsg(err.message ?? "付款初始化失敗");
        setStatus("error");
      });
  }, [orderId]);

  // Auto-submit once form is ready and rendered
  useEffect(() => {
    if (status === "ready" && formRef.current) {
      // Short delay so user sees the "跳轉中" message
      const t = setTimeout(() => formRef.current?.submit(), 800);
      return () => clearTimeout(t);
    }
  }, [status]);

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-24 text-center px-6">
        <div className="text-8xl mb-6">❌</div>
        <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">無法建立付款</h1>
        <p className="text-base text-slate-700 mb-8">{errorMsg || "請返回訂單頁重新嘗試"}</p>
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

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-24 text-center px-6">
      <div className="animate-spin text-6xl mb-6">⏳</div>
      <h1 className="text-2xl font-black text-slate-900 mb-3">正在跳轉至付款頁面</h1>
      <p className="text-base text-slate-600 mb-2">即將導向綠界科技安全付款…</p>
      <p className="text-sm text-slate-500">若未自動跳轉，請點擊下方按鈕</p>

      {/* Hidden ECPay form — auto-submitted */}
      {status === "ready" && (
        <form
          ref={formRef}
          action={formUrl}
          method="POST"
          className="mt-8"
        >
          {Object.entries(formFields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-9 py-4 rounded-xl transition-colors text-base"
          >
            前往付款 →
          </button>
        </form>
      )}

      {orderId && (
        <Link
          href={`/order/${orderId}`}
          className="mt-4 text-sm text-slate-500 hover:text-slate-700 underline"
        >
          取消，返回訂單
        </Link>
      )}
    </div>
  );
}

export default function PaymentStartPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      <Navbar />
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center flex-1 py-24">
          <div className="animate-spin text-6xl">⏳</div>
        </div>
      }>
        <PaymentStartInner />
      </Suspense>
    </div>
  );
}
