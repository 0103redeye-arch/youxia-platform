"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/Navbar";
import {
  ISSUE_CATEGORIES, SERVICE_ISSUES, getIssuesByCategory, type IssueItem,
} from "@/constants/issues";
import { MAX_TRANSACTION_QUIRKY } from "@/constants/fees";
import { TAIWAN_CITIES, DISTRICTS } from "@/constants/cities";
import { AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";

type Step = "category" | "issue" | "details" | "done";

export default function PostJobPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600 text-base">載入中...</div>
      </div>
    }>
      <PostJobInner />
    </Suspense>
  );
}

function PostJobInner() {
  const searchParams = useSearchParams();
  const initCategory = searchParams.get("category") ?? "";

  const [step, setStep] = useState<Step>(initCategory ? "issue" : "category");
  const [selectedCategory, setSelectedCategory] = useState(initCategory);
  const [selectedIssue, setSelectedIssue] = useState<IssueItem | null>(null);
  const [form, setForm] = useState({
    description: "", city: "台北市", district: "", address: "",
    budgetMin: "", budgetMax: "", preferredDate: "",
  });
  const [loading, setLoading] = useState(false);

  const districts = DISTRICTS[form.city] ?? [];

  async function submitJob() {
    if (!selectedIssue) return;
    setLoading(true);
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        issueId: selectedIssue.id,
        title: selectedIssue.label,
        description: form.description,
        city: form.city,
        district: form.district,
        address: form.address,
        budgetMin: form.budgetMin ? Number(form.budgetMin) : null,
        budgetMax: form.budgetMax ? Number(form.budgetMax) : null,
        preferredDate: form.preferredDate || null,
        jobType: selectedIssue.requiresLicense ? "LICENSED" : "OPEN",
      }),
    });
    setLoading(false);
    if (res.ok) setStep("done");
    else alert("發案失敗，請確認已登入");
  }

  const STEP_LABELS: Record<string, string> = {
    category: "選分類",
    issue: "選問題",
    details: "填資料",
  };
  const STEP_KEYS = ["category", "issue", "details"] as Step[];

  return (
    <div className="min-h-screen pb-12 bg-[#f8f9fa]">
      <Navbar />
      <div className="max-w-xl mx-auto px-5 py-10">

        {/* 步驟指示 */}
        {step !== "done" && (
          <div className="flex items-center gap-3 mb-8">
            {STEP_KEYS.map((s, i) => {
              const done = STEP_KEYS.indexOf(step) > i;
              const active = step === s;
              return (
                <span key={s} className="flex items-center gap-3">
                  <span className="flex items-center gap-2">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      active ? "bg-orange-500 text-white" :
                      done   ? "bg-green-500 text-white" :
                               "bg-slate-200 text-slate-500"
                    }`}>{i + 1}</span>
                    <span className={`text-sm font-medium ${active ? "text-slate-900" : done ? "text-green-600" : "text-slate-400"}`}>
                      {STEP_LABELS[s]}
                    </span>
                  </span>
                  {i < 2 && <ChevronRight className="w-4 h-4 text-slate-300" />}
                </span>
              );
            })}
          </div>
        )}

        {/* Step 1: 選分類 */}
        {step === "category" && (
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">你需要什麼服務？</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {ISSUE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setSelectedCategory(cat); setStep("issue"); }}
                  className={`p-5 rounded-xl border text-left font-semibold text-base transition-all hover:border-orange-400 hover:bg-orange-50 ${
                    cat === "奇特委託"
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-slate-200 text-slate-800"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Step 2: 選具體問題 */}
        {step === "issue" && selectedCategory && (
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <button
                onClick={() => setStep("category")}
                className="text-sm text-orange-500 font-medium mb-2 hover:text-orange-600"
              >
                ← 重選分類
              </button>
              <CardTitle className="text-xl">你的狀況是？</CardTitle>
              <p className="text-base text-slate-600 mt-1">{selectedCategory}</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {getIssuesByCategory(selectedCategory).map((issue) => (
                <button
                  key={issue.id}
                  onClick={() => { setSelectedIssue(issue); setStep("details"); }}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-orange-400 hover:bg-orange-50 text-left transition-all gap-3"
                >
                  <span className="text-base text-slate-800 font-medium">{issue.label}</span>
                  {issue.requiresLicense ? (
                    <Badge variant="warning" className="ml-2 shrink-0 text-sm px-3 py-1">需執照</Badge>
                  ) : (
                    <Badge variant="success" className="ml-2 shrink-0 text-sm px-3 py-1">遊俠可接</Badge>
                  )}
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Step 3: 填寫詳情 */}
        {step === "details" && selectedIssue && (
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <button
                onClick={() => setStep("issue")}
                className="text-sm text-orange-500 font-medium mb-2 hover:text-orange-600"
              >
                ← 重選問題
              </button>
              <CardTitle className="text-xl">{selectedIssue.label}</CardTitle>
              {selectedIssue.requiresLicense ? (
                <div className="flex items-start gap-3 mt-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-amber-800 leading-relaxed">
                    {selectedIssue.licenseNote ?? "此類服務需認證師傅，平台將自動篩選持有執照的遊俠。"}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3 mt-3 p-4 bg-green-50 rounded-xl border border-green-200">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  <p className="text-sm text-green-800">此類服務無需特定執照，所有遊俠皆可報價。</p>
                </div>
              )}
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div>
                <Label className="text-base font-semibold text-slate-800 mb-2 block">問題描述 *</Label>
                <Textarea
                  className="mt-1 text-base text-slate-800 min-h-[100px]"
                  placeholder="請描述狀況，例如：廚房水龍頭持續滴水，已試過自行更換墊圈無效..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-base font-semibold text-slate-800 mb-2 block">縣市 *</Label>
                  <select
                    className="mt-1 w-full h-11 rounded-xl border border-slate-200 px-3 text-base text-slate-800 bg-white"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value, district: "" })}
                  >
                    {TAIWAN_CITIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-base font-semibold text-slate-800 mb-2 block">行政區</Label>
                  <select
                    className="mt-1 w-full h-11 rounded-xl border border-slate-200 px-3 text-base text-slate-800 bg-white"
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                  >
                    <option value="">選擇行政區</option>
                    {districts.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {selectedCategory === "奇特委託" && (
                <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <span className="text-yellow-600 text-lg">🐛</span>
                  <p className="text-sm text-yellow-800 leading-relaxed">
                    奇特委託預算上限為 NT${MAX_TRANSACTION_QUIRKY.toLocaleString()}，超出部分自動截止
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-base font-semibold text-slate-800 mb-2 block">預算下限（NT$）</Label>
                  <Input
                    type="number"
                    className="mt-1 h-11 text-base"
                    placeholder="不填表示不限"
                    value={form.budgetMin}
                    onChange={(e) => setForm({ ...form, budgetMin: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-base font-semibold text-slate-800 mb-2 block">
                    預算上限（NT$）
                    {selectedCategory === "奇特委託" && (
                      <span className="text-yellow-600 ml-2 text-sm font-normal">上限 {MAX_TRANSACTION_QUIRKY}</span>
                    )}
                  </Label>
                  <Input
                    type="number"
                    className="mt-1 h-11 text-base"
                    placeholder="不填表示不限"
                    max={selectedCategory === "奇特委託" ? MAX_TRANSACTION_QUIRKY : undefined}
                    value={form.budgetMax}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (selectedCategory === "奇特委託" && Number(v) > MAX_TRANSACTION_QUIRKY) {
                        setForm({ ...form, budgetMax: String(MAX_TRANSACTION_QUIRKY) });
                      } else {
                        setForm({ ...form, budgetMax: v });
                      }
                    }}
                  />
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold text-slate-800 mb-2 block">希望施工日期</Label>
                <Input
                  type="date"
                  className="mt-1 h-11 text-base"
                  value={form.preferredDate}
                  onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
                />
              </div>

              <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                ※ 完整地址在成交後才會提供給遊俠，報價前僅顯示行政區
              </p>

              <Button
                className="w-full h-12 text-base font-semibold rounded-xl"
                size="lg"
                onClick={submitJob}
                disabled={loading || !form.description || !form.city}
              >
                {loading ? "發案中..." : "確認發案"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Done */}
        {step === "done" && (
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardContent className="py-16 text-center px-8">
              <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-slate-900 mb-3">發案成功！</h2>
              <p className="text-base text-slate-700 mb-8">遊俠們已收到通知，通常 2 小時內會開始報價。</p>
              <div className="flex gap-4 justify-center">
                <Button asChild variant="outline" className="h-11 px-6 text-base font-semibold rounded-xl">
                  <a href="/dashboard">查看我的案件</a>
                </Button>
                <Button asChild className="h-11 px-6 text-base font-semibold rounded-xl">
                  <a href="/">回首頁</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
