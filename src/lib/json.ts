/**
 * 共用 JSON 工具函數
 */

/**
 * 安全解析 JSON 字串，解析失敗時回傳 fallback 值。
 * 用於 Prisma 模型中以字串儲存的 JSON 欄位（如 serviceAreas、specialties 等）。
 */
export function safeParseJson<T = unknown>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback;
  try {
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}
