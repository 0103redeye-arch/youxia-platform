// 遊俠等級制度
// 社群費（平台手續費）隨等級遞降，作為遊俠努力接案的獎勵機制
// Lv.5「傳說宗師」每月各行政區前 3 名享有區域首頁廣告位

export const YOUXIA_LEVELS = [
  {
    level: 1, title: "初出茅廬", feeRate: 0.15,
    minOrders: 0,   minRating: 0,
    perks: "踏入江湖，展露鋒芒",
    color: "#6b7280", bg: "#f3f4f6",
    districtLimit: null,
  },
  {
    level: 2, title: "江湖新秀", feeRate: 0.13,
    minOrders: 5,   minRating: 4.0,
    perks: "搜尋結果優先顯示",
    color: "#1d4ed8", bg: "#dbeafe",
    districtLimit: null,
  },
  {
    level: 3, title: "熟練遊俠", feeRate: 0.11,
    minOrders: 20,  minRating: 4.3,
    perks: "新案件優先通知 · 個人頁徽章",
    color: "#15803d", bg: "#dcfce7",
    districtLimit: null,
  },
  {
    level: 4, title: "俠客高手", feeRate: 0.09,
    minOrders: 50,  minRating: 4.5,
    perks: "個人頁面專屬徽章 · 首頁推薦",
    color: "#7c3aed", bg: "#ede9fe",
    districtLimit: null,
  },
  {
    level: 5, title: "傳說宗師", feeRate: 0.07,
    minOrders: 100, minRating: 4.7,
    perks: "區域首頁廣告位（每月各區前 3 名）",
    color: "#b45309", bg: "#fef3c7",
    districtLimit: 3, // 每月依當月接案量重新排序，前 3 名佔有廣告名額
  },
] as const;

export type YouxiaLevel = 1 | 2 | 3 | 4 | 5;

export const YOUXIA_FEE_RATES: Record<YouxiaLevel, number> = {
  1: 0.15,
  2: 0.13,
  3: 0.11,
  4: 0.09,
  5: 0.07,
};

export const MIN_TRANSACTION_NORMAL = 300;
export const MIN_TRANSACTION_QUIRKY  = 100;
export const MAX_TRANSACTION_QUIRKY  = 2000;

export function calculateFees(amount: number, youxiaLevel: YouxiaLevel) {
  const rate = YOUXIA_FEE_RATES[youxiaLevel];
  const platformFee = Math.round(amount * rate);
  const masterPayout = amount - platformFee;
  return { totalAmount: amount, platformFee, masterPayout, feeRate: rate };
}

export function getYouxiaTitle(level: number): string {
  return YOUXIA_LEVELS.find((l) => l.level === level)?.title ?? "初出茅廬";
}

export function getYouxiaLevel(level: number) {
  return YOUXIA_LEVELS.find((l) => l.level === level) ?? YOUXIA_LEVELS[0];
}

export function calcYouxiaLevel(completedOrders: number, avgRating: number): YouxiaLevel {
  if (completedOrders >= 100 && avgRating >= 4.7) return 5;
  if (completedOrders >= 50  && avgRating >= 4.5) return 4;
  if (completedOrders >= 20  && avgRating >= 4.3) return 3;
  if (completedOrders >= 5   && avgRating >= 4.0) return 2;
  return 1;
}
