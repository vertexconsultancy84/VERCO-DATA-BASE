"use client";

import SupermarketNavbar from "@/components/SupermarketNavbar";
import Header from "@/components/Header";
import Link from "next/link";
import { BarChart2, ArrowLeft, ArrowRight } from "lucide-react";

export default function SupermarketAnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <SupermarketNavbar />

      <div className="relative overflow-hidden bg-gradient-to-r from-[#023E4A] to-[#0097A7] text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative max-w-7xl mx-auto px-4 pt-28 pb-16 sm:px-6 lg:px-8">
          <Link href="/supermarket/dashboard" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <BarChart2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-white/70 text-sm font-medium uppercase tracking-wide">Supermarket Management</p>
              <h1 className="text-3xl font-bold">Sales Analytics</h1>
              <p className="mt-1 text-white/80">Track monthly sales, revenue, profit and losses per product</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 flex flex-col items-center text-center gap-6">
        <div className="w-20 h-20 bg-cyan-100 rounded-full flex items-center justify-center">
          <BarChart2 className="w-10 h-10 text-[#0097A7]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Open Sales Analytics</h2>
          <p className="text-gray-500 max-w-md">
            Your sales analytics show all orders for your products regardless of category.
            Click below to open the full analytics dashboard.
          </p>
        </div>
        <Link
          href="/industry/analytics"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#0097A7] text-white font-semibold rounded-xl hover:bg-[#023E4A] transition-colors"
        >
          Open Analytics <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
