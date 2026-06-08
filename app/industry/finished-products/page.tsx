"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Home, BoxesIcon, Layers } from "lucide-react";
import Link from "next/link";
import { getAllPublishedProducts } from "@/app/actions/product";
import SimpleEnhancedProductCard from "@/components/SimpleEnhancedProductCard";
import Header from "@/components/Header";
import IndustryNavbar from "@/components/IndustryNavbar";
import ShoppingCartComponent from "@/components/ShoppingCart";

export default function FinishedProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading finished products...</p>
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
              <BoxesIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Finished Products
          </h1>
          <p className="mt-6 text-xl text-teal-100 max-w-3xl mx-auto">
            Manufactured and finished industrial goods ready for sale
          </p>
        </div>
      </div>

      {/* Back button */}
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          <Home className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <BoxesIcon className="h-12 w-12 text-teal-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900">{products.length}</h3>
            <p className="text-gray-600">Finished Products</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Star className="h-12 w-12 text-teal-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900">4.8</h3>
            <p className="text-gray-600">Average Rating</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <MapPin className="h-12 w-12 text-teal-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900">Multiple</h3>
            <p className="text-gray-600">Locations</p>
          </div>
        </div>
      </div>

      {/* Products grid */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <BoxesIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Finished Products Yet</h3>
            <p className="text-gray-600">Be the first to list finished goods on our marketplace!</p>
            <Link href="/user/dashboard">
              <Button className="mt-4 bg-[#023E4A] hover:bg-[#012830]">Add Finished Products</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <SimpleEnhancedProductCard
                key={product.id}
                product={product}
                showAddToCart={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sibling category link */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Also in Industry</h3>
          <Link
            href="/industry/raw-materials"
            className="inline-flex items-center px-6 py-3 border border-[#06B6D4] text-[#023E4A] rounded-lg hover:bg-cyan-50 transition-colors"
          >
            <Layers className="h-5 w-5 mr-2" />
            Browse Raw Materials
          </Link>
        </div>
      </div>

      <ShoppingCartComponent />
    </div>
  );
}
