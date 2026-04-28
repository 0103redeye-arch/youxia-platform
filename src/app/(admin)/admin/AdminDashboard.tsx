"use client";
import { useState } from "react";

type KycProfile = {
  id: string;
  realName: string | null;
  nationalIdLast4: string | null;
  idVerifyStatus: string;
  createdAt: string;
  user: { name: string | null; phone: string | null; createdAt: string };
};

type Hall = {
  id: string;
  companyName: string;
  businessRegNo: string;
  city: string;
  representativeName: string;
  verifyStatus: string;
  createdAt: string;
  owner: { name: string | null; phone: string | null };
};

type DisputedOrder = {
  id: string; status: string; totalAmount: number; createdAt: string;
  job: { title: string };
};

type Stats = { users: number; masters: number; jobs: number; orders: number; revenue: number };

export default function AdminDashboard({
  pendingKyc, pendingHalls, disputedOrders, stats,
}: {
  pendingKyc: KycProfile[];
  pendingHalls: Hall[];
  disputedOrders: DisputedOrder[];
  stats: Stats;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "kyc" | "halls" | "disputes">("overview");

  async function reviewKyc(id: string, action: "APPROVE" | "REJECT", note?: string) {
    const res = await fetch("/api/admin/kyc", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ masterProfileId: id, action, note }),
    });
    if (res.ok) window.location.reload();
    else alert("操作失敗");
  }

  async function reviewHall(id: string, action: "APPROVE" | "REJECT", note?: string) {
    const res = await fetch("/api/admin/halls", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hallId: id, action, note }),
    });
    if (res.ok) window.location.reload();
    else alert("操作失敗");
  }

  const TABS = [
    { key: "overview", label: "📊 概覽" },
    { key: "kyc",      label: `👤 KYC 待審 (${pendingKyc.length})` },
    { key: "halls",    label: `⛩️ 盟會待審 (${pendingHalls.length})` },
    { key: "disputes", label: `⚠️ 申訴 (${disputedOrders.length})` },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-orange-600 text-white px-6 py-4 flex items-center gap-3">
        <span className="text-2xl">⚔️</span>
        <div>
          <h1 className="text-xl font-bold">俠客行不行 · 後台管理</h1>
          <p className="text-orange-200 text-sm">Admin Dashboard</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-6">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === t.key
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-6 max-w-5xl mx-auto">

        {/* ── 概覽 ── */}
        {activeTab === "overview" && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4">平台數據</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: "總用戶", value: stats.users, icon: "👤" },
                { label: "遊俠", value: stats.masters, icon: "🗡️" },
                { label: "進行中案件", value: stats.jobs, icon: "📋" },
                { label: "完成訂單", value: stats.orders, icon: "✅" },
                { label: "平台收益", value: `NT$${stats.revenue.toLocaleString()}`, icon: "💰" },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {(pendingKyc.length > 0 || pendingHalls.length > 0 || disputedOrders.length > 0) && (
              <div className="mt-6 space-y-3">
                <h3 className="font-semibold text-gray-700">⚡ 待處理事項</h3>
                {pendingKyc.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex justify-between items-center">
                    <span className="text-amber-800 font-medium">👤 {pendingKyc.length} 筆 KYC 待審核</span>
                    <button onClick={() => setActiveTab("kyc")} className="text-orange-600 text-sm font-semibold hover:underline">前往審核 →</button>
                  </div>
                )}
                {pendingHalls.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex justify-between items-center">
                    <span className="text-blue-800 font-medium">⛩️ {pendingHalls.length} 家盟會待審核</span>
                    <button onClick={() => setActiveTab("halls")} className="text-orange-600 text-sm font-semibold hover:underline">前往審核 →</button>
                  </div>
                )}
                {disputedOrders.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex justify-between items-center">
                    <span className="text-red-800 font-medium">⚠️ {disputedOrders.length} 筆訂單申訴中</span>
                    <button onClick={() => setActiveTab("disputes")} className="text-orange-600 text-sm font-semibold hover:underline">查看 →</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── KYC 審核 ── */}
        {activeTab === "kyc" && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4">遊俠身份驗證 待審 ({pendingKyc.length})</h2>
            {pendingKyc.length === 0 ? (
              <div className="text-center text-gray-400 py-16">✅ 目前沒有待審 KYC</div>
            ) : (
              <div className="space-y-4">
                {pendingKyc.map(p => (
                  <div key={p.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold text-gray-900">{p.realName ?? p.user.name ?? "未填姓名"}</p>
                        <p className="text-sm text-gray-500">📱 {p.user.phone} · 身份證後4碼：{p.nationalIdLast4 ?? "—"}</p>
                        <p className="text-xs text-gray-400 mt-1">申請時間：{new Date(p.createdAt).toLocaleDateString("zh-TW")}</p>
                      </div>
                      <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">待審核</span>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => {
                          if (confirm(`確定核准 ${p.realName ?? p.user.name} 的身份驗證？`)) {
                            reviewKyc(p.id, "APPROVE");
                          }
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg text-sm transition-colors"
                      >
                        ✅ 核准
                      </button>
                      <button
                        onClick={() => {
                          const note = prompt("拒絕原因（選填）：");
                          if (note !== null) reviewKyc(p.id, "REJECT", note);
                        }}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-lg text-sm transition-colors"
                      >
                        ❌ 拒絕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 盟會審核 ── */}
        {activeTab === "halls" && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4">盟會申請 待審 ({pendingHalls.length})</h2>
            {pendingHalls.length === 0 ? (
              <div className="text-center text-gray-400 py-16">✅ 目前沒有待審盟會</div>
            ) : (
              <div className="space-y-4">
                {pendingHalls.map(h => (
                  <div key={h.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-gray-900">{h.companyName}</p>
                        <p className="text-sm text-gray-500">統編：{h.businessRegNo} · {h.city}</p>
                        <p className="text-sm text-gray-500">負責人：{h.representativeName} · 聯絡人：{h.owner.name} ({h.owner.phone})</p>
                        <p className="text-xs text-gray-400 mt-1">申請時間：{new Date(h.createdAt).toLocaleDateString("zh-TW")}</p>
                      </div>
                      <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">待審核</span>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => {
                          if (confirm(`確定核准「${h.companyName}」的盟會申請？`)) {
                            reviewHall(h.id, "APPROVE");
                          }
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg text-sm transition-colors"
                      >
                        ✅ 核准
                      </button>
                      <button
                        onClick={() => {
                          const note = prompt("拒絕原因（選填）：");
                          if (note !== null) reviewHall(h.id, "REJECT", note);
                        }}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-lg text-sm transition-colors"
                      >
                        ❌ 拒絕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 申訴訂單 ── */}
        {activeTab === "disputes" && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4">申訴中訂單 ({disputedOrders.length})</h2>
            {disputedOrders.length === 0 ? (
              <div className="text-center text-gray-400 py-16">✅ 目前沒有申訴案件</div>
            ) : (
              <div className="space-y-4">
                {disputedOrders.map(o => (
                  <div key={o.id} className="bg-white rounded-xl p-5 shadow-sm border border-red-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-900">{o.job.title}</p>
                        <p className="text-sm text-gray-500">金額：NT${o.totalAmount.toLocaleString()} · 申訴時間：{new Date(o.createdAt).toLocaleDateString("zh-TW")}</p>
                      </div>
                      <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full">申訴中</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">訂單 ID：{o.id}</p>
                    <p className="text-sm text-gray-600 mt-2">⚠️ 請聯絡客戶與師傅雙方了解情況，必要時手動更新訂單狀態。</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
