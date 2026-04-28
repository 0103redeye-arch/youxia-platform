import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/getAuthUser";

export async function GET() {
  const user = await getAuthUser();
  if (!user?.id) return NextResponse.json([], { status: 200 });

  const quotes = await prisma.quote.findMany({
    where: { masterId: user.id },
    include: {
      job: {
        select: {
          title: true, status: true,
          city: true, district: true,
          budgetMin: true, budgetMax: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json(quotes);
}
