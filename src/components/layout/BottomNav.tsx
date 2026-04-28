"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlusCircle, LayoutDashboard, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/",          icon: Home,            label: "首頁" },
  { href: "/jobs",      icon: Search,          label: "找遊俠" },
  { href: "/post-job",  icon: PlusCircle,      label: "發案",  highlight: true },
  { href: "/dashboard", icon: LayoutDashboard, label: "我的案件" },
  { href: "/profile",   icon: User,            label: "個人" },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 md:hidden">
      <div className="flex items-center justify-around h-16">
        {items.map(({ href, icon: Icon, label, highlight }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 text-[10px] px-3",
                highlight
                  ? "text-brand-600"
                  : active
                  ? "text-brand-500"
                  : "text-gray-400"
              )}
            >
              <Icon className={cn("w-5 h-5", highlight && "text-brand-500")} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
