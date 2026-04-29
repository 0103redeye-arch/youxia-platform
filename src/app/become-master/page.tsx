"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { TAIWAN_CITIES } from "@/constants/cities";

const LICENSE_TYPES = [
  "自來水管配管技術士",
  "室內配線技術士",
  "特定瓦斯器具裝修技術士",
  "室內裝修業登記",
  "其他（請說明）",
];

const YOUXIA_LEVELS = [
  { level: 1, title: "初出茅廬", fee: "15%", condition: "剛加入" },
  { level: 2, title: "江湖新秀", fee: "13%", condition: "完成 5 筆 + 評分 ≥ 4.0" },
  { level: 3, title: "熟練遊俠", fee: "11%", condition: "完成 20 筆 + 評分 ≥ 4.3" },
  { level: 4, title: "俠客高手", fee: "9%",  condition: "完成 50 筆 + 評分 ≥ 4.5" },
  { level: 5, title: "傳說宗師", fee: "7%",  condition: "完成 100 筆 + 評分 ≥ 4.7" },
];

export default function BecomeMasterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"info" | "areas" | "license" | "done">("info");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form fields
  const [displayName, setDisplayName] = useState("");
  const [realName, setRealName]       = useState("");
  const [nationalId, setNationalId]   = useState("");
  const [bio, setBio]                 = useState("");
  const [serviceAreas, setServiceAreas] = useState<string[]>([]);
  const [isLicensed, setIsLicensed]   = useState(false);
  const [licenseType, setLicenseType] = useState("");
  const [licenseOther, setLicenseOther] = useState("");

  function toggleCity(city: string) {
    setServiceAreas(prev =>
      prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
    );
  }

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/my/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          realName:    realName.trim(),
          nationalId:  nationalId.trim(),
          bio:         bio.trim() || null,
          serviceAreas,
          isLicensed,
          licenseType: isLicensed
            ? (licenseType === "其他（請說明）" ? licenseOther : licenseType)
            : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "送出失敗，請稍後再試");
        setLoading(false);
        return;
      }
      setStep("done");
    } catch {
      setError("網路錯誤，請稍後再試");
    } finally {
      setLoading(false);
    }
  }

  if (step === "done") {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
        <Navbar />
        <div className="flex flex-col items-center justify-center flex-1 px-6 py-24 text-center">
          <div className="text-8xl mb-6">⚔️</div>
          <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">歡迎加入遊俠行列！</h1>
          <p className="text-base text-slate-700 mb-3">你的身份驗證申請已送出，審核通常在 1-2 個工作天內完成。</p>
          <p className="text-base text-slate-600 mb-10">審核通過後，你就可以開始接案賺錢了。</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-10 py-4 rounded-xl text-base transition-colors"
          >
            前往我的工作台 →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      <Navbar />

      {/* Hero */}
      <div className="bg-[#0c1220] text-white px-6 py-10">
        <div className="max-w-2xl mx-auto">
          <div className="text-5xl mb-4">⚔️</div>
          <h1 className="text-2xl font-black tracking-tight mb-2">成為遊俠，自由接案</h1>
          <p className="text-slate-300 text-base">接案越多、評分越高，抽傭越低。傳說宗師只抽 7%。</p>
        </div>
      </div>

      {/* 等級說明 */}
      <div className="bg-white border-b border-slate-100 px-6 py-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wide">遊俠等級制度</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {YOUXIA_LEVELS.map(lv => (
              <div
                key={lv.level}
                className="flex-shrink-0 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 min-w-[110px]"
              >
                <div className="text-xs font-bold text-orange-500 mb-1">Lv.{lv.level}</div>
                <div className="text-sm font-bold text-slate-900">{lv.title}</div>
                <div className="text-sm font-black text-green-600 mt-1">抽 {lv.fee}</div>
                <div className="text-xs text-slate-500 mt-1 leading-snug">{lv.condition}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          {[
            { key: "info",    label: "基本資料" },
            { key: "areas",   label: "服務區域" },
            { key: "license", label: "完成送出" },
          ].map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              {i > 0 && <div className="w-8 h-px bg-slate-200" />}
              <div className={`flex items-center gap-1.5 ${step === s.key ? "text-orange-600" : "text-slate-400"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                  step === s.key ? "border-orange-500 bg-orange-50 text-orange-600" : "border-slate-200 text-slate-400"
                }`}>{i + 1}</div>
                <span className="text-sm font-semibold hidden sm:inline">{s.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 px-6 py-8">
        <div className="max-w-2xl mx-auto">

          {/* ── Step 1: 基本資料 ── */}
          {step === "info" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-xl font-black text-slate-900 mb-6">基本資料</h2>

              <div className="space-y-5">
                <div>
                  <label className="text-base font-semibold text-slate-800 mb-2 block">
                    顯示名稱 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="例：水電達人王師傅"
                    className="w-full h-11 px-4 border-2 border-slate-200 rounded-xl text-base text-slate-800 focus:border-orange-400 focus:outline-none"
                  />
                  <p className="text-sm text-slate-500 mt-1">客戶看到的名稱（可用暱稱）</p>
                </div>

                <div>
                  <label className="text-base font-semibold text-slate-800 mb-2 block">
                    真實姓名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={realName}
                    onChange={e => setRealName(e.target.value)}
                    placeholder="請輸入真實中文姓名"
                    className="w-full h-11 px-4 border-2 border-slate-200 rounded-xl text-base text-slate-800 focus:border-orange-400 focus:outline-none"
                  />
                  <p className="text-sm text-slate-500 mt-1">僅供平台 KYC 驗證，不公開顯示</p>
                </div>

                <div>
                  <label className="text-base font-semibold text-slate-800 mb-2 block">
                    身份證字號 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nationalId}
                    onChange={e => setNationalId(e.target.value.toUpperCase())}
                    placeholder="A123456789"
                    maxLength={10}
                    className="w-full h-11 px-4 border-2 border-slate-200 rounded-xl text-base text-slate-800 focus:border-orange-400 focus:outline-none font-mono tracking-wider"
                  />
                  <p className="text-sm text-slate-500 mt-1">系統僅儲存加密雜湊值，不保留明碼</p>
                </div>

                <div>
                  <label className="text-base font-semibold text-slate-800 mb-2 block">自我介紹</label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="介紹你的專長、服務年資、擅長項目等…"
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-base text-slate-800 focus:border-orange-400 focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="mt-8">
                <button
                  onClick={() => {
                    if (!displayName.trim() || !realName.trim() || !nationalId.trim()) {
                      setError("請填寫所有必填欄位");
                      return;
                    }
                    if (!/^[A-Z][0-9]{9}$/i.test(nationalId.trim())) {
                      setError("身份證字號格式不正確（1 個英文字母 + 9 個數字）");
                      return;
                    }
                    setError("");
                    setStep("areas");
                  }}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl text-base transition-colors"
                >
                  下一步：選擇服務區域 →
                </button>
                {error && <p className="text-red-600 text-sm mt-3 text-center">{error}</p>}
              </div>
            </div>
          )}

          {/* ── Step 2: 服務區域 ── */}
          {step === "areas" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-xl font-black text-slate-900 mb-2">服務區域</h2>
              <p className="text-base text-slate-600 mb-6">選擇你可以前往接案的縣市（可多選）</p>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mb-8">
                {TAIWAN_CITIES.map(city => (
                  <button
                    key={city}
                    onClick={() => toggleCity(city)}
                    className={`py-3 px-2 rounded-xl border-2 text-sm font-semibold transition-colors ${
                      serviceAreas.includes(city)
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : "border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>

              {serviceAreas.length > 0 && (
                <div className="bg-orange-50 rounded-xl px-4 py-3 border border-orange-100 mb-6">
                  <p className="text-sm text-orange-700 font-semibold">
                    已選擇 {serviceAreas.length} 個服務縣市：{serviceAreas.join("、")}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("info")}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl text-base transition-colors"
                >
                  ← 上一步
                </button>
                <button
                  onClick={() => {
                    if (serviceAreas.length === 0) {
                      setError("請至少選擇一個服務縣市");
                      return;
                    }
                    setError("");
                    setStep("license");
                  }}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl text-base transition-colors"
                >
                  下一步 →
                </button>
              </div>
              {error && <p className="text-red-600 text-sm mt-3 text-center">{error}</p>}
            </div>
          )}

          {/* ── Step 3: 執照 + 送出 ── */}
          {step === "license" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-xl font-black text-slate-900 mb-2">執照資格（選填）</h2>
              <p className="text-base text-slate-600 mb-6">
                有執照可接水電瓦斯等需認證的高單價案件，並顯示「已驗證」徽章
              </p>

              <div className="mb-6">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div
                    onClick={() => setIsLicensed(!isLicensed)}
                    className={`w-12 h-6 rounded-full transition-colors flex items-center ${
                      isLicensed ? "bg-orange-500" : "bg-slate-200"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform mx-0.5 ${
                      isLicensed ? "translate-x-6" : "translate-x-0"
                    }`} />
                  </div>
                  <span className="text-base font-semibold text-slate-800">我持有相關執照</span>
                </label>
              </div>

              {isLicensed && (
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-base font-semibold text-slate-800 mb-2 block">執照類型</label>
                    <div className="space-y-2">
                      {LICENSE_TYPES.map(type => (
                        <label key={type} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="licenseType"
                            value={type}
                            checked={licenseType === type}
                            onChange={() => setLicenseType(type)}
                            className="w-4 h-4 accent-orange-500"
                          />
                          <span className="text-base text-slate-800">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {licenseType === "其他（請說明）" && (
                    <input
                      type="text"
                      value={licenseOther}
                      onChange={e => setLicenseOther(e.target.value)}
                      placeholder="請填寫執照名稱"
                      className="w-full h-11 px-4 border-2 border-slate-200 rounded-xl text-base text-slate-800 focus:border-orange-400 focus:outline-none"
                    />
                  )}
                  <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                    <p className="text-sm text-amber-800">
                      ⚠️ 申請後管理員將人工審核執照照片，審核通過前顯示「認證進行中」
                    </p>
                  </div>
                </div>
              )}

              {/* 確認摘要 */}
              <div className="bg-slate-50 rounded-xl px-5 py-4 border border-slate-100 mb-6 space-y-2">
                <p className="text-sm font-bold text-slate-600 mb-3">確認資料</p>
                <div className="text-sm text-slate-800 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
                  <span className="text-slate-500">顯示名稱</span><span className="font-semibold">{displayName}</span>
                  <span className="text-slate-500">真實姓名</span><span className="font-semibold">{realName}</span>
                  <span className="text-slate-500">身份證</span><span className="font-semibold font-mono">
                    {nationalId.slice(0, 3)}****{nationalId.slice(-3)}
                  </span>
                  <span className="text-slate-500">服務縣市</span>
                  <span className="font-semibold">{serviceAreas.length} 個縣市</span>
                  <span className="text-slate-500">執照</span>
                  <span className="font-semibold">{isLicensed ? (licenseType || "未選擇") : "無"}</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                  <p className="text-red-700 text-sm font-semibold">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("areas")}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl text-base transition-colors"
                >
                  ← 上一步
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl text-base transition-colors"
                >
                  {loading ? "送出中…" : "⚔️ 正式加入遊俠"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
