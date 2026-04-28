import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/adminAuth";
import { z } from "zod";

// GET  /api/admin/kyc               → 列出待審 KYC
// PATCH /api/admin/kyc              → 核准或拒絕

export async function GET(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "PENDING";

  const profiles = await prisma.masterProfile.findMany({
    where: { idVerifyStatus: status },
    include: {
      user: { select: { id: true, name: true, phone: true, email: true, createdAt: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  return NextResponse.json(profiles);
}

const ReviewSchema = z.object({
  masterProfileId: z.string(),
  action: z.enum(["APPROVE", "REJECT"]),
  note: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const parsed = ReviewSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { masterProfileId, action, note } = parsed.data;

  const profile = await prisma.masterProfile.findUnique({ where: { id: masterProfileId } });
  if (!profile) return NextResponse.json({ error: "找不到此遊俠" }, { status: 404 });

  await prisma.masterProfile.update({
    where: { id: masterProfileId },
    data: {
      idVerifyStatus: action === "APPROVE" ? "VERIFIED" : "REJECTED",
      idVerifyNote: note ?? null,
      idCardVerified: action === "APPROVE",
    },
  });

  // 通知遊俠
  await prisma.notification.create({
    data: {
      userId: profile.userId,
      type: "KYC_RESULT",
      title: action === "APPROVE" ? "✅ 身份驗證通過" : "❌ 身份驗證未通過",
      body: action === "APPROVE"
        ? "恭喜！你的身份驗證已通過，可接受需執照案件。"
        : `身份驗證未通過。${note ? `原因：${note}` : "請確認上傳的文件清晰完整。"}`,
    },
  });

  return NextResponse.json({ success: true });
}
