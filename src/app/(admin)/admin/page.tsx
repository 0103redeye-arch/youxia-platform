import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/adminAuth";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
  const admin = await getAdminUser();
  if (!admin) redirect("/login");

  const [pendingKyc, pendingHalls, recentOrders, stats] = await Promise.all([
    prisma.masterProfile.findMany({
      where: { idVerifyStatus: "PENDING" },
      include: { user: { select: { name: true, phone: true, createdAt: true } } },
      orderBy: { createdAt: "asc" },
      take: 20,
    }),
    prisma.hall.findMany({
      where: { verifyStatus: "PENDING" },
      include: { owner: { select: { name: true, phone: true } } },
      orderBy: { createdAt: "asc" },
      take: 20,
    }),
    prisma.order.findMany({
      where: { status: { in: ["DISPUTED"] } },
      include: {
        job: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    (async () => {
      const [users, masters, jobs, orders, revenue] = await Promise.all([
        prisma.user.count(),
        prisma.masterProfile.count(),
        prisma.job.count({ where: { status: { in: ["OPEN","QUOTED","ASSIGNED","IN_PROGRESS"] } } }),
        prisma.order.count({ where: { status: "COMPLETED" } }),
        prisma.order.aggregate({ where: { status: "COMPLETED" }, _sum: { platformFee: true } }),
      ]);
      return { users, masters, jobs, orders, revenue: revenue._sum.platformFee ?? 0 };
    })(),
  ]);

  return (
    <AdminDashboard
      pendingKyc={pendingKyc as any}
      pendingHalls={pendingHalls as any}
      disputedOrders={recentOrders as any}
      stats={stats}
    />
  );
}
