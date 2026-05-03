"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TAIWAN_CITIES } from "@/constants/cities";
import { getYouxiaTitle } from "@/constants/fees";
import { Sword, Check, Loader2, MapPin, ToggleLeft, ToggleRight } from "lucide-react";

interface Profile {
  id: string;
  displayName: string;
  bio: string | null;
  serviceAreas: string[];
  isAvailable: boolean;
  avgRating: number;
  totalOrders: number;
  youxiaLevel: number;
  idVerifyStatus: string;
  realName: string | null;
  nationalIdLast4: string | null;
}

export default function ProfileEditPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // form fields
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [serviceAreas, setServiceAreas] = useState<string[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    fetch("/api/my/profile")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) { router.push("/become-master"); return; }
        setProfile(data);
        setDisplayName(data.displayName ?? "");
        setBio(data.bio ?? "");
        setServiceAreas(data.serviceAreas ?? []);
        setIsAvailable(data.isAvailable ?? true);
        setLoading(false);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  function toggleArea(city: string) {
    setServiceAreas(prev =>
      prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
    );
  }

  async function handleSave() {
    if (!displayName.trim()) { setError("請填寫顯示名稱"); return; }
    setSaving(true); setError(""); setSaved(false);
    try {
      const res = await fetch("/api/my/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, bio, serviceAreas, isAvailable }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "儲存失敗，請重試");
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      setError("網路錯誤，請重試");
    } finally {
      setSaving(false);
    }
  }

  const KYC_LABEL: Record<string, { text: string; color: string }> = {
    UNSUBMITTED: { text: "未送審", color: "text-slate-500 bg-slate-100" },
    PENDING:     { text: "審核中", color: "text-yellow-700 bg-yellow-100" },
    VERIFIED:    { text: "已認證 ✓", color: "text-green-700 bg-green-100" },
    REJECTED:    { text: "審核未通過", color: "text-red-700 bg-red-100" },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
      </div>
    );
  }

  const kyc = KYC_LABEL[profile?.idVerifyStatus ?? "UNSUBMITTED"];

  return (
    <div className="min-h-screen pb-24 md:pb-0 bg-[#f8f9fa]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-5 py-10 flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center">
            <Sword className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">遊俠檔案</h1>
            <p className="text-sm text-slate-600">
              {getYouxiaTitle(profile?.youxiaLevel ?? 1)} · Lv.{profile?.youxiaLevel} ·
              完成 {profile?.totalOrders} 件 · 評分 {profile?.avgRating.toFixed(1)}
            </p>
          </div>
        </div>

        {/* KYC status card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="text-base font-bold text-slate-800 mb-3">身份驗證</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">
                真實姓名：{profile?.realName ?? "—"}
                {profile?.nationalIdLast4 && (
                  <span className="ml-2 text-slate-400">身份證末4碼：{profile.nationalIdLast4}</span>
                )}
              </p>
              <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${kyc.color}`}>
                {kyc.text}
              </span>
            </div>
            {profile?.idVerifyStatus === "UNSUBMITTED" && (
              <Button asChild size="sm" variant="outline" className="text-sm rounded-lg">
                <a href="/become-master">重新申請</a>
              </Button>
            )}
          </div>
        </div>

        {/* Basic info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4">
          <h2 className="text-base font-bold text-slate-800">基本資訊</h2>

          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-1.5 block">顯示名稱 *</Label>
            <Input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              maxLength={20}
              className="h-11"
              placeholder="在平台上顯示的名字"
            />
          </div>

          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-1.5 block">自我介紹</Label>
            <Textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={300}
              rows={4}
              className="resize-none"
              placeholder="介紹你的經歷、專長、服務態度…"
            />
            <p className="text-xs text-slate-400 mt-1 text-right">{bio.length}/300</p>
          </div>

          {/* Availability toggle */}
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-semibold text-slate-800">接案狀態</p>
              <p className="text-xs text-slate-500 mt-0.5">關閉後，你的案件列表將不顯示在搜尋結果</p>
            </div>
            <button
              onClick={() => setIsAvailable(v => !v)}
              className="flex items-center gap-2 text-sm font-semibold transition-colors"
            >
              {isAvailable ? (
                <>
                  <ToggleRight className="w-8 h-8 text-green-500" />
                  <span className="text-green-600">接案中</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-8 h-8 text-slate-400" />
                  <span className="text-slate-500">暫停接案</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Service areas */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="text-base font-bold text-slate-800 mb-1">服務縣市</h2>
          <p className="text-xs text-slate-500 mb-4 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />已選擇 {serviceAreas.length} 個縣市，案件列表依此優先排序
          </p>
          <div className="flex flex-wrap gap-2">
            {TAIWAN_CITIES.map(city => {
              const selected = serviceAreas.includes(city);
              return (
                <button
                  key={city}
                  onClick={() => toggleArea(city)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    selected
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white text-slate-700 border-slate-200 hover:border-orange-300"
                  }`}
                >
                  {city}
                </button>
              );
            })}
          </div>
        </div>

        {/* Save */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
        )}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="h-12 text-base font-semibold rounded-xl"
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />儲存中…</>
          ) : saved ? (
            <><Check className="w-4 h-4 mr-2" />已儲存</>
          ) : "儲存變更"}
        </Button>

        {/* Danger zone */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="text-base font-bold text-slate-800 mb-3">其他操作</h2>
          <div className="flex gap-3 flex-wrap">
            <Button asChild variant="outline" size="sm" className="text-sm rounded-lg">
              <a href="/dashboard">回工作台</a>
            </Button>
            <Button asChild variant="outline" size="sm" className="text-sm rounded-lg">
              <a href="/jobs">瀏覽案件</a>
            </Button>
          </div>
        </div>

      </div>
      <BottomNav />
    </div>
  );
}
