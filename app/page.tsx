"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import AboutSection from "@/components/aboutUsSection";
import ContactSection from "@/components/ContactSection";
import { Server } from "node:http";
import ServicesSection from "@/components/ServicesSection";
import HomeServices from "@/components/HomeServices";
import { getAllPublishedProducts } from "@/app/actions/product";
import SimpleEnhancedProductCard from "@/components/SimpleEnhancedProductCard";
import ShoppingCartComponent from "@/components/ShoppingCart";
import { Package, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const products = await getAllPublishedProducts();
      setProducts(products.slice(0, 6)); // Show first 6 products
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

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

  const featuredProducts = products;

  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <AboutSection />
      <HomeServices />
      
      {/* Featured Products Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Featured Products
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Discover amazing products and services from our community
            </p>
            <Link 
              href="/view-products"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
            >
              View All Products
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading featured products...</p>
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Products Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Be the first to add a product to our marketplace!
              </p>
              <Link 
                href="/signup"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.map((product) => (
                <SimpleEnhancedProductCard
                  key={product.id}
                  product={product}
                  currentUser={null}
                  isAdmin={false}
                  showAddToCart={true}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <ContactSection />
      <Footer />
      <ShoppingCartComponent />
    </main>
  );
}
