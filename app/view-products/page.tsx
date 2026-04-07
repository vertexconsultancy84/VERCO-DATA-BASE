"use client";

import { useState, useEffect } from "react";
import { getAllPublishedProducts } from "@/app/actions/product";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SimpleEnhancedProductCard from "@/components/SimpleEnhancedProductCard";
import { Package, Star, Users, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const categoryLabels = {
  RealEstate: "Real Estate",
  Food: "Food",
  Rent: "Rent",
  OtherProducts: "Other Products"
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

export default function ViewProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
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
    if (selectedCategory === "all") {
      setFilteredProducts(products);
    } else if (selectedCategory === "Rent" && selectedSubcategory !== "all") {
      setFilteredProducts(products.filter(product => 
        product.category === "Rent" && product.subcategory === selectedSubcategory
      ));
    } else {
      setFilteredProducts(products.filter(product => product.category === selectedCategory));
    }
  };

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
          category: fetchedProducts[0].category,
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

      {/* Category Filter Section */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900">Filter by Category</h3>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Showing {filteredProducts.length} of {products.length} products
              </span>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="RealEstate">Real Estate</SelectItem>
                  <SelectItem value="Food">Food</SelectItem>
                  <SelectItem value="Rent">Rent</SelectItem>
                  <SelectItem value="OtherProducts">Other Products</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Subcategory filter - only show for Rent category */}
              {selectedCategory === "Rent" && (
                <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Rent</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                    <SelectItem value="home">Home</SelectItem>
                    <SelectItem value="other-assets">Other Assets</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {selectedCategory === "all" ? "No Products Yet" : "No Products in This Category"}
            </h3>
            <p className="text-gray-600">
              {selectedCategory === "all" 
                ? "Be the first to add a product to our marketplace!" 
                : "Try selecting a different category or be the first to add a product here."
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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

      <Footer />
    </main>
  );
}
