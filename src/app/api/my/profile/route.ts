import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/getAuthUser";
import { safeParseJson } from "@/lib/json";
import { createHash } from "crypto";

function hashId(idNo: string) {
  return createHash("sha256").update(idNo.toUpperCase().trim()).digest("hex");
}

export async function GET() {
  const user = await getAuthUser();
  if (!user?.id) return NextResponse.json(null, { status: 200 });

  const profile = await prisma.masterProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) return NextResponse.json(null);

  return NextResponse.json({
    ...profile,
    serviceAreas:  safeParseJson(profile.serviceAreas, []),
    // 不回傳 nationalIdHash，只回傳驗證狀態
    nationalIdHash: undefined,
    nationalIdLast4: profile.nationalIdLast4,
  });
}

// 非敏感欄位更新（不需重新驗證身份證）
export async function PATCH(req: Request) {
  const authUser = await getAuthUser();
  if (!authUser?.id) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { displayName, bio, serviceAreas, isAvailable } = body;

  if (displayName !== undefined && !displayName.trim()) {
    return NextResponse.json({ error: "顯示名稱不可為空" }, { status: 400 });
  }

  const existing = await prisma.masterProfile.findUnique({ where: { userId: authUser.id } });
  if (!existing) return NextResponse.json({ error: "尚未建立遊俠檔案" }, { status: 404 });

  const updated = await prisma.masterProfile.update({
    where: { userId: authUser.id },
    data: {
      ...(displayName  !== undefined ? { displayName: displayName.trim() } : {}),
      ...(bio          !== undefined ? { bio: bio || null } : {}),
      ...(serviceAreas !== undefined ? { serviceAreas: JSON.stringify(serviceAreas) } : {}),
      ...(isAvailable  !== undefined ? { isAvailable } : {}),
    },
  });

  return NextResponse.json({
    ...updated,
    nationalIdHash: undefined,
    serviceAreas: safeParseJson(updated.serviceAreas, []),
  });
}

export async function POST(req: Request) {
  const authUser = await getAuthUser();
  if (!authUser?.id) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  const body = await req.json();
  const { displayName, realName, nationalId, bio, serviceAreas, isLicensed, licenseType } = body;

  if (!displayName || !realName || !nationalId) {
    return NextResponse.json({ error: "顯示名稱、真實姓名、身份證字號為必填" }, { status: 400 });
  }

  // 身份證基本格式驗證（台灣：1字母 + 9數字）
  if (!/^[A-Z][0-9]{9}$/i.test(nationalId.trim())) {
    return NextResponse.json({ error: "身份證字號格式不正確" }, { status: 400 });
  }

  const idHash = hashId(nationalId);
  const idLast4 = nationalId.slice(-4);

  // ── 互斥檢查：此身份證是否已是盟會成員 ──
  const isMember = await prisma.hallMember.findFirst({
    where: { nationalIdHash: idHash, isActive: true },
    include: { hall: { select: { companyName: true } } },
  });
  if (isMember) {
    return NextResponse.json(
      { error: `此身份證已登記為「${isMember.hall.companyName}」的盟會成員，不可同時登記為獨立遊俠` },
      { status: 409 }
    );
  }

  // ── 同一身份證不可重複登記 ──
  const dupProfile = await prisma.masterProfile.findFirst({
    where: { nationalIdHash: idHash, userId: { not: authUser.id } },
  });
  if (dupProfile) {
    return NextResponse.json({ error: "此身份證已被其他帳號登記" }, { status: 409 });
  }

  const profile = await prisma.masterProfile.upsert({
    where: { userId: authUser.id },
    create: {
      userId:          authUser.id,
      displayName,
      realName,
      nationalIdHash:  idHash,
      nationalIdLast4: idLast4,
      idVerifyStatus:  "PENDING",
      bio:             bio ?? null,
      serviceAreas:    JSON.stringify(serviceAreas ?? []),
      isLicensed:      isLicensed ?? false,
      licenseType:     isLicensed ? licenseType : null,
    },
    update: {
      displayName,
      realName,
      nationalIdHash:  idHash,
      nationalIdLast4: idLast4,
      idVerifyStatus:  "PENDING",
      bio:             bio ?? null,
      serviceAreas:    JSON.stringify(serviceAreas ?? []),
      isLicensed:      isLicensed ?? false,
      licenseType:     isLicensed ? licenseType : null,
    },
  });

  await prisma.user.update({
    where: { id: authUser.id },
    data:  { role: "MASTER" },
  });

  return NextResponse.json({
    ...profile,
    nationalIdHash: undefined,
    serviceAreas: serviceAreas ?? [],
  });
}
