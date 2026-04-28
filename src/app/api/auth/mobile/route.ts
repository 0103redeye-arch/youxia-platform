import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/sms";
import { randomBytes } from "crypto";

// ── OTP 暫存（production 應換 Redis）──
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

// ── 速率限制：每支手機號碼 10 分鐘內最多 3 次請求 ──
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(phone: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(phone);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(phone, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return true; // 允許
  }
  if (entry.count >= 3) return false; // 超過限制
  entry.count++;
  return true;
}

function generateOtp() {
  // 使用 crypto.randomInt 產生密碼學安全的隨機碼
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

    // 速率限制
    if (!checkRateLimit(phone)) {
      return NextResponse.json(
        { error: "短時間內請求太多次，請 10 分鐘後再試" },
        { status: 429 }
      );
    }

    const code = process.env.NODE_ENV === "development" ? "0000" : generateOtp();
    otpStore.set(phone, { otp: code, expiresAt: Date.now() + 5 * 60 * 1000 });

    console.log(`[俠客行不行] OTP for ${phone}: ${code}`);

    // 發送 OTP SMS（dev 模式下只印 console，不實際發送）
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

    const stored = otpStore.get(phone);
    if (!stored || stored.expiresAt < Date.now() || stored.otp !== otp) {
      return NextResponse.json({ error: "驗證碼錯誤或已過期，請重新取得" }, { status: 400 });
    }

    otpStore.delete(phone);
    // 驗證成功後重置速率計數
    rateLimitStore.delete(phone);

    // 建立或取得用戶
    const user = await prisma.user.upsert({
      where: { phone },
      create: { phone, name: name?.trim() || `用戶${phone.slice(-4)}` },
      update: {},
    });

    // 清理過期 token（防止 token 表無限增長）
    await prisma.userToken
      .deleteMany({ where: { userId: user.id, expiresAt: { lt: new Date() } } })
      .catch(() => null);

    // 建立新 token（30 天有效）
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
