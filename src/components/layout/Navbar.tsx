"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sword } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/jobs",      label: "找遊俠" },
  { href: "/post-job",  label: "發案" },
  { href: "/dashboard", label: "我的" },
];

export default function Navbar() {
  const pathname = usePathname();

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
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* 右側 CTA */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/login"
            className="hidden md:block text-sm font-medium text-slate-500 hover:text-slate-900 px-3 py-1.5 transition-colors"
          >
            登入
          </Link>
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
