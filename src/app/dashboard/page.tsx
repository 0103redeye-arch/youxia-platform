import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, timeAgo } from "@/lib/utils";
import { getYouxiaTitle, getYouxiaLevel } from "@/constants/fees";
import { Sword, Star, PlusCircle, Briefcase } from "lucide-react";

const STATUS_LABEL: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" | "outline" }> = {
  OPEN:            { label: "等待報價", variant: "secondary" },
  QUOTED:          { label: "有報價了", variant: "default" },
  ASSIGNED:        { label: "已選定遊俠", variant: "warning" },
  IN_PROGRESS:     { label: "施工中", variant: "warning" },
  PENDING_CONFIRM: { label: "等待確認完工", variant: "warning" },
  COMPLETED:       { label: "已完成", variant: "success" },
  CANCELLED:       { label: "已取消", variant: "destructive" },
  EXPIRED:         { label: "已過期", variant: "outline" },
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id!;

  const [myJobs, myQuotes, profile] = await Promise.all([
    prisma.job.findMany({
      where: { clientId: userId },
      include: { _count: { select: { quotes: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.quote.findMany({
      where: { masterId: userId },
      include: { job: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.masterProfile.findUnique({ where: { userId } }),
  ]);

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
        <h1 className="text-xl font-bold">我的主頁</h1>

        {/* 遊俠資訊卡（若已成為遊俠） */}
        {profile && (
          <Card className="bg-gradient-to-r from-brand-500 to-brand-700 text-white">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                <Sword className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg">{profile.displayName}</p>
                <p className="text-brand-100 text-sm">{getYouxiaTitle(profile.youxiaLevel)} · Lv.{profile.youxiaLevel}</p>
                <div className="flex items-center gap-3 mt-1 text-sm">
                  <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-yellow-300 text-yellow-300" />{profile.avgRating.toFixed(1)}</span>
                  <span>{profile.totalOrders} 筆完成</span>
                  <span className="text-brand-200 opacity-80">{getYouxiaLevel(profile.youxiaLevel).perks}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 我發的案件 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />我發的案件
            </h2>
            <Button asChild size="sm" variant="outline">
              <Link href="/post-job"><PlusCircle className="w-4 h-4 mr-1" />發新案</Link>
            </Button>
          </div>
          {myJobs.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-400 mb-3">還沒有發過案件</p>
                <Button asChild><Link href="/post-job">立即發案</Link></Button>
              </CardContent>
            </Card>
          )}
          <div className="flex flex-col gap-2">
            {myJobs.map((job) => {
              const s = STATUS_LABEL[job.status] ?? { label: job.status, variant: "secondary" as const };
              return (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <Card className="hover:border-brand-300 transition-colors cursor-pointer">
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{job.title}</p>
                        <p className="text-xs text-gray-400">{timeAgo(job.createdAt)} · {job._count.quotes} 個報價</p>
                      </div>
                      <Badge variant={s.variant}>{s.label}</Badge>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 我的報價（遊俠視角） */}
        {myQuotes.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Sword className="w-4 h-4" />我的報價
            </h2>
            <div className="flex flex-col gap-2">
              {myQuotes.map((q) => (
                <Link key={q.id} href={`/jobs/${q.jobId}`}>
                  <Card className="hover:border-brand-300 transition-colors cursor-pointer">
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{q.job.title}</p>
                        <p className="text-xs text-gray-400">{timeAgo(q.createdAt)} · 報價 {formatPrice(q.price)}</p>
                      </div>
                      <Badge variant={
                        q.status === "ACCEPTED" ? "success" :
                        q.status === "REJECTED" ? "destructive" : "secondary"
                      }>
                        {q.status === "ACCEPTED" ? "已接受" : q.status === "REJECTED" ? "未選中" : "等待中"}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 如果還不是遊俠 */}
        {!profile && (
          <Card className="border-brand-200 bg-brand-50">
            <CardContent className="p-5 text-center">
              <Sword className="w-10 h-10 text-brand-500 mx-auto mb-2" />
              <p className="font-semibold text-brand-700 mb-1">踏入江湖，成為遊俠</p>
              <p className="text-sm text-brand-600 mb-3">用真本事接案、累積聲望，等級越高享有越多特權。</p>
              <Button asChild><Link href="/become-master">加入遊俠</Link></Button>
            </CardContent>
          </Card>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
