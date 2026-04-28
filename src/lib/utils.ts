import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number) {
  return `NT$${amount.toLocaleString("zh-TW")}`;
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("zh-TW", {
    year: "numeric", month: "long", day: "numeric",
  });
}

export function timeAgo(date: Date | string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "剛剛";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分鐘前`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小時前`;
  return `${Math.floor(seconds / 86400)} 天前`;
}

/** 距離截止還剩幾小時（負數代表已過期） */
export function hoursUntil(date: Date | string): number {
  return Math.floor((new Date(date).getTime() - Date.now()) / 3_600_000);
}
