import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/adminAuth";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "PENDING";

  const halls = await prisma.hall.findMany({
    where: { verifyStatus: status },
    include: {
      owner: { select: { id: true, name: true, phone: true, email: true } },
      members: { select: { realName: true, role: true, licenseTypes: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  return NextResponse.json(halls);
}

const ReviewSchema = z.object({
  hallId: z.string(),
  action: z.enum(["APPROVE", "REJECT"]),
  note: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const parsed = ReviewSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { hallId, action, note } = parsed.data;

  const hall = await prisma.hall.findUnique({ where: { id: hallId } });
  if (!hall) return NextResponse.json({ error: "找不到此盟會" }, { status: 404 });

  await prisma.hall.update({
    where: { id: hallId },
    data: {
      verifyStatus: action === "APPROVE" ? "VERIFIED" : "REJECTED",
      verifyNote: note ?? null,
    },
  });

  // 通知盟主
  await prisma.notification.create({
    data: {
      userId: hall.ownerId,
      type: "HALL_RESULT",
      title: action === "APPROVE" ? "✅ 盟會審核通過" : "❌ 盟會審核未通過",
      body: action === "APPROVE"
        ? `「${hall.companyName}」盟會審核已通過，可接受認證師傅案件。`
        : `「${hall.companyName}」審核未通過。${note ? `原因：${note}` : ""}`,
    },
  });

  return NextResponse.json({ success: true });
}
