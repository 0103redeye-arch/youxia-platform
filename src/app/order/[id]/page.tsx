import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDate } from "@/lib/utils";
import { getYouxiaTitle } from "@/constants/fees";
import {
  MapPin, Star, CheckCircle2, Clock, Banknote,
  AlertTriangle, Camera, Sword,
} from "lucide-react";

const ORDER_STATUS: Record<string, { label: string; color: string; desc: string }> = {
  PENDING_PAYMENT: { label: "等待付款",   color: "bg-yellow-100 text-yellow-800", desc: "請完成付款以啟動訂單" },
  PAID:            { label: "已付款",     color: "bg-blue-100 text-blue-800",    desc: "師傅確認後即開始排程" },
  SCHEDULED:       { label: "已排程",     color: "bg-blue-100 text-blue-800",    desc: "等待師傅上門施工" },
  IN_PROGRESS:     { label: "施工中",     color: "bg-orange-100 text-orange-800", desc: "師傅正在施工" },
  PENDING_CONFIRM: { label: "待客戶確認", color: "bg-purple-100 text-purple-800", desc: "師傅已標記完工，請確認" },
  COMPLETED:       { label: "已完成",     color: "bg-green-100 text-green-800",  desc: "訂單已完成" },
  DISPUTED:        { label: "申訴中",     color: "bg-red-100 text-red-800",      desc: "客服處理中，請耐心等候" },
  REFUNDED:        { label: "已退款",     color: "bg-slate-100 text-slate-800",  desc: "款項已退回" },
};

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      job: {
        select: {
          id: true, title: true, description: true, city: true,
          district: true, preferredDate: true,
          issue: { select: { label: true, parentCategory: true } },
        },
      },
      quote: { select: { price: true, description: true, availableDate: true } },
      reviews: {
        where: { reviewerId: session.user.id },
        select: { id: true, overallRating: true, comment: true },
      },
    },
  });

  if (!order) notFound();

  const isClient = order.clientId === session.user.id;
  const isMaster = order.masterId === session.user.id;
  if (!isClient && !isMaster) redirect("/dashboard");

  const masterProfile = isClient
    ? await prisma.masterProfile.findUnique({
        where: { userId: order.masterId },
        select: { displayName: true, youxiaLevel: true, avgRating: true, totalReviews: true },
      })
    : null;

  const statusInfo = ORDER_STATUS[order.status] ?? {
    label: order.status, color: "bg-slate-100 text-slate-800", desc: ""
  };
  const myReview = order.reviews[0] ?? null;
  const completionPhotos: string[] = (() => {
    try { return JSON.parse(order.completionPhotos || "[]"); } catch { return []; }
  })();

  // ── Server Actions (use Prisma directly, no internal fetch) ──

  async function startWork() {
    "use server";
    const sess = await auth();
    if (!sess?.user) return;
    await prisma.order.update({
      where: { id: params.id, masterId: sess.user.id, status: "PAID" },
      data:  { status: "IN_PROGRESS" },
    });
    redirect(`/order/${params.id}`);
  }

  async function markComplete() {
    "use server";
    const sess = await auth();
    if (!sess?.user) return;
    await prisma.order.update({
      where: { id: params.id, masterId: sess.user.id, status: "IN_PROGRESS" },
      data:  { status: "PENDING_CONFIRM", completedAt: new Date() },
    });
    redirect(`/order/${params.id}`);
  }

  async function confirmComplete() {
    "use server";
    const sess = await auth();
    if (!sess?.user) return;
    const updated = await prisma.order.update({
      where: { id: params.id, clientId: sess.user.id, status: "PENDING_CONFIRM" },
      data:  { status: "COMPLETED" },
    });
    // Increment master's order counts
    await prisma.masterProfile.updateMany({
      where: { userId: updated.masterId },
      data:  { totalOrders: { increment: 1 }, monthlyOrders: { increment: 1 } },
    });
    redirect(`/order/${params.id}`);
  }

  async function raiseDispute() {
    "use server";
    const sess = await auth();
    if (!sess?.user) return;
    await prisma.order.update({
      where: { id: params.id, clientId: sess.user.id, status: "PENDING_CONFIRM" },
      data:  { status: "DISPUTED" },
    });
    redirect(`/order/${params.id}`);
  }

  return (
    <div className="min-h-screen pb-24 md:pb-0 bg-[#f8f9fa]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-5 py-10 flex flex-col gap-6">

        {/* ── 狀態橫幅 ── */}
        <div className={`rounded-2xl px-6 py-5 flex items-start justify-between gap-4 ${statusInfo.color}`}>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-black text-xl">{statusInfo.label}</span>
              <span className="text-sm opacity-70">#{params.id.slice(-8).toUpperCase()}</span>
            </div>
            <p className="text-sm opacity-80">{statusInfo.desc}</p>
          </div>
          <div className="text-2xl font-black shrink-0">{formatPrice(order.totalAmount)}</div>
        </div>

        {/* ── 案件資訊 ── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">案件資訊</h2>
          <p className="text-xl font-bold text-slate-900 mb-2">{order.job.title}</p>
          {order.job.issue && (
            <p className="text-sm font-semibold text-orange-600 mb-3">
              {order.job.issue.parentCategory} · {order.job.issue.label}
            </p>
          )}
          <p className="text-base text-slate-700 mb-4 leading-relaxed">{order.job.description}</p>
          <div className="flex flex-wrap gap-4 text-sm text-slate-600 pt-4 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-400" />
              {order.job.city} {order.job.district}
            </span>
            {order.job.preferredDate && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                希望日期：{formatDate(order.job.preferredDate)}
              </span>
            )}
          </div>
        </div>

        {/* ── 報價 / 費用明細 ── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">費用明細</h2>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between text-base">
              <span className="text-slate-700">服務金額</span>
              <span className="font-semibold text-slate-900">{formatPrice(order.totalAmount)}</span>
            </div>
            {isClient && (
              <div className="flex justify-between text-sm text-slate-600">
                <span>平台服務費（含於報價中）</span>
                <span>{formatPrice(order.platformFee)}</span>
              </div>
            )}
            {isMaster && (
              <>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>平台手續費（{Math.round(order.feeRate * 100)}%）</span>
                  <span>－{formatPrice(order.platformFee)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-green-700 pt-2 border-t border-slate-100">
                  <span>你的實收</span>
                  <span>{formatPrice(order.masterPayout)}</span>
                </div>
              </>
            )}
            {order.quote.description && (
              <p className="text-sm text-slate-600 pt-2 border-t border-slate-100 leading-relaxed">
                {order.quote.description}
              </p>
            )}
            <span className="flex items-center gap-1.5 text-sm text-slate-600">
              <Clock className="w-4 h-4 text-slate-400" />
              可施工日：{formatDate(order.quote.availableDate)}
            </span>
          </div>
        </div>

        {/* ── 師傅資訊（客戶視角） ── */}
        {isClient && masterProfile && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">你的遊俠</h2>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center">
                <Sword className="w-7 h-7 text-orange-500" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-base">{masterProfile.displayName}</p>
                <p className="text-sm text-slate-600">
                  {getYouxiaTitle(masterProfile.youxiaLevel)} · Lv.{masterProfile.youxiaLevel}
                </p>
                {masterProfile.avgRating > 0 && (
                  <p className="text-sm text-slate-600 flex items-center gap-1 mt-0.5">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    {masterProfile.avgRating.toFixed(1)}（{masterProfile.totalReviews} 則評分）
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── 完工照片 ── */}
        {completionPhotos.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-slate-500" />
              完工照片
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {completionPhotos.map((url, i) => (
                <img
                  key={i} src={url} alt={`完工照 ${i + 1}`}
                  className="w-full aspect-square object-cover rounded-xl border border-slate-100"
                />
              ))}
            </div>
          </div>
        )}

        {/* ── 付款按鈕（客戶 + PENDING_PAYMENT） ── */}
        {isClient && order.status === "PENDING_PAYMENT" && (
          <div className="bg-yellow-50 rounded-2xl border border-yellow-200 p-6">
            <div className="flex items-start gap-3 mb-5">
              <Banknote className="w-6 h-6 text-yellow-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-yellow-800 text-base">等待付款</p>
                <p className="text-sm text-yellow-700 mt-1">
                  完成付款後，款項由平台代管，完工確認後才撥款給師傅。
                </p>
              </div>
            </div>
            <Link
              href={`/payment/start?orderId=${params.id}`}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold h-12 rounded-xl transition-colors text-base"
            >
              <Banknote className="w-5 h-5" />
              前往付款 {formatPrice(order.totalAmount)}
            </Link>
          </div>
        )}

        {/* ── 師傅操作（PAID → 開始施工） ── */}
        {isMaster && order.status === "PAID" && (
          <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
            <p className="font-bold text-blue-800 text-base mb-2">客戶已付款</p>
            <p className="text-sm text-blue-700 mb-5">確認接案並開始排程後，請按下開始施工。</p>
            <form action={startWork}>
              <Button type="submit" className="w-full h-12 text-base font-bold rounded-xl bg-blue-600 hover:bg-blue-700">
                ▶ 開始施工
              </Button>
            </form>
          </div>
        )}

        {/* ── 師傅操作（IN_PROGRESS → 標記完工） ── */}
        {isMaster && order.status === "IN_PROGRESS" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <p className="font-bold text-slate-900 text-base mb-2">施工完成了嗎？</p>
            <p className="text-sm text-slate-600 mb-5">標記完工後，客戶將收到通知進行確認。</p>
            <form action={markComplete}>
              <Button type="submit" className="w-full h-12 text-base font-bold rounded-xl bg-green-600 hover:bg-green-700">
                ✅ 標記完工
              </Button>
            </form>
          </div>
        )}

        {/* ── 客戶操作（PENDING_CONFIRM → 確認 or 申訴） ── */}
        {isClient && order.status === "PENDING_CONFIRM" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-start gap-3 mb-5">
              <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900 text-base">師傅已標記完工</p>
                <p className="text-sm text-slate-600 mt-1">
                  確認無誤後，款項將於 T+3 撥款給師傅。若有問題可發起申訴。
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <form action={confirmComplete} className="flex-1">
                <Button type="submit" className="w-full h-11 text-base font-bold rounded-xl bg-green-600 hover:bg-green-700">
                  ✅ 確認完工
                </Button>
              </form>
              <form action={raiseDispute}>
                <Button
                  type="submit"
                  variant="outline"
                  className="h-11 px-5 text-base font-semibold rounded-xl border-red-300 text-red-600 hover:bg-red-50"
                >
                  ⚠️ 有問題
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* ── 評分區（完成後，尚未評分） ── */}
        {order.status === "COMPLETED" && !myReview && (
          <div className="bg-orange-50 rounded-2xl border border-orange-200 p-6">
            <p className="font-bold text-orange-800 text-base mb-2">
              {isClient ? "為遊俠留下評分" : "為客戶留下評分"}
            </p>
            <p className="text-sm text-orange-700 mb-4">
              {isClient ? "你的評分將幫助其他人找到好師傅。" : "真誠的評分讓平台更健康。"}
            </p>
            <Link
              href={`/review/${params.id}`}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-colors text-base"
            >
              <Star className="w-4 h-4" />
              立即評分
            </Link>
          </div>
        )}

        {/* ── 已評分 ── */}
        {myReview && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <p className="font-bold text-slate-900 text-base mb-3">你的評分</p>
            <div className="flex items-center gap-1.5 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < myReview.overallRating
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-slate-200 fill-slate-200"
                  }`}
                />
              ))}
              <span className="text-base font-semibold text-slate-800 ml-1">
                {myReview.overallRating}.0
              </span>
            </div>
            {myReview.comment && (
              <p className="text-sm text-slate-700 italic">「{myReview.comment}」</p>
            )}
          </div>
        )}

        {/* ── 申訴中提示 ── */}
        {order.status === "DISPUTED" && (
          <div className="bg-red-50 rounded-2xl border border-red-200 p-6 flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-800 text-base">申訴處理中</p>
              <p className="text-sm text-red-700 mt-1">
                客服人員將聯絡雙方了解情況，通常在 1–3 個工作天內處理完畢。
              </p>
            </div>
          </div>
        )}

        {/* ── 底部導航 ── */}
        <div className="flex gap-3">
          <Link
            href="/dashboard"
            className="flex-1 text-center py-3 text-base font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            回我的主頁
          </Link>
          <Link
            href={`/jobs/${order.job.id}`}
            className="flex-1 text-center py-3 text-base font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            查看案件
          </Link>
        </div>

      </div>
      <BottomNav />
    </div>
  );
}
