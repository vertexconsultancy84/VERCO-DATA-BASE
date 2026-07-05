"use client";

import SupermarketNavbar from "@/components/SupermarketNavbar";
import Header from "@/components/Header";
import ServiceTransactions from "@/components/ServiceTransactions";
import Link from "next/link";
import { Receipt, ArrowLeft } from "lucide-react";

export default function SupermarketTransactionsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <SupermarketNavbar />

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#023E4A] to-[#0097A7] text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative max-w-7xl mx-auto px-4 pt-28 pb-16 sm:px-6 lg:px-8">
          <Link
            href="/supermarket/dashboard"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <Receipt className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-white/70 text-sm font-medium uppercase tracking-wide">Supermarket</p>
              <h1 className="text-3xl font-bold">Transaction Records</h1>
              <p className="mt-1 text-white/80">
                Log service payments made without a receipt
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <p className="text-sm text-gray-500 mb-6">
            Log service payments made without a receipt — record the giver (company),
            the receiver's details and the amount paid.
          </p>
          <ServiceTransactions />
        </div>
      </div>
    </div>
  );
}
