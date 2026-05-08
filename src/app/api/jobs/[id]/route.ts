import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();

  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: {
      issue: true,
      client: { select: { id: true, name: true } },
      quotes: {
        include: {
          master: {
            select: {
              id: true, name: true,
              masterProfile: {
                select: { displayName: true, youxiaLevel: true, avgRating: true, totalReviews: true },
              },
            },
          },
        },
        orderBy: { price: "asc" },
      },
    },
  });

  if (!job) return NextResponse.json({ error: "找不到案件" }, { status: 404 });

  // 完整地址只在成交（ASSIGNED 以後）且是當事人（客戶或師傅）才顯示
  const userId = session?.user?.id;
  const isClient = userId === job.clientId;
  const isAssignedMaster =
    userId &&
    job.status !== "OPEN" &&
    job.status !== "QUOTED" &&
    job.quotes.some((q) => q.status === "ACCEPTED" && q.masterId === userId);

  const canSeeAddress = isClient || isAssignedMaster;

  // 未授權時隱藏地址
  const { address, ...jobWithoutAddress } = job;
  return NextResponse.json(canSeeAddress ? job : jobWithoutAddress);
}
