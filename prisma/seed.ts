import { PrismaClient } from "@prisma/client";
import { SERVICE_ISSUES } from "../src/constants/issues";

const prisma = new PrismaClient();

const ACHIEVEMENTS = [
  // ── 通用成就（里程碑） ──
  // 稀有度對應：1=除暴 2=斬妖 3=弒君 4=誅仙 5=屠龍
  { id: "first-job",       name: "一劍光寒",   icon: "🌱", rarity: 1, category: null, description: "完成第一個案件",                                requirement: "完成第 1 筆案件" },
  { id: "ten-jobs",        name: "十步一人",   icon: "🥷", rarity: 2, category: null, description: "完成 10 個案件",                                requirement: "累計完成 10 筆" },
  { id: "hundred-jobs",    name: "百戰不殆",   icon: "🗡️", rarity: 3, category: null, description: "完成 100 個案件",                               requirement: "累計完成 100 筆" },
  { id: "thousand-jobs",   name: "劍氣沖霄",   icon: "🏆", rarity: 4, category: null, description: "完成 1000 個案件",                              requirement: "累計完成 1000 筆" },
  { id: "free-spirit",     name: "事了拂衣",   icon: "👑", rarity: 5, category: null, description: "以俠義（零酬）完成 50 筆，且發單人各不相同", requirement: "俠義接案累計 50 筆，發單人不重複" },

  // ── 評分成就 ──
  { id: "perfect-ten",    name: "颯沓流星",   icon: "🌟", rarity: 3, category: null, description: "連續 10 筆五星評分",        requirement: "連續 10 筆全獲 5 星" },
  { id: "grand-master",   name: "一代宗師",   icon: "💎", rarity: 5, category: null, description: "維持 4.9+ 評分超過 50 筆",  requirement: "50 筆以上且評分 ≥ 4.9" },

  // ── 水電類 ──
  { id: "plumber",         name: "上善若水",   icon: "🚿", rarity: 2, category: "馬桶・排水",   description: "完成 10 筆排水案件",   requirement: "排水/馬桶類完成 10 筆" },
  { id: "electrician",     name: "光明左使",   icon: "💡", rarity: 2, category: "燈具・電氣",   description: "完成 10 筆電氣案件",   requirement: "電氣類完成 10 筆" },
  { id: "gas-expert",      name: "光明右使",   icon: "🔥", rarity: 3, category: "瓦斯",         description: "完成 10 筆瓦斯案件",   requirement: "瓦斯類完成 10 筆（需執照）" },

  // ── 特殊類 ──
  { id: "locksmith",       name: "如入無人",   icon: "🔑", rarity: 2, category: "開鎖・門窗",   description: "完成 10 筆開鎖案件",   requirement: "開鎖/門窗類完成 10 筆" },
  { id: "quirky-hero",     name: "武林怪傑",   icon: "🐛", rarity: 3, category: "奇特委託",     description: "完成 20 筆奇特委託",   requirement: "奇特委託類完成 20 筆" },
  { id: "all-rounder",     name: "萬法全通",   icon: "🎭", rarity: 4, category: null,           description: "完成 5 種以上不同分類", requirement: "接過 5 種以上服務分類" },

  // ── 時效 ──
  { id: "night-owl",       name: "挑燈看劍",   icon: "🦉", rarity: 2, category: null, description: "深夜接案並完成",            requirement: "20:00–05:00 接案完成 20 次" },

  // ── 地區 ──
  { id: "district-champ",  name: "獨孤求敗",   icon: "🏯", rarity: 5, category: null, description: "連續半年蟬聯行政區傳說宗師",  requirement: "同一行政區傳說宗師名額連續保持 6 個月" },
];

async function main() {
  console.log("種子資料：匯入問題分類...");
  for (const issue of SERVICE_ISSUES) {
    await prisma.serviceIssue.upsert({
      where: { id: issue.id },
      update: {
        label:           issue.label,
        parentCategory:  issue.parentCategory,
        requiresLicense: issue.requiresLicense,
        licenseNote:     issue.licenseNote ?? null,
        jobType:         issue.requiresLicense ? "LICENSED" : "OPEN",
      },
      create: {
        id:              issue.id,
        label:           issue.label,
        parentCategory:  issue.parentCategory,
        requiresLicense: issue.requiresLicense,
        licenseNote:     issue.licenseNote ?? null,
        jobType:         issue.requiresLicense ? "LICENSED" : "OPEN",
      },
    });
  }
  console.log(`✓ 共匯入 ${SERVICE_ISSUES.length} 筆問題分類`);

  console.log("種子資料：匯入成就定義...");
  for (const ach of ACHIEVEMENTS) {
    await prisma.achievementDef.upsert({
      where: { id: ach.id },
      update: {
        name:        ach.name,
        icon:        ach.icon,
        rarity:      ach.rarity,
        category:    ach.category ?? null,
        description: ach.description,
        requirement: ach.requirement,
      },
      create: {
        id:          ach.id,
        name:        ach.name,
        icon:        ach.icon,
        rarity:      ach.rarity,
        category:    ach.category ?? null,
        description: ach.description,
        requirement: ach.requirement,
      },
    });
  }
  console.log(`✓ 共匯入 ${ACHIEVEMENTS.length} 筆成就定義`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
