"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import { timeAgo } from "@/lib/utils";
import { Bell, BellOff, CheckCheck, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: string;
  isRead: boolean;
  createdAt: string;
}

const TYPE_ICON: Record<string, string> = {
  NEW_QUOTE:       "💬",
  QUOTE_ACCEPTED:  "✅",
  ORDER_PAID:      "💳",
  ORDER_STARTED:   "🔧",
  ORDER_COMPLETED: "🎉",
  NEW_REVIEW:      "⭐",
  KYC_APPROVED:    "🛡️",
  KYC_REJECTED:    "❌",
  SYSTEM:          "📢",
};

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/my/notifications")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => { setItems(data); setLoading(false); })
      .catch(() => { router.push("/login"); });
  }, [router]);

  async function markAllRead() {
    await fetch("/api/my/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    setItems(prev => prev.map(n => ({ ...n, isRead: true })));
  }

  async function markRead(id: string) {
    await fetch("/api/my/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [id] }) });
    setItems(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }

  function getLinkFromData(data?: string): string | null {
    try {
      if (!data) return null;
      const d = JSON.parse(data);
      if (d.orderId) return `/order/${d.orderId}`;
      if (d.jobId)   return `/jobs/${d.jobId}`;
    } catch { /* */ }
    return null;
  }

  const unread = items.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen pb-24 md:pb-0 bg-[#f8f9fa]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-5 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">通知</h1>
            {unread > 0 && (
              <span className="text-sm font-bold bg-orange-500 text-white rounded-full px-2.5 py-0.5">
                {unread}
              </span>
            )}
          </div>
          {unread > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead}
              className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1.5">
              <CheckCheck className="w-4 h-4" />全部已讀
            </Button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
                <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && items.length === 0 && (
          <div className="text-center py-20">
            <BellOff className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-base">目前沒有通知</p>
          </div>
        )}

        {/* Notifications list */}
        {!loading && items.length > 0 && (
          <div className="flex flex-col gap-2">
            {items.map(n => {
              const link = getLinkFromData(n.data);
              const icon = TYPE_ICON[n.type] ?? "🔔";
              const inner = (
                <div
                  onClick={() => { if (!n.isRead) markRead(n.id); }}
                  className={`bg-white rounded-2xl border transition-all cursor-pointer p-5 flex items-start gap-4 ${
                    n.isRead
                      ? "border-slate-100 opacity-70 hover:opacity-100"
                      : "border-orange-200 shadow-sm hover:border-orange-300"
                  }`}
                >
                  {/* Unread dot */}
                  <div className="relative shrink-0 mt-0.5">
                    <span className="text-2xl">{icon}</span>
                    {!n.isRead && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-base leading-snug mb-1 ${n.isRead ? "font-medium text-slate-700" : "font-bold text-slate-900"}`}>
                      {n.title}
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-2">{n.body}</p>
                    <p className="text-xs text-slate-400">{timeAgo(n.createdAt)}</p>
                  </div>
                  {link && <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />}
                </div>
              );

              if (link) {
                return <Link key={n.id} href={link}>{inner}</Link>;
              }
              return <div key={n.id}>{inner}</div>;
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
