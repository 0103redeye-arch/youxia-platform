import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/getAuthUser";
import { safeParseJson } from "@/lib/json";
import { createHash } from "crypto";

function hashId(idNo: string) {
  return createHash("sha256").update(idNo.toUpperCase().trim()).digest("hex");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const city     = searchParams.get("city");
  const district = searchParams.get("district");

  const halls = await prisma.hall.findMany({
    where: {
      isActive: true,
      verifyStatus: "VERIFIED",
      ...(city     ? { city }     : {}),
      ...(district ? { district } : {}),
    },
    orderBy: { monthlyOrders: "desc" },
    include: { members: { where: { isActive: true }, select: { realName: true, role: true, licenseTypes: true } } },
    take: 20,
  });

  return NextResponse.json(
    halls.map((h) => ({
      ...h,
      specialties:  safeParseJson(h.specialties, []),
      serviceAreas: safeParseJson(h.serviceAreas, []),
      licenses:     safeParseJson(h.licenses, []),
      members: h.members.map((m) => ({
        realName:     m.realName,
        role:         m.role,
        licenseTypes: safeParseJson(m.licenseTypes, []),
      })),
    }))
  );
}

export async function POST(req: Request) {
  const authUser = await getAuthUser();
  if (!authUser?.id) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  const body = await req.json();
  const {
    companyName, businessRegNo, phone, address, city, district,
    representativeName, representativeId,
    specialties, serviceAreas, description,
    members = [],  // [{ realName, nationalId, role, licenseTypes }]
  } = body;

  // ── 基本驗證 ──
  if (!companyName || !businessRegNo || !representativeName || !city) {
    return NextResponse.json({ error: "公司名稱、統一編號、負責人、縣市為必填" }, { status: 400 });
  }
  if (!/^\d{8}$/.test(businessRegNo)) {
    return NextResponse.json({ error: "統一編號格式錯誤（8位數字）" }, { status: 400 });
  }

  // ── 統編不得重複 ──
  const existing = await prisma.hall.findUnique({ where: { businessRegNo } });
  if (existing && existing.ownerId !== authUser.id) {
    return NextResponse.json({ error: "此統一編號已被登記" }, { status: 409 });
  }

  // ── 成員互斥檢查：成員身份證不得同時是遊俠 ──
  for (const m of members) {
    if (!m.nationalId) continue;
    const hash = hashId(m.nationalId);
    const isYouxia = await prisma.masterProfile.findFirst({
      where: { nationalIdHash: hash, idVerifyStatus: "VERIFIED" },
    });
    if (isYouxia) {
      return NextResponse.json(
        { error: `成員「${m.realName}」身份證已登記為獨立遊俠，不可同時加入盟會` },
        { status: 409 }
      );
    }
  }

  // ── 負責人互斥檢查 ──
  if (representativeId) {
    const repHash = hashId(representativeId);
    const repIsYouxia = await prisma.masterProfile.findFirst({
      where: { nationalIdHash: repHash, idVerifyStatus: "VERIFIED" },
    });
    if (repIsYouxia) {
      return NextResponse.json(
        { error: "負責人身份證已登記為獨立遊俠，不可同時開立盟會" },
        { status: 409 }
      );
    }
  }

  const repHash = representativeId ? hashId(representativeId) : null;
  const repLast4 = representativeId ? representativeId.slice(-4) : null;

  const hall = await prisma.hall.upsert({
    where: { businessRegNo },
    create: {
      ownerId:              authUser.id,
      companyName,
      businessRegNo,
      phone:                phone ?? null,
      address:              address ?? null,
      city,
      district:             district ?? "",
      representativeName,
      representativeIdHash: repHash,
      representativeIdLast4: repLast4,
      specialties:          JSON.stringify(specialties ?? []),
      serviceAreas:         JSON.stringify(serviceAreas ?? []),
      description:          description ?? null,
      licenses:             JSON.stringify([]),
      verifyStatus:         "PENDING",
    },
    update: {
      companyName,
      phone:                phone ?? null,
      address:              address ?? null,
      city,
      district:             district ?? "",
      representativeName,
      representativeIdHash: repHash,
      representativeIdLast4: repLast4,
      specialties:          JSON.stringify(specialties ?? []),
      serviceAreas:         JSON.stringify(serviceAreas ?? []),
      description:          description ?? null,
    },
  });

  // ── 新增成員 ──
  for (const m of members) {
    await prisma.hallMember.create({
      data: {
        hallId:         hall.id,
        realName:       m.realName,
        nationalIdHash: m.nationalId ? hashId(m.nationalId) : null,
        nationalIdLast4: m.nationalId ? m.nationalId.slice(-4) : null,
        role:           m.role ?? "技師",
        licenseTypes:   JSON.stringify(m.licenseTypes ?? []),
      },
    });
  }

  return NextResponse.json({ id: hall.id, verifyStatus: "PENDING" });
}
