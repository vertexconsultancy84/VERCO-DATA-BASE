"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { searchAllSuppliers, type SupplierInfo } from "@/app/actions/supplier";
import { Search, MapPin, X, ArrowRight, User, Loader2, ExternalLink } from "lucide-react";

interface SupplierSearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  subcategory: string;
  categoryLabel: string;
  browseHref: string;
  accentColor?: string;
}

export default function SupplierSearchPanel({
  isOpen,
  onClose,
  category,
  subcategory,
  categoryLabel,
  browseHref,
  accentColor = "orange",
}: SupplierSearchPanelProps) {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<SupplierInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setShowDropdown(false);
      setSuppliers([]);
      return;
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  // Debounced search — filtered to the current category/subcategory
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setSuppliers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      const data = await searchAllSuppliers(q, category, subcategory);
      setSuppliers(data);
      setLoading(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [query, category, subcategory]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close modal on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Results come directly from server search — no extra client-side filtering needed
  const filtered = suppliers;

  if (!isOpen) return null;

  const accent = {
    orange: { ring: "focus:ring-[#D4A017]", btn: "bg-[#023E4A] hover:bg-[#012d36]", tag: "bg-cyan-50 text-[#023E4A]" },
    blue:   { ring: "focus:ring-[#D4A017]", btn: "bg-[#023E4A] hover:bg-[#012d36]", tag: "bg-cyan-50 text-[#023E4A]" },
    slate:  { ring: "focus:ring-[#D4A017]", btn: "bg-[#023E4A] hover:bg-[#012d36]", tag: "bg-cyan-50 text-[#023E4A]" },
    emerald: { ring: "focus:ring-[#D4A017]", btn: "bg-[#023E4A] hover:bg-[#012d36]", tag: "bg-cyan-50 text-[#023E4A]" },
  }[accentColor] ?? { ring: "focus:ring-[#D4A017]", btn: "bg-[#023E4A] hover:bg-[#012d36]", tag: "bg-cyan-50 text-[#023E4A]" };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/50 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200"
        ref={panelRef}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Find Suppliers</p>
            <h2 className="text-base font-bold text-gray-900">{categoryLabel}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input */}
        <div className="px-5 pt-4 pb-2 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search by province, district, sector or supplier name…"
              className={`w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 ${accent.ring} focus:border-transparent transition-shadow`}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Supplier list */}
        <div className="px-5 pb-3 max-h-72 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading suppliers…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <User className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">
                {query.trim()
                  ? `No ${categoryLabel} suppliers found in "${query}"`
                  : `Type a province, district or sector to find ${categoryLabel} suppliers near you.`}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {filtered.map((supplier) => {
                const locationParts = [supplier.province, supplier.district, supplier.sector, supplier.zone].filter(Boolean);
                return (
                  <li key={supplier.id}>
                    <button
                      onClick={() => {
                        onClose();
                        router.push(`/supplier/${supplier.id}`);
                      }}
                      className="w-full flex items-center gap-3 py-3 text-left hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors group"
                    >
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-sm font-bold text-gray-600 group-hover:bg-gray-200 transition-colors">
                        {supplier.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{supplier.name}</p>
                        {locationParts.length > 0 && (
                          <p className="flex items-center gap-1 text-xs text-gray-500 mt-0.5 truncate">
                            <MapPin className="w-3 h-3 shrink-0" />
                            {locationParts.join(" · ")}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0 transition-colors" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
          <span className="text-xs text-gray-400">
            {!loading && query.trim() && `${filtered.length} supplier${filtered.length !== 1 ? "s" : ""} found`}
          </span>
          <a
            href={browseHref}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Browse all listings <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
