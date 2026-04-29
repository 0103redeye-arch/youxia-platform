import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, timeAgo } from "@/lib/utils";
import { getYouxiaTitle, getYouxiaLevel } from "@/constants/fees";
import { Sword, Star, PlusCircle, Briefcase, ShoppingBag, AlertCircle } from "lucide-react";

const JOB_STATUS_LABEL: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" | "outline" }> = {
  OPEN:            { label: "等待報價",   variant: "secondary" },
  QUOTED:          { label: "有報價了",   variant: "default" },
  ASSIGNED:        { label: "已選定遊俠", variant: "warning" },
  IN_PROGRESS:     { label: "施工中",     variant: "warning" },
  PENDING_CONFIRM: { label: "等待確認",   variant: "warning" },
  COMPLETED:       { label: "已完成",     variant: "success" },
  CANCELLED:       { label: "已取消",     variant: "destructive" },
  EXPIRED:         { label: "已過期",     variant: "outline" },
};

const ORDER_STATUS_LABEL: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" | "outline"; urgent?: boolean }> = {
  PENDING_PAYMENT: { label: "⚡ 待付款",   variant: "destructive", urgent: true },
  PAID:            { label: "已付款",       variant: "default" },
  SCHEDULED:       { label: "已排程",       variant: "default" },
  IN_PROGRESS:     { label: "施工中",       variant: "warning" },
  PENDING_CONFIRM: { label: "待確認完工",   variant: "warning", urgent: true },
  COMPLETED:       { label: "已完成",       variant: "success" },
  DISPUTED:        { label: "申訴中",       variant: "destructive" },
  REFUNDED:        { label: "已退款",       variant: "outline" },
};

// Active order statuses that need user attention
const ACTIVE_ORDER_STATUSES = [
  "PENDING_PAYMENT", "PAID", "SCHEDULED", "IN_PROGRESS", "PENDING_CONFIRM", "DISPUTED"
];

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id!;

  const [myJobs, myQuotes, profile, activeOrders] = await Promise.all([
    prisma.job.findMany({
      where: { clientId: userId },
      include: { _count: { select: { quotes: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.quote.findMany({
      where: { masterId: userId },
      include: {
        job: { select: { id: true, title: true, status: true } },
        order: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.masterProfile.findUnique({ where: { userId } }),
    prisma.order.findMany({
      where: {
        OR: [{ clientId: userId }, { masterId: userId }],
        status: { in: ACTIVE_ORDER_STATUSES },
      },
      include: {
        job: { select: { title: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
  ]);

  const hasUrgentOrders = activeOrders.some(
    o => o.status === "PENDING_PAYMENT" || o.status === "PENDING_CONFIRM"
  );

  return (
    <div className="min-h-screen pb-24 md:pb-0 bg-[#f8f9fa]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-5 py-10 flex flex-col gap-8">
        <h1 className="text-2xl font-bold text-slate-900">我的主頁</h1>

        {/* 遊俠資訊卡 */}
        {profile && (
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl text-white p-6 flex items-center gap-5 shadow-lg shadow-orange-200">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <Sword className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-xl mb-0.5">{profile.displayName}</p>
              <p className="text-orange-100 text-base">{getYouxiaTitle(profile.youxiaLevel)} · Lv.{profile.youxiaLevel}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-white/90">
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-yellow-300 text-yellow-300" />
                  {profile.avgRating.toFixed(1)}
                </span>
                <span>{profile.totalOrders} 筆完成</span>
                <span className="text-white/70 hidden sm:inline">{getYouxiaLevel(profile.youxiaLevel).perks}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── 進行中訂單（最重要，放最前面） ── */}
        {activeOrders.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-slate-600" />
                進行中訂單
                {hasUrgentOrders && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </h2>
            </div>
            <div className="flex flex-col gap-3">
              {activeOrders.map((order) => {
                const s = ORDER_STATUS_LABEL[order.status] ?? { label: order.status, variant: "secondary" as const };
                const isClient = order.clientId === userId;
                return (
                  <Link key={order.id} href={`/order/${order.id}`}>
                    <div className={`bg-white rounded-2xl border transition-colors cursor-pointer p-5 flex items-center justify-between gap-4 ${
                      s.urgent ? "border-orange-300 hover:border-orange-400" : "border-slate-200 hover:border-orange-300"
                    }`}>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base text-slate-900 truncate mb-1">{order.job.title}</p>
                        <p className="text-sm text-slate-600">
                          {isClient ? "我是客戶" : "我是遊俠"} · {formatPrice(order.totalAmount)}
                        </p>
                      </div>
                      <Badge variant={s.variant} className="text-sm px-3 py-1 shrink-0">{s.label}</Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 我發的案件 ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-slate-600" />我發的案件
            </h2>
            <Button asChild size="sm" variant="outline" className="text-sm font-semibold h-9 rounded-lg px-4">
              <Link href="/post-job">
                <PlusCircle className="w-4 h-4 mr-1.5" />發新案
              </Link>
            </Button>
          </div>

          {myJobs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 py-10 text-center px-6">
              <p className="text-slate-600 text-base mb-4">還沒有發過案件</p>
              <Button asChild className="h-11 px-6 text-base font-semibold rounded-xl">
                <Link href="/post-job">立即發案</Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {myJobs.map((job) => {
                const s = JOB_STATUS_LABEL[job.status] ?? { label: job.status, variant: "secondary" as const };
                return (
                  <Link key={job.id} href={`/jobs/${job.id}`}>
                    <div className="bg-white rounded-2xl border border-slate-200 hover:border-orange-300 transition-colors cursor-pointer p-5 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base text-slate-900 truncate mb-1">{job.title}</p>
                        <p className="text-sm text-slate-600">
                          {timeAgo(job.createdAt)} · {job._count.quotes} 個報價
                        </p>
                      </div>
                      <Badge variant={s.variant} className="text-sm px-3 py-1 shrink-0">{s.label}</Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 我的報價（遊俠視角） ── */}
        {myQuotes.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Sword className="w-5 h-5 text-slate-600" />我的報價
            </h2>
            <div className="flex flex-col gap-3">
              {myQuotes.map((q) => {
                // ACCEPTED quotes with an order → link directly to order
                const href = q.status === "ACCEPTED" && q.order
                  ? `/order/${q.order.id}`
                  : `/jobs/${q.job.id}`;

                return (
                  <Link key={q.id} href={href}>
                    <div className="bg-white rounded-2xl border border-slate-200 hover:border-orange-300 transition-colors cursor-pointer p-5 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base text-slate-900 truncate mb-1">{q.job.title}</p>
                        <p className="text-sm text-slate-600">
                          {timeAgo(q.createdAt)} · 報價 {formatPrice(q.price)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          q.status === "ACCEPTED" ? "success" :
                          q.status === "REJECTED" ? "destructive" : "secondary"
                        }
                        className="text-sm px-3 py-1 shrink-0"
                      >
                        {q.status === "ACCEPTED" ? "已接受" : q.status === "REJECTED" ? "未選中" : "等待中"}
                      </Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* 成為遊俠 CTA */}
        {!profile && (
          <div className="bg-orange-50 rounded-2xl border border-orange-200 p-7 text-center">
            <Sword className="w-12 h-12 text-orange-500 mx-auto mb-3" />
            <p className="font-bold text-orange-800 text-lg mb-2">踏入江湖，成為遊俠</p>
            <p className="text-base text-orange-700 mb-5">用真本事接案、累積聲望，等級越高享有越多特權。</p>
            <Button asChild className="h-11 px-6 text-base font-semibold rounded-xl">
              <Link href="/become-master">加入遊俠</Link>
            </Button>
          </div>
        )}

      </div>
      <BottomNav />
    </div>
  );
}
