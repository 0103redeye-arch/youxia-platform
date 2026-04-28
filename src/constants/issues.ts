// 問題樹：使用者描述問題，平台自動分流
// requiresLicense: true → 認證師傅限定；false → 遊俠皆可

export type IssueItem = {
  id: string;
  label: string;
  parentCategory: string;
  requiresLicense: boolean;
  licenseNote?: string;
  isQuirky?: boolean; // 奇特委託
};

export const SERVICE_ISSUES: IssueItem[] = [
  // ===== 馬桶 / 排水 =====
  { id: "toilet-clog",        label: "馬桶不通 / 阻塞",            parentCategory: "馬桶・排水", requiresLicense: false },
  { id: "toilet-parts",       label: "馬桶水箱零件壞（浮球/止水閥）", parentCategory: "馬桶・排水", requiresLicense: false },
  { id: "toilet-base-leak",   label: "馬桶底部漏水（換防水墊）",    parentCategory: "馬桶・排水", requiresLicense: false },
  { id: "drain-clog",         label: "排水孔阻塞（浴室/廚房）",     parentCategory: "馬桶・排水", requiresLicense: false },
  { id: "toilet-install",     label: "馬桶整體更換安裝",            parentCategory: "馬桶・排水", requiresLicense: true,  licenseNote: "需自來水管配管技術士" },
  { id: "pipe-burst",         label: "水管破裂 / 需切管接管",       parentCategory: "馬桶・排水", requiresLicense: true,  licenseNote: "需自來水管配管技術士" },

  // ===== 燈具 / 電氣 =====
  { id: "bulb-replace",       label: "換燈泡 / LED 燈管",           parentCategory: "燈具・電氣", requiresLicense: false },
  { id: "ceiling-light-swap", label: "吸頂燈換掉（插座型）",        parentCategory: "燈具・電氣", requiresLicense: false },
  { id: "network-cable",      label: "網路線 / 弱電佈線",           parentCategory: "燈具・電氣", requiresLicense: false },
  { id: "switch-broken",      label: "電燈開關壞了",                parentCategory: "燈具・電氣", requiresLicense: true,  licenseNote: "需室內配線技術士" },
  { id: "outlet-broken",      label: "插座壞了 / 增設插座",         parentCategory: "燈具・電氣", requiresLicense: true,  licenseNote: "需室內配線技術士" },
  { id: "circuit-trip",       label: "跳電 / 保險絲斷",             parentCategory: "燈具・電氣", requiresLicense: true,  licenseNote: "需室內配線技術士" },
  { id: "light-wiring",       label: "裝嵌燈 / 燈具走明線",        parentCategory: "燈具・電氣", requiresLicense: true,  licenseNote: "需室內配線技術士" },

  // ===== 水龍頭 / 熱水 =====
  { id: "faucet-leak",        label: "水龍頭漏水（換墊圈）",        parentCategory: "水龍頭・熱水", requiresLicense: false },
  { id: "shower-replace",     label: "換蓮蓬頭",                    parentCategory: "水龍頭・熱水", requiresLicense: false },
  { id: "faucet-replace",     label: "換水龍頭（螺紋接頭型）",      parentCategory: "水龍頭・熱水", requiresLicense: false },
  { id: "water-filter",       label: "裝設節水器 / 濾水器",         parentCategory: "水龍頭・熱水", requiresLicense: false },
  { id: "electric-heater",    label: "電熱水器安裝 / 維修",         parentCategory: "水龍頭・熱水", requiresLicense: true,  licenseNote: "需室內配線技術士" },
  { id: "gas-heater",         label: "瓦斯熱水器安裝 / 維修",       parentCategory: "水龍頭・熱水", requiresLicense: true,  licenseNote: "⚠️ 法定強制：需特定瓦斯器具裝修技術士" },
  { id: "main-pipe",          label: "水管主管線切接",              parentCategory: "水龍頭・熱水", requiresLicense: true,  licenseNote: "需自來水管配管技術士" },

  // ===== 瓦斯 =====
  { id: "gas-stove-igniter",  label: "瓦斯爐點火器壞（換零件）",   parentCategory: "瓦斯", requiresLicense: false },
  { id: "gas-stove-replace",  label: "瓦斯爐整台更換（接現有管）", parentCategory: "瓦斯", requiresLicense: true,  licenseNote: "⚠️ 建議認證師傅，安全考量" },
  { id: "gas-heater-install", label: "瓦斯熱水器任何安裝 / 維修",  parentCategory: "瓦斯", requiresLicense: true,  licenseNote: "⚠️ 法定強制：需特定瓦斯器具裝修技術士" },

  // ===== 油漆 / 非結構裝修 =====
  { id: "paint-interior",     label: "室內油漆粉刷",               parentCategory: "油漆・裝修", requiresLicense: false },
  { id: "paint-exterior",     label: "外牆油漆（需高處施工）",      parentCategory: "油漆・裝修", requiresLicense: false },
  { id: "wallpaper",          label: "壁紙 / 壁貼施工",            parentCategory: "油漆・裝修", requiresLicense: false },
  { id: "grout-caulk",        label: "磁磚填縫 / 矽利康填縫",      parentCategory: "油漆・裝修", requiresLicense: false },
  { id: "tile-repair",        label: "磁磚修補（局部）",            parentCategory: "油漆・裝修", requiresLicense: false },
  { id: "floor-click",        label: "鋪設木地板（卡扣式）",        parentCategory: "油漆・裝修", requiresLicense: false },
  { id: "partition-wall",     label: "輕隔間 / 天花板新設",         parentCategory: "油漆・裝修", requiresLicense: true,  licenseNote: "6 樓以上需室內裝修業登記（建築法）" },
  { id: "cabinet-structural", label: "木作系統櫃（結構型）",        parentCategory: "油漆・裝修", requiresLicense: true,  licenseNote: "同上" },

  // ===== 冷氣 / 家電 =====
  { id: "ac-clean",           label: "冷氣清洗（濾網 / 銅管）",    parentCategory: "冷氣・家電", requiresLicense: false },
  { id: "ac-recharge",        label: "冷氣不冷（加冷媒）",          parentCategory: "冷氣・家電", requiresLicense: false },
  { id: "ac-install",         label: "冷氣安裝 / 移機",             parentCategory: "冷氣・家電", requiresLicense: false },
  { id: "appliance-repair",   label: "家電維修（風扇 / 洗碗機等）", parentCategory: "冷氣・家電", requiresLicense: false },

  // ===== 開鎖 / 門窗 =====
  { id: "lockout",            label: "緊急開鎖",                   parentCategory: "開鎖・門窗", requiresLicense: false },
  { id: "lock-replace",       label: "換鎖頭 / 裝門鎖",            parentCategory: "開鎖・門窗", requiresLicense: false },
  { id: "safe-open",          label: "保險箱開鎖",                 parentCategory: "開鎖・門窗", requiresLicense: false },
  { id: "rolling-door",       label: "鐵捲門維修",                 parentCategory: "開鎖・門窗", requiresLicense: false },
  { id: "door-frame",         label: "門框 / 窗框修繕",            parentCategory: "開鎖・門窗", requiresLicense: false },
  { id: "screen-window",      label: "紗窗更換 / 修理",            parentCategory: "開鎖・門窗", requiresLicense: false },

  // ===== 清潔 / 雜務 =====
  { id: "house-clean",        label: "居家清潔",                   parentCategory: "清潔・雜務", requiresLicense: false },
  { id: "range-hood-clean",   label: "油煙機清洗",                 parentCategory: "清潔・雜務", requiresLicense: false },
  { id: "ac-deep-clean",      label: "冷氣深度清洗",               parentCategory: "清潔・雜務", requiresLicense: false },
  { id: "heavy-move",         label: "人力搬重物（無車輛）",        parentCategory: "清潔・雜務", requiresLicense: false },
  { id: "furniture-assemble", label: "組裝傢俱（IKEA 等）",        parentCategory: "清潔・雜務", requiresLicense: false },
  { id: "tv-mount",           label: "壁掛電視 / 掛畫",            parentCategory: "清潔・雜務", requiresLicense: false },
  { id: "curtain-install",    label: "窗簾 / 捲簾安裝",            parentCategory: "清潔・雜務", requiresLicense: false },

  // ===== 奇特委託 =====
  { id: "pest-physical",      label: "捉蟑螂 / 捕鼠（物理方式，不用藥）", parentCategory: "奇特委託", requiresLicense: false, isQuirky: true },
  { id: "queue-agent",        label: "代排隊 / 代辦雜事",          parentCategory: "奇特委託", requiresLicense: false, isQuirky: true },
  { id: "shopping-agent",     label: "協助購物 / 代買",            parentCategory: "奇特委託", requiresLicense: false, isQuirky: true },
  { id: "photo-video",        label: "拍照 / 錄影",               parentCategory: "奇特委託", requiresLicense: false, isQuirky: true },
  { id: "pet-transport",      label: "接送寵物",                  parentCategory: "奇特委託", requiresLicense: false, isQuirky: true },
  { id: "other-quirky",       label: "其他奇怪委託（自由填寫）",  parentCategory: "奇特委託", requiresLicense: false, isQuirky: true },
];

// 取得所有父分類（不重複）
export const ISSUE_CATEGORIES = Array.from(new Set(SERVICE_ISSUES.map((i) => i.parentCategory)));

// 依分類群組
export function getIssuesByCategory(category: string) {
  return SERVICE_ISSUES.filter((i) => i.parentCategory === category);
}
