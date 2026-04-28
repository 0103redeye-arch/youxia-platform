import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice, formatDate, timeAgo, hoursUntil } from "@/lib/utils";
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

    // upsert：同一師傅只能對同一案件有一筆報價
    await prisma.quote.upsert({
      where: { jobId_masterId: { jobId, masterId } },
      update: { price, description, availableDate },
      create:  { jobId, masterId, price, description, availableDate },
    });

    // 案件首次獲得報價時，狀態從 OPEN → QUOTED
    await prisma.job.updateMany({
      where: { id: jobId, status: "OPEN" },
      data:  { status: "QUOTED" },
    });

    redirect(`/jobs/${params.id}`);
  }

  async function acceptQuote(quoteId: string) {
    "use server";
    const session = await auth();
    if (!session?.user) redirect("/login");

    const quote = await prisma.quote.findUnique({
      where: { id: quoteId }, include: { job: true },
    });
    if (!quote || quote.job.clientId !== session.user.id) return;

    // 原子操作：接受此報價、拒絕其餘、更新案件狀態
    await prisma.$transaction([
      prisma.quote.update({ where: { id: quoteId }, data: { status: "ACCEPTED" } }),
      prisma.quote.updateMany({
        where: { jobId: quote.jobId, id: { not: quoteId } },
        data:  { status: "REJECTED" },
      }),
      prisma.job.update({ where: { id: quote.jobId }, data: { status: "ASSIGNED" } }),
    ]);
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen pb-10">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">

        {/* 案件詳情 */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-lg">{job.title}</CardTitle>
              {job.jobType === "LICENSED" ? (
                <Badge variant="warning" className="flex items-center gap-1 shrink-0">
                  <ShieldCheck className="w-3 h-3" />認證師傅限定
                </Badge>
              ) : (
                <Badge variant="success" className="shrink-0">遊俠皆可報價</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {job.issue.licenseNote && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700">{job.issue.licenseNote}</p>
              </div>
            )}
            <p className="text-gray-700">{job.description}</p>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{job.city} {job.district}</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{timeAgo(job.createdAt)}</span>
              {(job.budgetMin || job.budgetMax) && (
                <span>預算：{job.budgetMin ? formatPrice(job.budgetMin) : "不限"} ~ {job.budgetMax ? formatPrice(job.budgetMax) : "不限"}</span>
              )}
              {job.preferredDate && (
                <span>希望日期：{formatDate(job.preferredDate)}</span>
              )}
              {(() => {
                const h = hoursUntil(job.quoteDeadline);
                if (h < 0) return <span className="text-gray-400">⏰ 已截止</span>;
                return (
                  <span className={h <= 6 ? "text-red-500 font-semibold" : "text-gray-500"}>
                    ⏰ {h <= 6 ? `僅剩 ${h} 小時` : `${h}h 截止`}
                  </span>
                );
              })()}
            </div>
          </CardContent>
        </Card>

        {/* 報價列表 */}
        <div>
          <h2 className="font-semibold text-gray-800 mb-3">
            目前報價（{job.quotes.length} 位遊俠）
          </h2>
          {job.quotes.length === 0 && (
            <p className="text-sm text-gray-400">還沒有遊俠報價，請耐心等待。</p>
          )}
          <div className="flex flex-col gap-3">
            {job.quotes.map((q) => {
              const profile = q.master.masterProfile;
              return (
                <Card key={q.id} className={q.status === "ACCEPTED" ? "border-green-400 bg-green-50" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xs">
                          {q.master.name?.slice(0, 1) ?? "遊"}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{profile?.displayName ?? q.master.name}</p>
                          <p className="text-xs text-gray-400">
                            {getYouxiaTitle(profile?.youxiaLevel ?? 1)}
                            {profile && profile.avgRating > 0 && (
                              <span className="ml-2 flex items-center gap-0.5 inline-flex">
                                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                {profile.avgRating.toFixed(1)} ({profile.totalReviews})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-brand-600">{formatPrice(q.price)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{q.description}</p>
                    <p className="text-xs text-gray-400 mb-3">可施工日：{formatDate(q.availableDate)}</p>
                    {isOwner && q.status === "PENDING" && (job.status === "OPEN" || job.status === "QUOTED") && (
                      <form action={acceptQuote.bind(null, q.id)}>
                        <Button size="sm" type="submit" className="w-full">接受此報價</Button>
                      </form>
                    )}
                    {q.status === "ACCEPTED" && (
                      <Badge variant="success" className="w-full justify-center py-1">✓ 已接受</Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* 報價表單（非案件發起人且案件開放中） */}
        {session?.user && !isOwner && (job.status === "OPEN" || job.status === "QUOTED") && (
          <Card>
            <CardHeader><CardTitle>我要報價</CardTitle></CardHeader>
            <CardContent>
              <form action={submitQuote} className="flex flex-col gap-4">
                <div>
                  <Label>報價金額（NT$）*</Label>
                  <Input name="price" type="number" className="mt-1" placeholder="例：1500" required />
                </div>
                <div>
                  <Label>說明工法 / 材料 *</Label>
                  <Textarea name="description" className="mt-1" placeholder="描述你的施工方式、使用材料、保固等..." required />
                </div>
                <div>
                  <Label>可施工日期 *</Label>
                  <Input name="availableDate" type="date" className="mt-1" required />
                </div>
                <Button type="submit" className="w-full">送出報價</Button>
              </form>
            </CardContent>
          </Card>
        )}

        {!session?.user && (
          <Card className="text-center py-6">
            <p className="text-gray-500 mb-3">登入後才能報價</p>
            <Button asChild><a href="/login">立即登入</a></Button>
          </Card>
        )}
      </div>
    </div>
  );
}
