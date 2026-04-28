import { headers } from "next/headers";
import { auth } from "./auth";
import { prisma } from "./prisma";

export type AuthUser = { id: string; name: string | null; role: string };

/**
 * 取得目前登入用戶（相容 NextAuth session 與 X-Auth-Token header）
 * 優先使用 NextAuth session；無 session 時嘗試 X-Auth-Token（行動端 token 登入）
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  // 1. NextAuth session（Web / OAuth 登入）
  const session = await auth();
  if (session?.user?.id) {
    // 從 DB 撈 role
    const dbUser = await prisma.user
      .findUnique({ where: { id: session.user.id }, select: { id: true, name: true, role: true } })
      .catch(() => null);
    if (dbUser) return dbUser;
    return { id: session.user.id, name: session.user.name ?? null, role: "CLIENT" };
  }

  // 2. X-Auth-Token header（行動端手機驗證登入）
  const headersList = headers();
  const token = headersList.get("x-auth-token");
  if (!token) return null;

  const userToken = await prisma.userToken
    .findFirst({
      where: { token, expiresAt: { gt: new Date() } },
      include: { user: { select: { id: true, name: true, role: true } } },
    })
    .catch(() => null);

  if (userToken?.user) return userToken.user as AuthUser;
  return null;
}
