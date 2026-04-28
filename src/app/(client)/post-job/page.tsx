"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-gray-500">載入中...</div></div>}>
      <PostJobInner />
    </Suspense>
  );
}

function PostJobInner() {
  const router = useRouter();
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

  return (
    <div className="min-h-screen pb-10">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-8">
        {/* 步驟指示 */}
        <div className="flex items-center gap-2 mb-6 text-sm">
          {(["category", "issue", "details"] as Step[]).map((s, i) => (
            <span key={s} className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step === s ? "bg-brand-500 text-white" :
                ["category","issue","details"].indexOf(step) > i ? "bg-green-500 text-white" :
                "bg-gray-200 text-gray-500"
              }`}>{i + 1}</span>
              <span className={step === s ? "text-brand-600 font-medium" : "text-gray-400"}>
                {s === "category" ? "選分類" : s === "issue" ? "選問題" : "填資料"}
              </span>
              {i < 2 && <ChevronRight className="w-4 h-4 text-gray-300" />}
            </span>
          ))}
        </div>

        {/* Step 1: 選分類 */}
        {step === "category" && (
          <Card>
            <CardHeader><CardTitle>你需要什麼服務？</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {ISSUE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setSelectedCategory(cat); setStep("issue"); }}
                  className={`p-4 rounded-xl border text-left text-sm font-medium transition-all hover:border-brand-400 hover:bg-brand-50 ${
                    cat === "奇特委託" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-gray-200"
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
          <Card>
            <CardHeader>
              <button onClick={() => setStep("category")} className="text-sm text-brand-500 mb-1">← 重選分類</button>
              <CardTitle>你的狀況是？</CardTitle>
              <p className="text-sm text-gray-500">{selectedCategory}</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {getIssuesByCategory(selectedCategory).map((issue) => (
                <button
                  key={issue.id}
                  onClick={() => { setSelectedIssue(issue); setStep("details"); }}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-brand-400 hover:bg-brand-50 text-left transition-all"
                >
                  <span className="text-sm">{issue.label}</span>
                  {issue.requiresLicense ? (
                    <Badge variant="warning" className="ml-2 shrink-0">需執照</Badge>
                  ) : (
                    <Badge variant="success" className="ml-2 shrink-0">遊俠可接</Badge>
                  )}
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Step 3: 填寫詳情 */}
        {step === "details" && selectedIssue && (
          <Card>
            <CardHeader>
              <button onClick={() => setStep("issue")} className="text-sm text-brand-500 mb-1">← 重選問題</button>
              <CardTitle>{selectedIssue.label}</CardTitle>
              {selectedIssue.requiresLicense ? (
                <div className="flex items-start gap-2 mt-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700">{selectedIssue.licenseNote ?? "此類服務需認證師傅，平台將自動篩選持有執照的遊俠。"}</p>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <p className="text-xs text-green-700">此類服務無需特定執照，所有遊俠皆可報價。</p>
                </div>
              )}
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
                <Label>問題描述 *</Label>
                <Textarea
                  className="mt-1"
                  placeholder="請描述狀況，例如：廚房水龍頭持續滴水，已試過自行更換墊圈無效..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>縣市 *</Label>
                  <select
                    className="mt-1 w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value, district: "" })}
                  >
                    {TAIWAN_CITIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <Label>行政區</Label>
                  <select
                    className="mt-1 w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                  >
                    <option value="">選擇行政區</option>
                    {districts.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {selectedCategory === "奇特委託" && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <span className="text-yellow-600">🐛</span>
                  <p className="text-xs text-yellow-700">
                    奇特委託預算上限為 NT${MAX_TRANSACTION_QUIRKY.toLocaleString()}，超出部分自動截止
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>預算下限（NT$）</Label>
                  <Input
                    type="number"
                    className="mt-1"
                    placeholder="不填表示不限"
                    value={form.budgetMin}
                    onChange={(e) => setForm({ ...form, budgetMin: e.target.value })}
                  />
                </div>
                <div>
                  <Label>
                    預算上限（NT$）
                    {selectedCategory === "奇特委託" && (
                      <span className="text-yellow-600 ml-1 text-xs">上限 {MAX_TRANSACTION_QUIRKY}</span>
                    )}
                  </Label>
                  <Input
                    type="number"
                    className="mt-1"
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
                <Label>希望施工日期</Label>
                <Input
                  type="date"
                  className="mt-1"
                  value={form.preferredDate}
                  onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
                />
              </div>

              <p className="text-xs text-gray-400">
                ※ 完整地址在成交後才會提供給遊俠，報價前僅顯示行政區
              </p>

              <Button
                className="w-full"
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
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">發案成功！</h2>
              <p className="text-gray-500 mb-6">遊俠們已收到通知，通常 2 小時內會開始報價。</p>
              <div className="flex gap-3 justify-center">
                <Button asChild variant="outline">
                  <a href="/dashboard">查看我的案件</a>
                </Button>
                <Button asChild>
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
