"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Plus, LayoutDashboard, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/",          icon: Home,            label: "首頁" },
  { href: "/jobs",      icon: Search,          label: "找遊俠" },
  { href: "/post-job",  icon: Plus,            label: "發案",  cta: true },
  { href: "/dashboard", icon: LayoutDashboard, label: "工作台" },
  { href: "/become-master", icon: User,        label: "遊俠" },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-slate-100 safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map(({ href, icon: Icon, label, cta }) => {
          const active = pathname === href;
          if (cta) {
            return (
              <Link key={href} href={href} className="flex flex-col items-center gap-0.5 -mt-4">
                <span className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-200">
                  <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                </span>
                <span className="text-xs font-semibold text-orange-500 mt-0.5">{label}</span>
              </Link>
            );
          }
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors",
                active ? "text-orange-500" : "text-slate-500 hover:text-slate-800"
              )}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.75} />
              <span className={cn("text-xs", active ? "font-bold" : "font-medium")}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
