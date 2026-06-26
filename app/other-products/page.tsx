"use client";

import { useState, useEffect } from "react";
import { getAllPublishedProducts } from "@/app/actions/product";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SimpleEnhancedProductCard from "@/components/SimpleEnhancedProductCard";
import ShoppingCartComponent from "@/components/ShoppingCart";
import { Package, Star, Users, Home, ArrowRight, Utensils, ShoppingBasket, ChefHat, Truck, Croissant, Coffee, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

// Corner badge showing how many items are uploaded in a sub-category
function CountBadge({ count }: { count: number }) {
  return (
    <span
      className={`absolute top-2 right-2 inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-full text-xs font-bold shadow-sm ${
        count > 0 ? "bg-[#D4A017] text-[#023E4A]" : "bg-gray-100 text-gray-400"
      }`}
    >
      {count}
    </span>
  );
}

// Small line under the label, e.g. "12 items uploaded" / "No items yet"
function CountLabel({ count }: { count: number }) {
  return (
    <p className="mt-1 text-xs font-medium text-gray-500">
      {count === 0 ? "No items yet" : `${count} item${count === 1 ? "" : "s"} uploaded`}
    </p>
  );
}

export default function OtherProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [foodCounts, setFoodCounts] = useState<Record<string, number>>({});
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

      // Count how many foods are uploaded in each Food & Dining sub-category
      const foods = fetchedProducts.filter(product => product.category === 'Food');
      const countBy = (sub: string) => foods.filter(product => product.subcategory === sub).length;
      setFoodCounts({
        restaurant: countBy('restaurant'),
        grocery: countBy('grocery'),
        catering: countBy('catering'),
        'food-delivery': countBy('food-delivery'),
        bakery: countBy('bakery'),
        'other-food': countBy('other-food'),
        supermarket: otherProducts.filter(product => product.subcategory === 'supermarket').length,
      });
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-cyan-50/30">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#023E4A] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-cyan-50/30">
      <Header />

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#023E4A] to-[#0097A7] text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Other Products
            </h1>
            <p className="mt-6 text-xl text-white/80 max-w-3xl mx-auto">
              Discover unique products and services from our community
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Package className="h-12 w-12 text-[#023E4A] mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900">{products.length}</h3>
            <p className="text-gray-600">Total Products</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Star className="h-12 w-12 text-[#023E4A] mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900">4.8</h3>
            <p className="text-gray-600">Average Rating</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Users className="h-12 w-12 text-[#023E4A] mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900">50+</h3>
            <p className="text-gray-600">Active Users</p>
          </div>
        </div>
      </div>

      {/* Sub-categories */}
      <div className="max-w-7xl mx-auto px-4 pt-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Browse by Sub-category</h2>
        <p className="text-gray-600 mb-6">Select a sub-category to explore specific products</p>

        {/* Food & Dining */}
        <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Utensils className="w-5 h-5 text-[#023E4A]" /> Food & Dining
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Link href="/food/restaurant" className="group relative rounded-xl border-2 border-gray-200 bg-white p-5 text-center hover:shadow-lg hover:border-[#D4A017]/50 transition-all duration-300">
            <CountBadge count={foodCounts['restaurant'] ?? 0} />
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Utensils className="w-5 h-5" />
            </div>
            <p className="font-semibold text-gray-900 text-sm">Restaurant</p>
            <CountLabel count={foodCounts['restaurant'] ?? 0} />
          </Link>
          <Link href="/food/grocery" className="group relative rounded-xl border-2 border-gray-200 bg-white p-5 text-center hover:shadow-lg hover:border-[#D4A017]/50 transition-all duration-300">
            <CountBadge count={foodCounts['grocery'] ?? 0} />
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <ShoppingBasket className="w-5 h-5" />
            </div>
            <p className="font-semibold text-gray-900 text-sm">Grocery</p>
            <CountLabel count={foodCounts['grocery'] ?? 0} />
          </Link>
          <Link href="/food/catering" className="group relative rounded-xl border-2 border-gray-200 bg-white p-5 text-center hover:shadow-lg hover:border-[#D4A017]/50 transition-all duration-300">
            <CountBadge count={foodCounts['catering'] ?? 0} />
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <ChefHat className="w-5 h-5" />
            </div>
            <p className="font-semibold text-gray-900 text-sm">Catering</p>
            <CountLabel count={foodCounts['catering'] ?? 0} />
          </Link>
          <Link href="/food/food-delivery" className="group relative rounded-xl border-2 border-gray-200 bg-white p-5 text-center hover:shadow-lg hover:border-[#D4A017]/50 transition-all duration-300">
            <CountBadge count={foodCounts['food-delivery'] ?? 0} />
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Truck className="w-5 h-5" />
            </div>
            <p className="font-semibold text-gray-900 text-sm">Food Delivery</p>
            <CountLabel count={foodCounts['food-delivery'] ?? 0} />
          </Link>
          <Link href="/food/bakery" className="group relative rounded-xl border-2 border-gray-200 bg-white p-5 text-center hover:shadow-lg hover:border-[#D4A017]/50 transition-all duration-300">
            <CountBadge count={foodCounts['bakery'] ?? 0} />
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Croissant className="w-5 h-5" />
            </div>
            <p className="font-semibold text-gray-900 text-sm">Bakery</p>
            <CountLabel count={foodCounts['bakery'] ?? 0} />
          </Link>
          <Link href="/food/other-food" className="group relative rounded-xl border-2 border-gray-200 bg-white p-5 text-center hover:shadow-lg hover:border-[#D4A017]/50 transition-all duration-300">
            <CountBadge count={foodCounts['other-food'] ?? 0} />
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Coffee className="w-5 h-5" />
            </div>
            <p className="font-semibold text-gray-900 text-sm">Other Food</p>
            <CountLabel count={foodCounts['other-food'] ?? 0} />
          </Link>
        </div>
      </div>

      {/* Supermarket */}
      <div className="max-w-7xl mx-auto px-4 pt-4 pb-12 sm:px-6 lg:px-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-emerald-600" /> Supermarket
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-2">
          <Link href="/other-products/supermarket" className="group relative rounded-xl border-2 border-gray-200 bg-white p-5 text-center hover:shadow-lg hover:border-emerald-300 transition-all duration-300">
            <CountBadge count={foodCounts['supermarket'] ?? 0} />
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <p className="font-semibold text-gray-900 text-sm">Supermarket</p>
            <CountLabel count={foodCounts['supermarket'] ?? 0} />
          </Link>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            General Other Products
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
              <Button className="bg-[#D4A017] hover:bg-[#b8880f] text-[#023E4A] font-semibold">
                Get Started
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
              className="flex items-center justify-center px-6 py-3 border border-[#D4A017]/50 text-[#023E4A] rounded-lg hover:bg-cyan-50 transition-colors"
            >
              <Package className="h-5 w-5 mr-2" />
              Browse All Products
            </Link>
            <Link 
              href="/user/dashboard"
              className="flex items-center justify-center px-6 py-3 bg-[#D4A017] text-[#023E4A] rounded-lg hover:bg-[#b8880f] transition-colors font-semibold"
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
