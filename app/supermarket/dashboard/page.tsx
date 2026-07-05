"use client";

import { useState, useEffect, Suspense } from "react";
import { getUserSession } from "@/app/actions/auth";
import SupermarketNavbar from "@/components/SupermarketNavbar";
import Header from "@/components/Header";
import Link from "next/link";
import {
  ShoppingCart, Calculator, ArrowRight, TrendingUp, ShoppingBag, BarChart2, Receipt,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  category: string;
}

function SupermarketDashboardContent() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const session = await getUserSession();
        setUser(session as User | null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-32 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#023E4A] mx-auto mb-4" />
          <p className="text-gray-500">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">
          Please{" "}
          <Link href="/login" className="text-[#023E4A] underline">
            log in
          </Link>{" "}
          to access this dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <SupermarketNavbar />

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#023E4A] to-[#0097A7] text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative max-w-7xl mx-auto px-4 pt-20 pb-8 sm:px-6 sm:pt-24 sm:pb-10 lg:px-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 ring-1 ring-white/25 rounded-xl flex items-center justify-center shrink-0">
              <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-white/70 text-xs sm:text-sm font-medium uppercase tracking-wide">
                Supermarket Dashboard
              </p>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">Welcome, {user.name}!</h1>
              <p className="mt-0.5 text-sm text-white/80 hidden sm:block">
                Manage your supermarket stock, pricing and product listings
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Management Tools ──────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="text-lg font-bold text-gray-800 mb-2">Supermarket Management Tools</h2>
        <p className="text-sm text-gray-500 mb-6">
          Price finished products in the calculator — they are saved into Stock Records (Finished Products), where you can publish them to the marketplace.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* Stock Records */}
          <Link
            href="/supermarket/stock-records"
            className="group bg-gray-50 rounded-2xl border border-gray-200 p-6 flex items-center gap-4 hover:bg-gray-100 hover:border-gray-300 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-base">Stock Records</h3>
              <span className="inline-flex items-center gap-1 mt-1 text-gray-600 text-sm font-medium group-hover:gap-2 transition-all">
                Open records <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>

          {/* Finished Product Calculator */}
          <Link
            href="/supermarket/finished-product-calculator"
            className="group bg-gray-50 rounded-2xl border border-gray-200 p-6 flex items-center gap-4 hover:bg-gray-100 hover:border-gray-300 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0">
              <Calculator className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-base">Finished Products Price Calculator</h3>
              <span className="inline-flex items-center gap-1 mt-1 text-gray-600 text-sm font-medium group-hover:gap-2 transition-all">
                Calculate &amp; save to stock <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>

          {/* Customer Orders */}
          <Link
            href="/supermarket/orders"
            className="group bg-gray-50 rounded-2xl border border-gray-200 p-6 flex items-center gap-4 hover:bg-gray-100 hover:border-gray-300 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-base">Customer Orders</h3>
              <span className="inline-flex items-center gap-1 mt-1 text-gray-600 text-sm font-medium group-hover:gap-2 transition-all">
                View orders <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>

          {/* Sales Analytics */}
          <Link
            href="/supermarket/analytics"
            className="group bg-gray-50 rounded-2xl border border-gray-200 p-6 flex items-center gap-4 hover:bg-gray-100 hover:border-gray-300 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0">
              <BarChart2 className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-base">Sales Analytics</h3>
              <span className="inline-flex items-center gap-1 mt-1 text-gray-600 text-sm font-medium group-hover:gap-2 transition-all">
                View analytics <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>

          {/* Transaction Records */}
          <Link
            href="/supermarket/transactions"
            className="group bg-gray-50 rounded-2xl border border-gray-200 p-6 flex items-center gap-4 hover:bg-gray-100 hover:border-gray-300 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0">
              <Receipt className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-base">Transaction Records</h3>
              <span className="inline-flex items-center gap-1 mt-1 text-gray-600 text-sm font-medium group-hover:gap-2 transition-all">
                Record transaction <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>

        </div>
      </div>
    </div>
  );
}

export default function SupermarketDashboard() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#023E4A] border-t-transparent" />
      </div>
    }>
      <SupermarketDashboardContent />
    </Suspense>
  );
}
