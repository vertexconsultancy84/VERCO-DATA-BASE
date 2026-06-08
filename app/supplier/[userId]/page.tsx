"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSupplierWithProducts } from "@/app/actions/supplier";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShoppingCartComponent from "@/components/ShoppingCart";
import SimpleEnhancedProductCard from "@/components/SimpleEnhancedProductCard";
import Link from "next/link";
import { MapPin, ArrowLeft, Package, Star, Users } from "lucide-react";

export default function SupplierPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const [supplier, setSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    getSupplierWithProducts(userId).then((data) => {
      setSupplier(data);
      setLoading(false);
    });
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-32 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#023E4A] mx-auto mb-4" />
          <p className="text-gray-500">Loading supplier…</p>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-32 text-center">
          <p className="text-gray-600 text-lg">Supplier not found.</p>
          <button
            onClick={() => router.back()}
            className="mt-4 inline-flex items-center gap-2 text-[#023E4A] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Go back
          </button>
        </div>
      </div>
    );
  }

  const locationParts = [supplier.province, supplier.district, supplier.sector, supplier.zone].filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-cyan-50/30">
      <Header />
      <ShoppingCartComponent />

      {/* Hero — matches category listing pages */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#023E4A] to-[#0097A7] text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative max-w-7xl mx-auto px-4 pt-32 pb-16 sm:px-6 lg:px-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 text-2xl font-bold">
              {supplier.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white/70 text-sm font-medium uppercase tracking-wide">Supplier</p>
              <h1 className="text-3xl font-bold">{supplier.name}</h1>
              {locationParts.length > 0 && (
                <p className="flex items-center gap-1.5 mt-1 text-white/75 text-sm">
                  <MapPin className="w-4 h-4 shrink-0" />
                  {locationParts.join(" · ")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Package className="h-12 w-12 text-[#023E4A] mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900">{supplier.products.length}</h3>
            <p className="text-gray-600">Total Listings</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Star className="h-12 w-12 text-[#023E4A] mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900">4.8</h3>
            <p className="text-gray-600">Average Rating</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Users className="h-12 w-12 text-[#023E4A] mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900">Verified</h3>
            <p className="text-gray-600">Supplier</p>
          </div>
        </div>
      </div>

      {/* Products grid */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {supplier.products.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Yet</h3>
            <p className="text-gray-500">This supplier hasn't listed any products yet.</p>
            <Link
              href="/view-products"
              className="mt-6 inline-flex items-center px-6 py-3 bg-[#023E4A] text-white rounded-xl hover:bg-[#012d36] transition-colors"
            >
              Browse all products
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              All listings by <span className="text-[#023E4A]">{supplier.name}</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {supplier.products.map((product: any) => (
                <SimpleEnhancedProductCard
                  key={product.id}
                  product={product}
                  currentUser={null}
                  showAddToCart={true}
                  isAdmin={false}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
