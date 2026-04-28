import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, timeAgo } from "@/lib/utils";
import { MapPin, Clock, Banknote, ShieldCheck } from "lucide-react";

export default async function BrowseJobsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const jobs = await prisma.job.findMany({
    where: { status: { in: ["OPEN", "QUOTED"] } },
    include: { issue: true, client: true, _count: { select: { quotes: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">可接案件</h1>
          <span className="text-sm text-gray-500">{jobs.length} 件</span>
        </div>

        {jobs.length === 0 && (
          <div className="text-center py-16 text-gray-400">目前沒有開放案件</div>
        )}

        <div className="flex flex-col gap-3">
          {jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <Card className="hover:border-brand-300 hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h2 className="font-semibold text-gray-800">{job.title}</h2>
                    {job.jobType === "LICENSED" ? (
                      <Badge variant="warning" className="shrink-0 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />需執照
                      </Badge>
                    ) : (
                      <Badge variant="success" className="shrink-0">遊俠可接</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{job.description}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{job.city} {job.district}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />{timeAgo(job.createdAt)}
                    </span>
                    {(job.budgetMin || job.budgetMax) && (
                      <span className="flex items-center gap-1">
                        <Banknote className="w-3 h-3" />
                        {job.budgetMin && formatPrice(job.budgetMin)}
                        {job.budgetMin && job.budgetMax && " ~ "}
                        {job.budgetMax && formatPrice(job.budgetMax)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-400">
                      已有 {job._count.quotes} 位遊俠報價
                    </span>
                    <Button size="sm" variant="outline">查看 / 報價</Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
