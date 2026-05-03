"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Phone, Mail, MessageSquare, Croissant, Star, Filter, Home } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getAllPublishedProducts } from "@/app/actions/product";
import SimpleEnhancedProductCard from "@/components/SimpleEnhancedProductCard";
import ShoppingCartComponent from "@/components/ShoppingCart";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  subcategory: string;
  latitude?: number;
  longitude?: number;
  province?: string;
  district?: string;
  sector?: string;
  village?: string;
  available: boolean;
  hidden: boolean;
  contactNumber?: string;
  whatsappNumber?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  media: {
    id: string;
    images: string[];
    videos: string[];
    mainImage: string;
    mainVideo: string;
  }[];
};

export default function BakeryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBakeryProducts();
  }, []);

  const fetchBakeryProducts = async () => {
    try {
      setLoading(true);
      const allProducts = await getAllPublishedProducts();
      const bakeryProducts = allProducts.filter(
        product => product.category === 'Food' && product.subcategory === 'bakery'
      );
      setProducts(bakeryProducts);
    } catch (error) {
      console.error("Error fetching bakery products:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading bakeries...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-600 to-amber-500 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Croissant className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Bakeries
            </h1>
            <p className="mt-6 text-xl text-amber-100 max-w-3xl mx-auto">
              Fresh baked goods, pastries, and artisanal breads
            </p>
          </div>
        </div>
      </div>

      {/* Home Button */}
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <Link 
          href="/"
          className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          <Home className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Croissant className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900">{products.length}</h3>
            <p className="text-gray-600">Bakeries</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Star className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900">4.8</h3>
            <p className="text-gray-600">Average Rating</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Calendar className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900">Fresh</h3>
            <p className="text-gray-600">Daily Baked</p>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Croissant className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Bakeries Yet</h3>
            <p className="text-gray-600">
              Be the first to add a bakery to our marketplace!
            </p>
            <Link href="/user/dashboard">
              <Button className="mt-4 bg-amber-600 hover:bg-amber-700">
                Add Your Bakery
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <SimpleEnhancedProductCard 
                key={product.id} 
                product={product as any} 
                showAddToCart={true}
              />
            ))}
          </div>
        )}
      </div>
      <ShoppingCartComponent />
    </div>
  );
}
