"use client";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Home, BoxesIcon, Factory, ArrowLeft, Search, Package } from "lucide-react";
import Link from "next/link";
import { getAllPublishedProducts } from "@/app/actions/product";
import SimpleEnhancedProductCard from "@/components/SimpleEnhancedProductCard";
import Header from "@/components/Header";
import IndustryNavbar from "@/components/IndustryNavbar";
import ShoppingCartComponent from "@/components/ShoppingCart";

interface Industry {
  id: string;
  name: string;
  location: string;
  products: any[];
}

export default function FinishedProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndustryId, setSelectedIndustryId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const allProducts = await getAllPublishedProducts();
      const filtered = allProducts.filter(
        (p) => p.category === "Industry" && p.subcategory === "finished-products"
      );
      setProducts(filtered);
    } catch (error) {
      console.error("Error fetching finished products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Group the finished products by the industry (owner) that sells them
  const industries = useMemo<Industry[]>(() => {
    const map = new Map<string, Industry>();
    for (const p of products) {
      const u = p.user;
      if (!u?.id) continue;
      if (!map.has(u.id)) {
        const location = [p.district, p.province].filter(Boolean).join(", ");
        map.set(u.id, { id: u.id, name: u.name || "Unnamed Industry", location, products: [] });
      }
      map.get(u.id)!.products.push(p);
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const filteredIndustries = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return industries;
    return industries.filter(
      (i) => i.name.toLowerCase().includes(q) || i.location.toLowerCase().includes(q)
    );
  }, [industries, query]);

  const selectedIndustry = industries.find((i) => i.id === selectedIndustryId) ?? null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading industries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <IndustryNavbar />

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#023E4A] to-[#0097A7] text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 pt-32 pb-20 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              {selectedIndustry ? <BoxesIcon className="w-8 h-8 text-white" /> : <Factory className="w-8 h-8 text-white" />}
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {selectedIndustry ? selectedIndustry.name : "Finished Products"}
          </h1>
          <p className="mt-6 text-xl text-teal-100 max-w-3xl mx-auto">
            {selectedIndustry
              ? "Browse all products this industry is selling"
              : "Choose an industry to see the products they sell"}
          </p>
        </div>
      </div>

      {/* Nav buttons */}
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-wrap gap-3">
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          <Home className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        {selectedIndustry && (
          <button
            onClick={() => setSelectedIndustryId(null)}
            className="inline-flex items-center px-4 py-2 border border-[#06B6D4] text-[#023E4A] hover:bg-cyan-50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            All Industries
          </button>
        )}
      </div>

      {/* ── Industries list ─────────────────────────────────────────────── */}
      {!selectedIndustry ? (
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Search */}
          <div className="relative max-w-md mx-auto mb-10">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search industries by name or location..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          {filteredIndustries.length === 0 ? (
            <div className="text-center py-12">
              <Factory className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {industries.length === 0 ? "No Industries Yet" : "No industries match your search"}
              </h3>
              <p className="text-gray-600">
                {industries.length === 0
                  ? "No industries have listed finished products yet."
                  : "Try a different name or location."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredIndustries.map((industry) => (
                <button
                  key={industry.id}
                  onClick={() => setSelectedIndustryId(industry.id)}
                  className="group text-left bg-white rounded-xl border-2 border-gray-200 p-6 hover:shadow-lg hover:border-teal-400 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 shrink-0 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Factory className="w-7 h-7" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 truncate" title={industry.name}>
                        {industry.name}
                      </h3>
                      {industry.location && (
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0" /> {industry.location}
                        </p>
                      )}
                      <span className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-teal-700 bg-teal-50 px-2 py-1 rounded-full">
                        <Package className="w-3.5 h-3.5" />
                        {industry.products.length} product{industry.products.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ── Selected industry's products ──────────────────────────────── */
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {selectedIndustry.products.length === 0 ? (
            <div className="text-center py-12">
              <BoxesIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Yet</h3>
              <p className="text-gray-600">This industry has not listed any finished products yet.</p>
              <Button onClick={() => setSelectedIndustryId(null)} className="mt-4 bg-[#023E4A] hover:bg-[#012830]">
                Back to Industries
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedIndustry.name}&apos;s Products
                </h2>
                <span className="text-sm text-gray-500">
                  {selectedIndustry.products.length} product{selectedIndustry.products.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {selectedIndustry.products.map((product) => (
                  <SimpleEnhancedProductCard key={product.id} product={product} showAddToCart={true} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <ShoppingCartComponent />
    </div>
  );
}
