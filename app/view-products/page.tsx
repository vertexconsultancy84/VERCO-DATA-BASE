"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getAllPublishedProducts } from "@/app/actions/product";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SimpleEnhancedProductCard from "@/components/SimpleEnhancedProductCard";
import ShoppingCartComponent from "@/components/ShoppingCart";
import { Package, Star, Users, Filter, Home, Building, Utensils, ShoppingBasket, ChefHat, Truck, Croissant, Coffee, Factory, Layers, BoxesIcon, Car, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const categoryLabels = {
  RealEstate: "Real Estate",
  Food: "Food & Dining",
  Rent: "Rent",
  OtherProducts: "Other Products",
  Vehicles: "Vehicles",
  Industry: "Industry"
};

const rentSubcategories = {
  apartment: "Apartment",
  enterprise: "Enterprise",
  home: "Home",
  "other-assets": "Other Assets"
};

const foodSubcategories = {
  restaurant: "Restaurant",
  grocery: "Grocery",
  catering: "Catering",
  "food-delivery": "Food Delivery",
  bakery: "Bakery",
  "other-food": "Other Food"
};

// Define the Product interface for this component
interface ViewProduct {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  price: number | null | undefined;
  latitude?: number | null;
  longitude?: number | null;
  province?: string | null;
  district?: string | null;
  sector?: string | null;
  village?: string | null;
  available: boolean;
  hidden?: boolean;
  contactNumber?: string | null;
  whatsappNumber?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  media?: {
    images: string[];
    videos: string[];
    mainImage: string | null;
    mainVideo: string | null;
  };
}

function ViewProductsContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";
  const initialSubcategory = searchParams.get("subcategory") || "all";

  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSubcategory, setSelectedSubcategory] = useState(initialSubcategory);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  // Listen for custom events for real-time updates
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

  useEffect(() => {
    filterProducts();
  }, [products, selectedCategory, selectedSubcategory]);

  const filterProducts = () => {
    let filtered = products;

    console.log("=== FILTER DEBUG ===");
    console.log("Selected Category:", selectedCategory);
    console.log("Selected Subcategory:", selectedSubcategory);
    console.log("Total Products:", products.length);

    // Category Filter
    if (selectedCategory && selectedCategory !== "all") {
      filtered = filtered.filter(p => p.category === selectedCategory);
      console.log("After category filter:", filtered.length);
    }

    // Subcategory Filter
    if (selectedSubcategory && selectedSubcategory !== "all") {
      filtered = filtered.filter(p => p.subcategory === selectedSubcategory);
      console.log("After subcategory filter:", filtered.length);
    }

    console.log("Final filtered count:", filtered.length);
    console.log("==================");

    setFilteredProducts(filtered);
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      console.log("=== VIEW PRODUCTS PAGE DEBUG ===");
      const fetchedProducts = await getAllPublishedProducts();

      console.log("Products fetched:", fetchedProducts.length);
      console.log("=================================");

      setProducts(fetchedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#023E4A] to-[#0097A7] text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Available Products
            </h1>
            <p className="mt-6 text-xl text-white/80 max-w-3xl mx-auto">
              Discover amazing products and services from our community
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

      {/* Categories Section */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Real Estate Categories */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
            Real Estate
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/real-estate/for-rent"
              className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-lg hover:border-[#D4A017]/50"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Home className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">For Rent</h4>
                <p className="text-sm text-gray-600">Apartments, Houses & Working Spaces</p>
              </div>
            </Link>

            <Link
              href="/real-estate/for-sale"
              className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-lg hover:border-[#D4A017]/50"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Building className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">For Sale</h4>
                <p className="text-sm text-gray-600">Houses & Properties</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Vehicles Categories */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-600" /> Vehicles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/vehicles/for-rent"
              className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-lg hover:border-blue-300"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Car className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">For Rent</h4>
                <p className="text-sm text-gray-600">Cars, Bikes & Other Vehicles</p>
              </div>
            </Link>

            <Link
              href="/vehicles/for-sale"
              className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-lg hover:border-blue-300"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Car className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">For Sale</h4>
                <p className="text-sm text-gray-600">Buy Cars & Vehicles</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Industry Categories */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Factory className="w-5 h-5 text-[#023E4A]" /> Industry
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/industry/raw-materials"
              className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-lg hover:border-[#D4A017]/50"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 text-white rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Layers className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Raw Materials</h4>
                <p className="text-sm text-gray-600">Industrial raw materials & inputs</p>
              </div>
            </Link>

            <Link
              href="/industry/finished-products"
              className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-lg hover:border-teal-400"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BoxesIcon className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Finished Products</h4>
                <p className="text-sm text-gray-600">Manufactured & finished goods</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Other Products — includes Food & Dining */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-gray-600" /> Other Products
          </h3>

          <p className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wide">Food & Dining</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <Link
              href="/food/restaurant"
              className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-lg hover:border-[#D4A017]/50"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Utensils className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Restaurant</h4>
              </div>
            </Link>

            <Link
              href="/food/grocery"
              className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-lg hover:border-[#D4A017]/50"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ShoppingBasket className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Grocery</h4>
              </div>
            </Link>

            <Link
              href="/food/catering"
              className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-lg hover:border-[#D4A017]/50"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ChefHat className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Catering</h4>
              </div>
            </Link>

            <Link
              href="/food/food-delivery"
              className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-lg hover:border-[#D4A017]/50"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Truck className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Food Delivery</h4>
              </div>
            </Link>

            <Link
              href="/food/bakery"
              className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-lg hover:border-[#D4A017]/50"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Croissant className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Bakery</h4>
              </div>
            </Link>

            <Link
              href="/food/other-food"
              className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-lg hover:border-[#D4A017]/50"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Coffee className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Other Food</h4>
              </div>
            </Link>
          </div>

          <p className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wide">Supermarket</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Link
              href="/other-products/supermarket"
              className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-lg hover:border-[#D4A017]/50"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Supermarket</h4>
              <p className="text-sm text-gray-600">Groceries, essentials & everyday products</p>
            </Link>
          </div>

          <p className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wide">General</p>
          <Link
            href="/other-products"
            className="inline-flex items-center px-8 py-4 border border-transparent text-base font-medium rounded-xl text-white bg-[#023E4A] hover:bg-[#012d36] transition-colors"
          >
            <Package className="w-5 h-5 mr-2" />
            Other Products
          </Link>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {selectedCategory === "all" ? "No Products Yet" : "No Products Found"}
            </h3>
            <p className="text-gray-600">
              {selectedCategory === "all"
                ? "Be the first to add a product to our marketplace!"
                : "Try selecting a different category or check back later."
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredProducts.map((product) => (
              <SimpleEnhancedProductCard
                key={product.id}
                product={product}
                currentUser={null}
                showAddToCart={true}
                isAdmin={false}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function ViewProductsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-cyan-50/30">
      <Header />
      <Suspense fallback={
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <p>Loading...</p>
        </div>
      }>
        <ViewProductsContent />
      </Suspense>
      <Footer />
      <ShoppingCartComponent />
    </main>
  );
}
