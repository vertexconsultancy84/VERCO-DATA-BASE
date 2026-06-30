"use client";

import Header from "@/components/Header";
import IndustrySidebar from "@/components/IndustrySidebar";
import StockInventoryDashboard from "@/components/StockInventoryDashboard";
import Link from "next/link";
import { Boxes, ArrowLeft } from "lucide-react";

export default function StockManagementPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="flex">
        <IndustrySidebar />

        <main className="flex-1 min-w-0">
          {/* Hero */}
          <div className="relative overflow-hidden bg-gradient-to-r from-[#023E4A] to-[#0097A7] text-white">
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative px-4 pt-28 pb-14 sm:px-6 lg:px-8">
              <Link
                href="/industry/dashboard"
                className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </Link>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                  <Boxes className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-white/70 text-sm font-medium uppercase tracking-wide">
                    Finished Products Overview
                  </p>
                  <h1 className="text-3xl font-bold">Finished Products Records</h1>
                  <p className="mt-1 text-white/80">
                    Monitor stock levels, alerts, reservations and inventory value at a glance
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-8 sm:px-6 lg:px-8">
            <StockInventoryDashboard />
          </div>
        </main>
      </div>
    </div>
  );
}
