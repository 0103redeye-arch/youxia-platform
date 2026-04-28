import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import { ISSUE_CATEGORIES, SERVICE_ISSUES } from "@/constants/issues";
import {
  Wrench, Zap, Wind, Lock, Brush, Bug,
  Star, ShieldCheck, TrendingUp, ArrowRight,
  Droplets, Flame, Airplay, Scissors,
} from "lucide-react";

const CATEGORY_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  "馬桶・排水":   { icon: Droplets, color: "text-sky-600",    bg: "bg-sky-50" },
  "燈具・電氣":   { icon: Zap,      color: "text-yellow-600", bg: "bg-yellow-50" },
  "水龍頭・熱水": { icon: Wrench,   color: "text-blue-600",   bg: "bg-blue-50" },
  "瓦斯":         { icon: Flame,    color: "text-red-600",    bg: "bg-red-50" },
  "油漆・裝修":   { icon: Brush,    color: "text-purple-600", bg: "bg-purple-50" },
  "冷氣・家電":   { icon: Airplay,  color: "text-cyan-600",   bg: "bg-cyan-50" },
  "開鎖・門窗":   { icon: Lock,     color: "text-slate-600",  bg: "bg-slate-100" },
  "清潔・雜務":   { icon: Scissors, color: "text-green-600",  bg: "bg-green-50" },
};

const STEPS = [
  { n: "1", title: "描述問題",   desc: "選分類或自由輸入，一分鐘完成發案。" },
  { n: "2", title: "收到報價",   desc: "附近遊俠自行投標，通常 2 小時內有回應。" },
  { n: "3", title: "選定付款",   desc: "比評分、比價格，線上安全付款。" },
  { n: "4", title: "完工評價",   desc: "施工完成雙向評分，好師傅越做越旺。" },
];

const STATS = [
  { value: "500+", label: "認證遊俠" },
  { value: "98%",  label: "客戶滿意度" },
  { value: "2h",   label: "平均首次回應" },
  { value: "0元",  label: "發案費用" },
];

const TRUST = [
  { icon: ShieldCheck, title: "執照驗證",  desc: "水電、瓦斯師傅皆上傳執照，平台人工審核。" },
  { icon: Star,        title: "雙向評分",  desc: "每筆完工後客戶與遊俠互評，紀錄永久公開。" },
  { icon: TrendingUp,  title: "等級升降",  desc: "好評多、接案多，等級越高，平台抽成越低。" },
];

export default function HomePage() {
  const mainCategories = ISSUE_CATEGORIES.filter((c) => c !== "奇特委託");

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-[#f8f9fa]">
      <Navbar />

      {/* ── Hero ── */}
      <section className="bg-[#0c1220] text-white">
        <div className="max-w-5xl mx-auto px-5 py-16 md:py-24 flex flex-col md:flex-row items-center gap-10">
          {/* 文字 */}
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-orange-400 bg-orange-400/10 border border-orange-400/20 px-3 py-1.5 rounded-full mb-5 tracking-wide uppercase">
              台灣在地服務媒合
            </div>
            <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tighter mb-5">
              找師傅、接委託<br />
              <span className="text-orange-400">一鍵搞定</span>
            </h1>
            <p className="text-slate-200 text-base md:text-lg leading-relaxed mb-8 max-w-md">
              水電・冷氣・開鎖・油漆，或任何奇怪委託。<br className="hidden md:block" />
              免費發案，多家遊俠報價，選最合適的人。
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link
                href="/post-job"
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
              >
                立即免費發案
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/jobs"
                className="inline-flex items-center gap-2 bg-white/8 hover:bg-white/12 text-slate-200 font-medium px-6 py-3 rounded-xl border border-white/10 transition-colors text-sm"
              >
                瀏覽委託列表
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 w-full md:w-64 shrink-0">
            {STATS.map(({ value, label }) => (
              <div key={label} className="bg-white/5 border border-white/8 rounded-2xl p-4 text-center">
                <div className="text-2xl font-black text-white mb-0.5">{value}</div>
                <div className="text-sm text-slate-200 leading-tight">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 服務分類 ── */}
      <section className="max-w-5xl mx-auto px-5 py-12">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">選擇你需要的服務</h2>
          <Link href="/post-job" className="text-sm text-orange-500 hover:text-orange-600 font-semibold flex items-center gap-1">
            全部分類 <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
          {mainCategories.map((cat) => {
            const meta = CATEGORY_META[cat] ?? { icon: Wrench, color: "text-slate-600", bg: "bg-slate-100" };
            const Icon = meta.icon;
            const count = SERVICE_ISSUES.filter((i) => i.parentCategory === cat).length;
            return (
              <Link
                key={cat}
                href={`/post-job?category=${encodeURIComponent(cat)}`}
                className="group flex flex-col items-center gap-2.5 p-4 bg-white rounded-2xl border border-slate-100 hover:border-orange-200 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 text-center"
              >
                <div className={`w-11 h-11 rounded-xl ${meta.bg} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                  <Icon className={`w-5 h-5 ${meta.color}`} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 leading-tight mb-0.5">{cat}</div>
                  <div className="text-xs text-slate-600">{count} 種問題</div>
                </div>
              </Link>
            );
          })}

          {/* 奇特委託 */}
          <Link
            href="/post-job?category=%E5%A5%87%E7%89%B9%E5%A7%94%E8%A8%97"
            className="group flex flex-col items-center gap-2.5 p-4 bg-amber-50 rounded-2xl border border-amber-100 hover:border-amber-300 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 text-center"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Bug className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-700 leading-tight mb-0.5">奇特委託</div>
              <div className="text-xs text-amber-600">自由發案</div>
            </div>
          </Link>
        </div>
      </section>

      {/* ── 流程 ── */}
      <section className="bg-white border-y border-slate-100 py-14 px-5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight text-center mb-10">四步完成，快速搞定</h2>
          <div className="grid md:grid-cols-4 gap-0 relative">
            {/* 連接線 */}
            <div className="hidden md:block absolute top-6 left-[12.5%] right-[12.5%] h-px bg-slate-100 z-0" />

            {STEPS.map(({ n, title, desc }) => (
              <div key={n} className="relative z-10 flex flex-col items-center text-center px-4 mb-8 md:mb-0">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-black text-lg flex items-center justify-center mb-4 shadow-sm">
                  {n}
                </div>
                <div className="font-bold text-slate-900 text-base mb-1.5">{title}</div>
                <p className="text-sm text-slate-700 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 信任 ── */}
      <section className="max-w-4xl mx-auto px-5 py-14">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight text-center mb-8">為什麼選擇俠客行不行？</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {TRUST.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-sm transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-orange-500" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">{title}</h3>
              <p className="text-sm text-slate-700 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA 底部 ── */}
      <section className="bg-[#0c1220] py-14 px-5">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-black text-white tracking-tighter mb-3">
            有問題？<span className="text-orange-400">一鍵找遊俠</span>
          </h2>
          <p className="text-slate-200 text-base mb-7">免費發案，不限種類，最快 2 小時內有師傅回應。</p>
          <Link
            href="/post-job"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors"
          >
            立即免費發案
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <BottomNav />
    </div>
  );
}
