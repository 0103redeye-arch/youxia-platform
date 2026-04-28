import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ISSUE_CATEGORIES, SERVICE_ISSUES } from "@/constants/issues";
import {
  Wrench, Zap, Wind, Lock, Brush, Bug, Star, ShieldCheck, Sword,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "馬桶・排水": Wrench,
  "燈具・電氣": Zap,
  "水龍頭・熱水": Wrench,
  "瓦斯": Wind,
  "油漆・裝修": Brush,
  "冷氣・家電": Wind,
  "開鎖・門窗": Lock,
  "清潔・雜務": Brush,
  "奇特委託": Bug,
};

const HOW_IT_WORKS = [
  { step: "01", title: "描述你的問題", desc: "選擇狀況分類，或自由輸入，一分鐘完成發案。" },
  { step: "02", title: "等待遊俠報價", desc: "附近的遊俠看到後自行報價，通常 2 小時內有回應。" },
  { step: "03", title: "挑選並付款", desc: "比較評分、報價、說明，選定後線上付款，安全有保障。" },
  { step: "04", title: "完工留評價", desc: "施工完成雙向評價，好評幫助遊俠晉升，劣者自然被淘汰。" },
];

export default function HomePage() {
  const mainCategories = ISSUE_CATEGORIES.filter((c) => c !== "奇特委託");

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-500 to-brand-700 text-white py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sword className="w-8 h-8" />
            <span className="text-2xl font-bold">俠客行不行</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            找師傅、接委託<br />一鍵搞定
          </h1>
          <p className="text-brand-100 mb-8 text-lg">
            水電・冷氣・開鎖・油漆，或任何奇怪委託<br />
            發案詢價、評價透明、遊俠接案
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button asChild size="lg" variant="secondary">
              <Link href="/post-job">立即發案</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              <Link href="/jobs">瀏覽委託</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 服務分類 */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-xl font-bold text-gray-800 mb-6">選擇你需要的服務</h2>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {mainCategories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat] ?? Wrench;
            const count = SERVICE_ISSUES.filter((i) => i.parentCategory === cat).length;
            return (
              <Link
                key={cat}
                href={`/post-job?category=${encodeURIComponent(cat)}`}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white border border-gray-100 hover:border-brand-300 hover:shadow-md transition-all text-center"
              >
                <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-brand-500" />
                </div>
                <span className="text-xs font-medium text-gray-700 leading-tight">{cat}</span>
                <span className="text-[10px] text-gray-400">{count} 種問題</span>
              </Link>
            );
          })}
          {/* 奇特委託 */}
          <Link
            href="/post-job?category=%E5%A5%87%E7%89%B9%E5%A7%94%E8%A8%97"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-amber-50 border border-amber-200 hover:border-amber-400 hover:shadow-md transition-all text-center"
          >
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <Bug className="w-6 h-6 text-amber-600" />
            </div>
            <span className="text-xs font-medium text-amber-700 leading-tight">奇特委託</span>
            <span className="text-[10px] text-amber-500">自由發案</span>
          </Link>
        </div>
      </section>

      {/* 流程說明 */}
      <section className="bg-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-gray-800 mb-8 text-center">怎麼運作的？</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-brand-500 text-white font-bold text-lg flex items-center justify-center mx-auto mb-3">
                  {step}
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 遊俠等級說明 */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-xl font-bold text-gray-800 mb-2">遊俠等級制度</h2>
        <p className="text-gray-500 text-sm mb-6">評價越高、接案越多，等級越高的遊俠值得更多信賴，也享有更多平台特權。</p>
        <div className="flex gap-3 flex-wrap">
          {[
            { title: "初出茅廬", perk: "踏入江湖",       color: "bg-gray-100 text-gray-600" },
            { title: "江湖新秀", perk: "搜尋優先曝光",   color: "bg-blue-100 text-blue-700" },
            { title: "熟練遊俠", perk: "新案優先通知",   color: "bg-green-100 text-green-700" },
            { title: "俠客高手", perk: "個人徽章",       color: "bg-purple-100 text-purple-700" },
            { title: "傳說宗師", perk: "區域首頁廣告",   color: "bg-amber-100 text-amber-700" },
          ].map(({ title, perk, color }) => (
            <div key={title} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${color}`}>
              <Sword className="w-4 h-4" />
              {title}
              <span className="opacity-70">{perk}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 信任標章 */}
      <section className="bg-brand-50 py-10 px-4">
        <div className="max-w-3xl mx-auto grid md:grid-cols-3 gap-6 text-center">
          {[
            { icon: ShieldCheck, title: "執照驗證", desc: "水電瓦斯師傅皆經平台審核執照" },
            { icon: Star,        title: "雙向評分", desc: "完工後客戶與遊俠互相評分，透明公正" },
            { icon: Sword,       title: "遊俠升級", desc: "好師傅越做越多，等級越高、特權越多，值得信賴" },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title}>
              <CardContent className="pt-6 text-center">
                <Icon className="w-10 h-10 text-brand-500 mx-auto mb-3" />
                <h3 className="font-semibold mb-1">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <BottomNav />
    </div>
  );
}
