import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
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
  return NextResponse.json(job);
}
