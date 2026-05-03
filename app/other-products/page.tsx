"use client";

import { useState, useEffect } from "react";
import { getAllPublishedProducts } from "@/app/actions/product";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SimpleEnhancedProductCard from "@/components/SimpleEnhancedProductCard";
import ShoppingCartComponent from "@/components/ShoppingCart";
import { Package, Star, Users, Home, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function OtherProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const handleProductUpdate = () => {
      fetchProducts();
    };

    window.addEventListener('productUpdated', handleProductUpdate);
    window.addEventListener('productDeleted', handleProductUpdate);

    return () => {
      window.removeEventListener('productUpdated', handleProductUpdate);
      window.removeEventListener('productDeleted', handleProductUpdate);
    };
  }, []);

  const fetchProducts = async () => {
    try {
      const fetchedProducts = await getAllPublishedProducts();
      const otherProducts = fetchedProducts.filter(product => product.category === 'OtherProducts');
      setProducts(otherProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30">
      <Header />

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 to-orange-500 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Other Products
            </h1>
            <p className="mt-6 text-xl text-orange-100 max-w-3xl mx-auto">
              Discover unique products and services from our community
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Package className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900">{products.length}</h3>
            <p className="text-gray-600">Total Products</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Star className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900">4.8</h3>
            <p className="text-gray-600">Average Rating</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Users className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900">50+</h3>
            <p className="text-gray-600">Active Users</p>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Other Products
          </h2>
          <p className="text-lg text-gray-600">
            Showing {products.length} products
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Other Products Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Be the first to add a product to this category!
            </p>
            <Link href="/signup">
              <Button className="bg-orange-600 hover:bg-orange-700">
                Get Started
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product: any) => (
              <SimpleEnhancedProductCard
                key={product.id}
                product={product}
                currentUser={null}
                showAddToCart={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              href="/view-products"
              className="flex items-center justify-center px-6 py-3 border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
            >
              <Package className="h-5 w-5 mr-2" />
              Browse All Products
            </Link>
            <Link 
              href="/user/dashboard"
              className="flex items-center justify-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Users className="h-5 w-5 mr-2" />
              Upload Product
            </Link>
            <Link 
              href="/"
              className="flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Home className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
