"use client";

import { useState, useEffect } from "react";
import { getAllPublishedProducts } from "@/app/actions/product";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SimpleEnhancedProductCard from "@/components/SimpleEnhancedProductCard";
import { Package, Star, Users } from "lucide-react";

export default function ViewProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      console.log("=== VIEW PRODUCTS PAGE DEBUG ===");
      const fetchedProducts = await getAllPublishedProducts();
      
      console.log("Products fetched:", fetchedProducts.length);
      if (fetchedProducts.length > 0) {
        console.log("Sample product with location:", {
          id: fetchedProducts[0].id,
          title: fetchedProducts[0].title,
          province: fetchedProducts[0].province,
          district: fetchedProducts[0].district,
          sector: fetchedProducts[0].sector,
          village: fetchedProducts[0].village
        });
      }
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
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <p>Loading products...</p>
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
              Available Products
            </h1>
            <p className="mt-6 text-xl text-orange-100 max-w-3xl mx-auto">
              Discover amazing products and services from our community
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
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Yet</h3>
            <p className="text-gray-600">Be the first to add a product to our marketplace!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <SimpleEnhancedProductCard
                key={product.id}
                product={product}
                currentUser={null}
                isAdmin={false}
              />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
