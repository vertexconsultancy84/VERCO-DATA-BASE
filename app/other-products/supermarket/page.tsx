"use client";

import { useState, useEffect } from "react";
import { getAllPublishedProducts } from "@/app/actions/product";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SimpleEnhancedProductCard from "@/components/SimpleEnhancedProductCard";
import ShoppingCartComponent from "@/components/ShoppingCart";
import { ShoppingCart, Package, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SupermarketBrowsePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const all = await getAllPublishedProducts();
        setProducts(all.filter((p: any) => p.category === "OtherProducts" && p.subcategory === "supermarket"));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-cyan-50/30">
      <Header />
      <ShoppingCartComponent />

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#023E4A] to-[#0097A7] text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Supermarket</h1>
          <p className="mt-4 text-xl text-white/80 max-w-2xl mx-auto">
            Fresh products, groceries and everyday essentials
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/other-products" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Other Products
        </Link>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading products…</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Supermarket Products Yet</h3>
            <p className="text-gray-500 mb-6">Be the first to add products to this category!</p>
            <Link href="/user/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0097A7] text-white rounded-xl font-semibold hover:bg-[#023E4A] transition-colors">
              Upload Product
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">All Supermarket Products</h2>
              <span className="text-sm text-gray-500 bg-white border border-gray-200 px-3 py-1 rounded-full">{products.length} products</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product: any) => (
                <SimpleEnhancedProductCard key={product.id} product={product} currentUser={null} showAddToCart={true} />
              ))}
            </div>
          </>
        )}
      </div>

      <Footer />
    </main>
  );
}
