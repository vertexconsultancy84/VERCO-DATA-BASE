"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import AboutSection, {
  TEAM_FALLBACK_MEMBERS,
  type AboutTeamMember,
} from "@/components/aboutUsSection";
import ContactSection from "@/components/ContactSection";
import ServicesSection from "@/components/ServicesSection";
import HomeServices from "@/components/HomeServices";
import { getAllPublishedProducts } from "@/app/actions/product";
import { 
  ArrowRight, 
  Home, 
  Building, 
  Utensils, 
  ShoppingBasket, 
  ChefHat, 
  Truck, 
  Croissant, 
  Coffee,
  Package
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<AboutTeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setTeamLoading(true);
      try {
        const [prodList, teamRes] = await Promise.all([
          getAllPublishedProducts(),
          fetch("/api/team").then((r) => r.json()),
        ]);
        if (cancelled) return;
        setProducts(prodList || []);
        if (teamRes.success) {
          setTeamMembers(teamRes.data || []);
        } else {
          console.error("Failed to fetch team members:", teamRes.message);
          setTeamMembers(TEAM_FALLBACK_MEMBERS);
        }
      } catch (error) {
        console.error("Error loading home data:", error);
        if (!cancelled) {
          setProducts([]);
          setTeamMembers(TEAM_FALLBACK_MEMBERS);
        }
      } finally {
        if (!cancelled) setTeamLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Group products by category and subcategory
  const getProductsByCategory = () => {
    const realEstateProducts = products.filter(p => p.category === 'RealEstate');
    const foodProducts = products.filter(p => p.category === 'Food');
    const otherProducts = products.filter(p => p.category === 'OtherProducts');

    return {
      realEstate: {
        forRent: realEstateProducts.filter(p => p.subcategory === 'for-rent'),
        forSale: realEstateProducts.filter(p => p.subcategory === 'for-sale')
      },
      food: {
        restaurant: foodProducts.filter(p => p.subcategory === 'restaurant'),
        grocery: foodProducts.filter(p => p.subcategory === 'grocery'),
        catering: foodProducts.filter(p => p.subcategory === 'catering'),
        foodDelivery: foodProducts.filter(p => p.subcategory === 'food-delivery'),
        bakery: foodProducts.filter(p => p.subcategory === 'bakery'),
        otherFood: foodProducts.filter(p => p.subcategory === 'other-food')
      },
      other: otherProducts
    };
  };

  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <AboutSection teamMembers={teamMembers} teamLoading={teamLoading} />
      <HomeServices />
      
      {/* Categories Section */}
      <section className="pt-2 pb-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Browse by Category
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Explore products and services by category
            </p>
          </div>

          {/* Real Estate Categories */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
              Real Estate
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link 
                href="/real-estate/for-rent"
                className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-lg hover:border-orange-300"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Home className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">For Rent</h4>
                  <p className="text-sm text-gray-600">Apartments, Houses & Working Spaces</p>
                  <div className="mt-4 flex items-center justify-center">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {getProductsByCategory().realEstate.forRent.length} properties
                    </span>
                  </div>
                </div>
              </Link>

              <Link 
                href="/real-estate/for-sale"
                className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-lg hover:border-orange-300"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Building className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">For Sale</h4>
                  <p className="text-sm text-gray-600">Houses & Properties</p>
                  <div className="mt-4 flex items-center justify-center">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {getProductsByCategory().realEstate.forSale.length} properties
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Food Categories */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
              Food & Dining
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Link 
                href="/food/restaurant"
                className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-lg hover:border-orange-300"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Utensils className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Restaurant</h4>
                  <div className="mt-4 flex items-center justify-center">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {getProductsByCategory().food.restaurant.length} items
                    </span>
                  </div>
                </div>
              </Link>

              <Link 
                href="/food/grocery"
                className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-lg hover:border-orange-300"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <ShoppingBasket className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Grocery</h4>
                  <div className="mt-4 flex items-center justify-center">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {getProductsByCategory().food.grocery.length} items
                    </span>
                  </div>
                </div>
              </Link>

              <Link 
                href="/food/catering"
                className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-lg hover:border-orange-300"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <ChefHat className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Catering</h4>
                  <div className="mt-4 flex items-center justify-center">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {getProductsByCategory().food.catering.length} items
                    </span>
                  </div>
                </div>
              </Link>

              <Link 
                href="/food/food-delivery"
                className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-lg hover:border-orange-300"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Truck className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Food Delivery</h4>
                  <div className="mt-4 flex items-center justify-center">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {getProductsByCategory().food.foodDelivery.length} items
                    </span>
                  </div>
                </div>
              </Link>

              <Link 
                href="/food/bakery"
                className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-lg hover:border-orange-300"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Croissant className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Bakery</h4>
                  <div className="mt-4 flex items-center justify-center">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {getProductsByCategory().food.bakery.length} items
                    </span>
                  </div>
                </div>
              </Link>

              <Link 
                href="/food/other-food"
                className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-lg hover:border-orange-300"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Coffee className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Other Food</h4>
                  <div className="mt-4 flex items-center justify-center">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {getProductsByCategory().food.otherFood.length} items
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Other Products Category */}
          {getProductsByCategory().other.length > 0 && (
            <div className="text-center">
              <Link 
                href="/other-products"
                className="inline-flex items-center px-8 py-4 border border-transparent text-base font-medium rounded-xl text-white bg-gray-600 hover:bg-gray-700 transition-colors"
              >
                <Package className="w-5 h-5 mr-2" />
                Other Products ({getProductsByCategory().other.length})
              </Link>
            </div>
          )}

          {/* View All Products Link */}
          <div className="text-center mt-8">
            <Link 
              href="/view-products"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
            >
              View All Products
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <ContactSection />
      <Footer />
    </main>
  );
}
