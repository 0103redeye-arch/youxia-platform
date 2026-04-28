import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/getAuthUser";

export async function GET() {
  const user = await getAuthUser();
  if (!user?.id) return NextResponse.json([], { status: 200 });

  const jobs = await prisma.job.findMany({
    where: { clientId: user.id },
    include: { _count: { select: { quotes: true } } },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json(jobs);
}
