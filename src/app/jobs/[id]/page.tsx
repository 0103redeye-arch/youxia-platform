import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice, formatDate, timeAgo, hoursUntil } from "@/lib/utils";
import { calculateFees } from "@/constants/fees";
import type { YouxiaLevel } from "@/constants/fees";
import { getYouxiaTitle } from "@/constants/fees";
import { MapPin, Clock, Star, ShieldCheck, AlertTriangle } from "lucide-react";

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: {
      issue: true,
      client: true,
      quotes: {
        include: { master: { include: { masterProfile: true } } },
        orderBy: { price: "asc" },
      },
    },
  });
  if (!job) notFound();

  const isOwner = session?.user?.id === job.clientId;

  async function submitQuote(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user) redirect("/login");

    const jobId = params.id;
    const masterId = session.user.id!;
    const price = Number(formData.get("price"));
    const description = formData.get("description") as string;
    const availableDate = new Date(formData.get("availableDate") as string);

    await prisma.quote.upsert({
      where: { jobId_masterId: { jobId, masterId } },
      update: { price, description, availableDate },
      create: { jobId, masterId, price, description, availableDate },
    });

    await prisma.job.updateMany({
      where: { id: jobId, status: "OPEN" },
      data: { status: "QUOTED" },
    });

    redirect(`/jobs/${params.id}`);
  }

  async function acceptQuote(quoteId: string) {
    "use server";
    const session = await auth();
    if (!session?.user) redirect("/login");

    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        job: true,
        master: { select: { id: true, masterProfile: { select: { youxiaLevel: true } } } },
      },
    });
    if (!quote || quote.job.clientId !== session.user.id) return;

    // Prevent double-accept race condition
    if (quote.status !== "PENDING") return;
    if (!["OPEN", "QUOTED"].includes(quote.job.status)) return;

    const youxiaLevel = (quote.master.masterProfile?.youxiaLevel ?? 1) as YouxiaLevel;
    const { platformFee, masterPayout, feeRate } = calculateFees(quote.price, youxiaLevel);

    // Accept quote + reject others + update job + CREATE ORDER in one transaction
    const [, , , order] = await prisma.$transaction([
      prisma.quote.update({ where: { id: quoteId }, data: { status: "ACCEPTED" } }),
      prisma.quote.updateMany({
        where: { jobId: quote.jobId, id: { not: quoteId } },
        data: { status: "REJECTED" },
      }),
      prisma.job.update({ where: { id: quote.jobId }, data: { status: "ASSIGNED" } }),
      prisma.order.create({
        data: {
          jobId:       quote.jobId,
          quoteId:     quote.id,
          clientId:    quote.job.clientId,
          masterId:    quote.masterId,
          totalAmount: quote.price,
          platformFee,
          feeRate,
          masterPayout,
          status:      "PENDING_PAYMENT",
        },
      }),
    ]);

    redirect(`/order/${order.id}`);
  }

  return (
    <div className="min-h-screen pb-12 bg-[#f8f9fa]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-5 py-10 flex flex-col gap-6">

        {/* 案件詳情 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-start justify-between gap-3 mb-5">
            <h1 className="text-xl font-bold text-slate-900 leading-snug">{job.title}</h1>
            {job.jobType === "LICENSED" ? (
              <Badge variant="warning" className="flex items-center gap-1.5 shrink-0 text-sm px-3 py-1">
                <ShieldCheck className="w-4 h-4" />認證師傅限定
              </Badge>
            ) : (
              <Badge variant="success" className="shrink-0 text-sm px-3 py-1">遊俠皆可報價</Badge>
            )}
          </div>

          {job.issue.licenseNote && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200 mb-5">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800 leading-relaxed">{job.issue.licenseNote}</p>
            </div>
          )}

          <p className="text-base text-slate-800 leading-relaxed mb-5">{job.description}</p>

          <div className="flex flex-wrap gap-4 text-sm text-slate-600 pt-4 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-400" />{job.city} {job.district}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />{timeAgo(job.createdAt)}
            </span>
            {(job.budgetMin || job.budgetMax) && (
              <span>預算：{job.budgetMin ? formatPrice(job.budgetMin) : "不限"} ~ {job.budgetMax ? formatPrice(job.budgetMax) : "不限"}</span>
            )}
            {job.preferredDate && (
              <span>希望日期：{formatDate(job.preferredDate)}</span>
            )}
            {(() => {
              const h = hoursUntil(job.quoteDeadline);
              if (h < 0) return <span className="text-slate-500">⏰ 已截止</span>;
              return (
                <span className={h <= 6 ? "text-red-500 font-semibold" : "text-slate-600"}>
                  ⏰ {h <= 6 ? `僅剩 ${h} 小時` : `${h}h 截止`}
                </span>
              );
            })()}
          </div>
        </div>

        {/* 報價列表 */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            目前報價（{job.quotes.length} 位遊俠）
          </h2>
          {job.quotes.length === 0 && (
            <p className="text-base text-slate-600 py-4">還沒有遊俠報價，請耐心等待。</p>
          )}
          <div className="flex flex-col gap-4">
            {job.quotes.map((q) => {
              const profile = q.master.masterProfile;
              return (
                <div
                  key={q.id}
                  className={`bg-white rounded-2xl border p-5 ${q.status === "ACCEPTED" ? "border-green-400 bg-green-50" : "border-slate-200"}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-base">
                        {q.master.name?.slice(0, 1) ?? "遊"}
                      </div>
                      <div>
                        <p className="text-base font-semibold text-slate-900">{profile?.displayName ?? q.master.name}</p>
                        <p className="text-sm text-slate-600 flex items-center gap-1.5 mt-0.5">
                          {getYouxiaTitle(profile?.youxiaLevel ?? 1)}
                          {profile && profile.avgRating > 0 && (
                            <span className="flex items-center gap-1 ml-1">
                              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                              {profile.avgRating.toFixed(1)}
                              <span className="text-slate-500">({profile.totalReviews})</span>
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <span className="text-xl font-black text-orange-500">{formatPrice(q.price)}</span>
                  </div>

                  <p className="text-base text-slate-700 mb-3 leading-relaxed">{q.description}</p>
                  <p className="text-sm text-slate-600 mb-4">可施工日：{formatDate(q.availableDate)}</p>

                  {isOwner && q.status === "PENDING" && (job.status === "OPEN" || job.status === "QUOTED") && (
                    <form action={acceptQuote.bind(null, q.id)}>
                      <Button size="sm" type="submit" className="w-full h-11 text-base font-semibold rounded-xl">
                        接受此報價
                      </Button>
                    </form>
                  )}
                  {q.status === "ACCEPTED" && (
                    <Badge variant="success" className="w-full justify-center py-2 text-base rounded-xl">✓ 已接受</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 報價表單 */}
        {session?.user && !isOwner && (job.status === "OPEN" || job.status === "QUOTED") && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-5">我要報價</h2>
            <form action={submitQuote} className="flex flex-col gap-5">
              <div>
                <Label className="text-base font-semibold text-slate-800 mb-2 block">報價金額（NT$）*</Label>
                <Input name="price" type="number" className="h-11 text-base" placeholder="例：1500" required />
              </div>
              <div>
                <Label className="text-base font-semibold text-slate-800 mb-2 block">說明工法 / 材料 *</Label>
                <Textarea
                  name="description"
                  className="text-base min-h-[100px]"
                  placeholder="描述你的施工方式、使用材料、保固等..."
                  required
                />
              </div>
              <div>
                <Label className="text-base font-semibold text-slate-800 mb-2 block">可施工日期 *</Label>
                <Input name="availableDate" type="date" className="h-11 text-base" required />
              </div>
              <Button type="submit" className="w-full h-12 text-base font-semibold rounded-xl">
                送出報價
              </Button>
            </form>
          </div>
        )}

        {!session?.user && (
          <div className="bg-white rounded-2xl border border-slate-200 text-center py-10 px-6">
            <p className="text-base text-slate-700 mb-4">登入後才能報價</p>
            <Button asChild className="h-11 px-6 text-base font-semibold rounded-xl">
              <a href="/login">立即登入</a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
