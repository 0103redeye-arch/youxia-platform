import { getAuthUser } from "@/lib/getAuthUser";

/**
 * 取得目前登入的 Admin 用戶（role=ADMIN）
 * 如果不是 admin 就回傳 null
 */
export async function getAdminUser() {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}
