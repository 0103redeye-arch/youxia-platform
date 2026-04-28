"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sword, Bell, Menu } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-brand-600 text-lg">
          <Sword className="w-5 h-5" />
          俠客行不行
        </Link>

        {/* 桌機選單 */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
          <Link href="/jobs" className="hover:text-brand-600">找遊俠</Link>
          <Link href="/post-job" className="hover:text-brand-600">發案</Link>
          <Link href="/dashboard" className="hover:text-brand-600">我的</Link>
        </nav>

        {/* 右側按鈕 */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="hidden md:inline-flex">
            <Bell className="w-4 h-4" />
          </Button>
          <Button asChild size="sm" className="hidden md:inline-flex">
            <Link href="/post-job">立即發案</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
            <Link href="/login">登入</Link>
          </Button>
          {/* 手機漢堡 */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
