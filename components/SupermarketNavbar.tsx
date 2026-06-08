"use client";

import { ShoppingCart } from "lucide-react";

export default function SupermarketNavbar() {
  return (
    <div className="sticky top-0 z-40 bg-[#023E4A] text-white shadow-md border-b border-[#D4A017]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-12 gap-3">
          <ShoppingCart className="w-4 h-4 text-[#D4A017]" />
          <span className="text-sm font-bold tracking-widest text-white uppercase">Supermarket</span>
          <span className="ml-1 text-[10px] font-semibold text-[#D4A017] tracking-widest uppercase border-l border-[#D4A017]/40 pl-2">
            Vertex Consulting
          </span>
        </div>
      </div>
    </div>
  );
}
