"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Boxes, Settings, RefreshCw, Sparkles, Check,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/industry/stock-management", label: "Finished Products Records", icon: Boxes },
  { href: "/industry/stock-management/settings", label: "Settings", icon: Settings },
] as const;

export default function IndustrySidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-[#023E4A] text-white sticky top-0 h-screen overflow-y-auto border-r border-[#D4A017]/20">
      {/* clears the absolute global Header */}
      <div className="pt-24 px-4 pb-4 flex-1 flex flex-col">
        {/* Brand */}
        <div className="flex items-center gap-2 px-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-[#D4A017]/20 flex items-center justify-center">
            <Boxes className="w-4 h-4 text-[#D4A017]" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-wide">Vertex</p>
            <p className="text-[10px] text-cyan-200/70 uppercase tracking-widest">Industry</p>
          </div>
        </div>

        {/* Refresh bar */}
        <button
          onClick={() => window.location.reload()}
          className="flex items-center justify-center gap-2 mb-4 px-3 py-2.5 rounded-lg text-sm font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4 shrink-0" /> Refresh
        </button>

        {/* Nav */}
        <nav className="space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-white/10 text-white border-l-2 border-[#D4A017]"
                    : "text-cyan-100/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? "text-[#D4A017]" : ""}`} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Pro promo card */}
        <div className="mt-auto pt-6">
          <div className="rounded-xl bg-gradient-to-br from-[#024d5c] to-[#0097A7] p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-[#D4A017]" />
              <p className="text-sm font-bold">Vertex Pro</p>
            </div>
            <p className="text-[11px] text-cyan-100/80 mb-3">Advanced feature access</p>
            <ul className="space-y-1.5 mb-3">
              {["Cross-platform sync", "Advanced analytics", "Content listings"].map((t) => (
                <li key={t} className="flex items-center gap-1.5 text-[11px] text-cyan-50/90">
                  <Check className="w-3 h-3 text-[#D4A017] shrink-0" /> {t}
                </li>
              ))}
            </ul>
            <button className="w-full bg-[#D4A017] hover:bg-[#b8890f] text-[#023E4A] text-xs font-bold py-2 rounded-lg transition-colors">
              Premium upgrade
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
