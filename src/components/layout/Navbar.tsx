"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Sword, LogOut, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/jobs",      label: "找遊俠" },
  { href: "/post-job",  label: "發案" },
  { href: "/dashboard", label: "我的" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
      <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-slate-900 font-bold text-[15px] tracking-tight shrink-0"
        >
          <span className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center">
            <Sword className="w-4 h-4 text-white" />
          </span>
          俠客行不行
        </Link>

        {/* 桌機選單 */}
        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                pathname === href
                  ? "text-orange-600 bg-orange-50"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* 右側 CTA */}
        <div className="flex items-center gap-2 shrink-0">
          {status === "loading" ? (
            <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse hidden md:block" />
          ) : session?.user ? (
            /* 已登入：顯示頭像 + 下拉選單 */
            <div className="relative hidden md:block">
              <button
                onClick={() => setMenuOpen(v => !v)}
                className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <span className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-sm">
                  {session.user.name?.slice(0, 1) ?? "U"}
                </span>
                <span className="max-w-[80px] truncate">{session.user.name ?? "我"}</span>
              </button>
              {menuOpen && (
                <>
                  {/* 遮罩 */}
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-20">
                    <Link
                      href="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      我的工作台
                    </Link>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      登出
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* 未登入 */
            <Link
              href="/login"
              className="hidden md:block text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-1.5 transition-colors"
            >
              登入
            </Link>
          )}

          <Link
            href="/post-job"
            className="text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            立即發案
          </Link>
        </div>
      </div>
    </header>
  );
}
