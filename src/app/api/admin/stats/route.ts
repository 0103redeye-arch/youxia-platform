import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/adminAuth";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [
    totalUsers,
    totalMasters,
    pendingKyc,
    pendingHalls,
    totalJobs,
    activeJobs,
    totalOrders,
    completedOrders,
    totalRevenue,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.masterProfile.count(),
    prisma.masterProfile.count({ where: { idVerifyStatus: "PENDING" } }),
    prisma.hall.count({ where: { verifyStatus: "PENDING" } }),
    prisma.job.count(),
    prisma.job.count({ where: { status: { in: ["OPEN", "QUOTED", "ASSIGNED", "IN_PROGRESS"] } } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "COMPLETED" } }),
    prisma.order.aggregate({
      where: { status: "COMPLETED" },
      _sum: { platformFee: true },
    }),
  ]);

  return NextResponse.json({
    users: { total: totalUsers, masters: totalMasters },
    kyc: { pending: pendingKyc },
    halls: { pending: pendingHalls },
    jobs: { total: totalJobs, active: activeJobs },
    orders: { total: totalOrders, completed: completedOrders },
    revenue: { total: totalRevenue._sum.platformFee ?? 0 },
  });
}
