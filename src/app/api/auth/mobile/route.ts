import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/sms";
import { randomBytes } from "crypto";

// OTP prefix stored in UserToken.token field
const OTP_PREFIX = "otp:";

function generateOtp() {
  return (100000 + randomBytes(3).readUIntBE(0, 3) % 900000).toString().padStart(6, "0");
}

function generateToken() {
  return randomBytes(32).toString("hex");
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { action, phone, otp, name } = body as Record<string, string>;

  // ── 步驟一：要求驗證碼 ──
  if (action === "request") {
    if (!phone || !/^09\d{8}$/.test(phone)) {
      return NextResponse.json(
        { error: "請輸入正確的手機號碼（09 開頭，10 位數）" },
        { status: 400 }
      );
    }

    // 確保用戶存在（OTP 必須掛在 userId 下）
    const user = await prisma.user.upsert({
      where: { phone },
      create: { phone, name: name?.trim() || `用戶${phone.slice(-4)}` },
      update: {},
    });

    // 速率限制：10 分鐘內最多 3 次 OTP 請求（查 DB 取代 in-memory Map）
    const recentOtpCount = await prisma.userToken.count({
      where: {
        userId: user.id,
        token: { startsWith: OTP_PREFIX },
        createdAt: { gt: new Date(Date.now() - 10 * 60 * 1000) },
      },
    });

    if (recentOtpCount >= 3) {
      return NextResponse.json(
        { error: "短時間內請求太多次，請 10 分鐘後再試" },
        { status: 429 }
      );
    }

    const code = process.env.NODE_ENV === "development" ? "0000" : generateOtp();

    // 刪除該用戶舊 OTP，再寫入新的（5 分鐘有效）
    await prisma.userToken
      .deleteMany({ where: { userId: user.id, token: { startsWith: OTP_PREFIX } } })
      .catch(() => null);

    await prisma.userToken.create({
      data: {
        userId: user.id,
        token: `${OTP_PREFIX}${code}`,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    console.log(`[俠客行不行] OTP for ${phone}: ${code}`);

    sendSms(phone, `【俠客行不行】您的驗證碼為 ${code}，5 分鐘內有效。請勿將驗證碼告知他人。`).catch(
      (e) => console.error("[OTP SMS error]", e)
    );

    return NextResponse.json({
      ok: true,
      ...(process.env.NODE_ENV === "development" && { devOtp: code }),
    });
  }

  // ── 步驟二：驗證 OTP，發放 token ──
  if (action === "verify") {
    if (!phone || !otp) {
      return NextResponse.json({ error: "缺少手機號碼或驗證碼" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return NextResponse.json({ error: "驗證碼錯誤或已過期，請重新取得" }, { status: 400 });
    }

    // 查詢 DB 中的 OTP token
    const storedOtp = await prisma.userToken.findFirst({
      where: {
        userId: user.id,
        token: `${OTP_PREFIX}${otp}`,
        expiresAt: { gt: new Date() },
      },
    });

    if (!storedOtp) {
      return NextResponse.json({ error: "驗證碼錯誤或已過期，請重新取得" }, { status: 400 });
    }

    // 驗證成功：刪除 OTP，發放正式 auth token
    await prisma.userToken
      .deleteMany({ where: { userId: user.id, token: { startsWith: OTP_PREFIX } } })
      .catch(() => null);

    // 清理過期 auth token（防止 token 表無限增長）
    await prisma.userToken
      .deleteMany({ where: { userId: user.id, expiresAt: { lt: new Date() } } })
      .catch(() => null);

    // 建立新 auth token（30 天有效）
    const token = generateToken();
    await prisma.userToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({
      token,
      userId: user.id,
      name: user.name,
      role: user.role,
    });
  }

  // ── 登出：刪除 token ──
  if (action === "logout") {
    const authToken = req.headers.get("x-auth-token");
    if (authToken) {
      await prisma.userToken
        .delete({ where: { token: authToken } })
        .catch(() => null);
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "無效的操作" }, { status: 400 });
}
