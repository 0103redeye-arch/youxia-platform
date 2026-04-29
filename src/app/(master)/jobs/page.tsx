import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, timeAgo } from "@/lib/utils";
import { MapPin, Clock, Banknote, ShieldCheck } from "lucide-react";

export default async function BrowseJobsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // 取得師傅服務區域（用來優先顯示符合的案件）
  const masterProfile = await prisma.masterProfile.findUnique({
    where: { userId: session.user.id! },
    select: { serviceAreas: true },
  });

  let serviceAreas: string[] = [];
  try {
    serviceAreas = masterProfile?.serviceAreas
      ? JSON.parse(masterProfile.serviceAreas as string)
      : [];
  } catch { /* ignore */ }

  const jobs = await prisma.job.findMany({
    where: { status: { in: ["OPEN", "QUOTED"] } },
    include: { issue: true, _count: { select: { quotes: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // 如果師傅有設定服務區域，優先顯示符合的案件；其他案件排後面
  const sorted = serviceAreas.length > 0
    ? [
        ...jobs.filter(j => serviceAreas.includes(j.city)),
        ...jobs.filter(j => !serviceAreas.includes(j.city)),
      ]
    : jobs;

  return (
    <div className="min-h-screen pb-24 md:pb-0 bg-[#f8f9fa]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-5 py-10">

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-slate-900">可接案件</h1>
          <span className="text-base text-slate-600 font-medium">{sorted.length} 件</span>
        </div>

        {serviceAreas.length > 0 && (
          <p className="text-sm text-slate-600 mb-6 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-orange-500" />
            依你的服務區域（{serviceAreas.join("、")}）優先排序
          </p>
        )}

        {sorted.length === 0 && (
          <div className="text-center py-20 text-slate-500 text-base">目前沒有開放案件</div>
        )}

        <div className="flex flex-col gap-4">
          {sorted.map((job) => {
            const inMyArea = serviceAreas.length > 0 && serviceAreas.includes(job.city);
            return (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <div className={`bg-white rounded-2xl border hover:border-orange-300 hover:shadow-md transition-all cursor-pointer p-5 ${
                  inMyArea ? "border-orange-200" : "border-slate-200"
                }`}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h2 className="font-bold text-slate-900 text-base leading-snug">{job.title}</h2>
                    {job.jobType === "LICENSED" ? (
                      <Badge variant="warning" className="shrink-0 flex items-center gap-1 text-sm px-3 py-1">
                        <ShieldCheck className="w-3.5 h-3.5" />需執照
                      </Badge>
                    ) : (
                      <Badge variant="success" className="shrink-0 text-sm px-3 py-1">遊俠可接</Badge>
                    )}
                  </div>

                  <p className="text-sm text-slate-700 mb-4 line-clamp-2 leading-relaxed">{job.description}</p>

                  <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {job.city}{job.district ? ` ${job.district}` : ""}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400" />{timeAgo(job.createdAt)}
                    </span>
                    {(job.budgetMin || job.budgetMax) && (
                      <span className="flex items-center gap-1.5">
                        <Banknote className="w-4 h-4 text-slate-400" />
                        {job.budgetMin ? formatPrice(job.budgetMin) : "不限"}
                        {" ~ "}
                        {job.budgetMax ? formatPrice(job.budgetMax) : "不限"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                    <span className="text-sm text-slate-600">
                      已有 <span className="font-semibold text-slate-800">{job._count.quotes}</span> 位遊俠報價
                    </span>
                    <Button size="sm" variant="outline" className="text-sm font-semibold px-4 h-9 rounded-lg">
                      查看 / 報價
                    </Button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

      </div>
      <BottomNav />
    </div>
  );
}
