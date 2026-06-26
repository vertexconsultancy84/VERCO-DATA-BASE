"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Phone, Mail, MessageSquare, Coffee, Star, Filter, Home } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getAllPublishedProducts } from "@/app/actions/product";
import FoodMenuCard from "@/components/FoodMenuCard";
import Header from "@/components/Header";
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

export default function OtherFoodPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOtherFoodProducts();
  }, []);

  const fetchOtherFoodProducts = async () => {
    try {
      setLoading(true);
      const allProducts = await getAllPublishedProducts();
      const otherFoodProducts = allProducts.filter(
        product => product.category === 'Food' && product.subcategory === 'other-food'
      );
      setProducts(otherFoodProducts);
    } catch (error) {
      console.error("Error fetching other food products:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#023E4A] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading other food services...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-indigo-500 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 pt-32 pb-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Coffee className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Other Food Services
            </h1>
            <p className="mt-6 text-xl text-indigo-100 max-w-3xl mx-auto">
              Diverse food services and culinary experiences
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Coffee className="h-12 w-12 text-indigo-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900">{products.length}</h3>
            <p className="text-gray-600">Food Services</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Star className="h-12 w-12 text-indigo-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900">4.8</h3>
            <p className="text-gray-600">Average Rating</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <MapPin className="h-12 w-12 text-indigo-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900">Various</h3>
            <p className="text-gray-600">Locations</p>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Coffee className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Other Food Services Yet</h3>
            <p className="text-gray-600">
              Be the first to add a food service to our marketplace!
            </p>
            <Link href="/user/dashboard">
              <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700">
                Add Your Food Service
              </Button>
            </Link>
          </div>
        ) : (
          <div className="rounded-3xl bg-[#3a4a6b] px-6 py-12 sm:px-10">
            <div className="grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <FoodMenuCard key={product.id} product={product as any} />
              ))}
            </div>
          </div>
        )}
      </div>
      <ShoppingCartComponent />
    </div>
  );
}
