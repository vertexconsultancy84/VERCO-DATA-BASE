"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getAllPublishedProducts } from "@/app/actions/product";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SimpleEnhancedProductCard from "@/components/SimpleEnhancedProductCard";
import ShoppingCartComponent from "@/components/ShoppingCart";
import { Package, Star, Users, Filter, Home, Building, UtensilsCrossed, ShoppingBasket, ChefHat, Truck, Croissant, Soup, Factory, Layers, BoxesIcon, Car, ShoppingCart, ArrowRight } from "lucide-react";
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

// ── Shared presentational pieces for the category browser ──

function GroupHeader({ icon: Icon, title, accent }: { icon: React.ElementType; title: string; accent: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className={`w-9 h-9 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center ${accent}`}>
        <Icon className="w-5 h-5" strokeWidth={2.2} />
      </span>
      <h3 className="text-lg font-bold text-gray-800">{title}</h3>
    </div>
  );
}

interface CategoryCardProps {
  icon: React.ElementType;
  gradient: string;
  title: string;
  desc: string;
  count: number;
  unit: string;
  accent: string;
  href: string;
}

function CategoryCard({ icon: Icon, gradient, title, desc, count, unit, accent, href }: CategoryCardProps) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 w-full text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-transparent"
    >
      <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className="flex flex-col items-center text-center">
        <div className={`w-12 h-12 bg-gradient-to-br ${gradient} text-white rounded-2xl flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
        <h4 className="text-base font-bold text-gray-900 mb-1">{title}</h4>
        <p className="text-xs text-gray-500 leading-snug min-h-[2rem]">{desc}</p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">
            {count} {unit}
          </span>
          <span className={`text-[11px] ${accent} flex items-center gap-0.5 font-semibold whitespace-nowrap`}>
            <ArrowRight className="w-3 h-3" /> Browse
          </span>
        </div>
      </div>
    </Link>
  );
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

  // Per-category counts, computed once per products change
  const counts = useMemo(() => {
    const by = (cat: string, sub?: string) =>
      products.filter((p) => p.category === cat && (sub ? p.subcategory === sub : true)).length;
    return {
      reRent: by("RealEstate", "for-rent"),
      reSale: by("RealEstate", "for-sale"),
      vehRent: by("Vehicles", "for-rent"),
      vehSale: by("Vehicles", "for-sale"),
      indRaw: by("Industry", "raw-materials"),
      indFinished: by("Industry", "finished-products"),
      food: {
        restaurant: by("Food", "restaurant"),
        grocery: by("Food", "grocery"),
        catering: by("Food", "catering"),
        foodDelivery: by("Food", "food-delivery"),
        bakery: by("Food", "bakery"),
        otherFood: by("Food", "other-food"),
      },
      supermarket: by("OtherProducts", "supermarket"),
      other: by("OtherProducts"),
    };
  }, [products]);

  const foodItems = [
    { key: "restaurant",    title: "Restaurant",    desc: "Dine-in & local eateries",   href: "/food/restaurant",    icon: UtensilsCrossed, gradient: "from-amber-500 to-orange-600",   accent: "text-orange-600", count: counts.food.restaurant },
    { key: "grocery",       title: "Grocery",       desc: "Fresh produce & essentials", href: "/food/grocery",       icon: ShoppingBasket,  gradient: "from-lime-500 to-green-600",     accent: "text-green-600",  count: counts.food.grocery },
    { key: "catering",      title: "Catering",      desc: "Events & bulk catering",     href: "/food/catering",      icon: ChefHat,         gradient: "from-rose-500 to-pink-600",      accent: "text-rose-600",   count: counts.food.catering },
    { key: "food-delivery", title: "Food Delivery", desc: "Order in, delivered fast",   href: "/food/food-delivery", icon: Truck,           gradient: "from-cyan-500 to-teal-600",      accent: "text-teal-600",   count: counts.food.foodDelivery },
    { key: "bakery",        title: "Bakery",        desc: "Bread, cakes & pastries",    href: "/food/bakery",        icon: Croissant,       gradient: "from-yellow-500 to-amber-600",   accent: "text-amber-600",  count: counts.food.bakery },
    { key: "other-food",    title: "Other Food",    desc: "More tasty options",         href: "/food/other-food",    icon: Soup,            gradient: "from-fuchsia-500 to-purple-600", accent: "text-purple-600", count: counts.food.otherFood },
  ];

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
        <div className="mb-8 text-center">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-[#0097A7] bg-cyan-50 px-3 py-1 rounded-full mb-3">
            Shop by Category
          </span>
          <h2 className="text-2xl font-bold text-gray-900">Find what you're looking for</h2>
        </div>

        <div className="space-y-10">
          {/* Real Estate & Vehicles — side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <GroupHeader icon={Home} title="Real Estate" accent="text-[#023E4A]" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CategoryCard
                  icon={Home} gradient="from-[#023E4A] to-[#0097A7]" accent="text-[#023E4A]"
                  title="For Rent" desc="Apartments, Houses & Working Spaces"
                  count={counts.reRent} unit="properties" href="/real-estate/for-rent"
                />
                <CategoryCard
                  icon={Building} gradient="from-emerald-500 to-emerald-600" accent="text-emerald-600"
                  title="For Sale" desc="Houses & Properties"
                  count={counts.reSale} unit="properties" href="/real-estate/for-sale"
                />
              </div>
            </div>

            <div>
              <GroupHeader icon={Car} title="Vehicles" accent="text-blue-600" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CategoryCard
                  icon={Car} gradient="from-blue-600 to-blue-700" accent="text-blue-600"
                  title="For Rent" desc="Cars, Bikes & Other Vehicles"
                  count={counts.vehRent} unit="vehicles" href="/vehicles/for-rent"
                />
                <CategoryCard
                  icon={Car} gradient="from-sky-500 to-sky-600" accent="text-sky-600"
                  title="For Sale" desc="Buy Cars, Trucks & Motorcycles"
                  count={counts.vehSale} unit="vehicles" href="/vehicles/for-sale"
                />
              </div>
            </div>
          </div>

          {/* Industry */}
          <div>
            <GroupHeader icon={Factory} title="Industry" accent="text-indigo-600" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CategoryCard
                icon={Layers} gradient="from-slate-500 to-slate-700" accent="text-slate-600"
                title="Raw Materials" desc="Industrial raw materials & inputs"
                count={counts.indRaw} unit="items" href="/industry/raw-materials"
              />
              <CategoryCard
                icon={BoxesIcon} gradient="from-indigo-500 to-blue-600" accent="text-indigo-600"
                title="Finished Products" desc="Manufactured & finished goods"
                count={counts.indFinished} unit="items" href="/industry/finished-products"
              />
            </div>
          </div>

          {/* Food & Dining */}
          <div>
            <GroupHeader icon={UtensilsCrossed} title="Food & Dining" accent="text-orange-600" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {foodItems.map((f) => (
                <CategoryCard
                  key={f.key}
                  icon={f.icon} gradient={f.gradient} accent={f.accent}
                  title={f.title} desc={f.desc}
                  count={f.count} unit="items" href={f.href}
                />
              ))}
            </div>
          </div>

          {/* Supermarket & more */}
          <div>
            <GroupHeader icon={Package} title="Supermarket & More" accent="text-emerald-600" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <CategoryCard
                icon={ShoppingCart} gradient="from-emerald-500 to-emerald-700" accent="text-emerald-600"
                title="Supermarket" desc="Groceries, essentials & everyday products"
                count={counts.supermarket} unit="items" href="/other-products/supermarket"
              />
              <CategoryCard
                icon={Package} gradient="from-slate-500 to-gray-600" accent="text-gray-600"
                title="Other Products" desc="Everything else on the marketplace"
                count={counts.other} unit="items" href="/other-products"
              />
              <div className="group relative overflow-hidden rounded-2xl p-5 w-full flex flex-col items-center justify-center text-center bg-gradient-to-br from-[#023E4A] to-[#0097A7] text-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <Package className="w-7 h-7 mb-2 opacity-90" />
                <span className="text-base font-bold">All Products</span>
                <span className="text-xs text-white/80 mt-1">{products.length} listings in total</span>
              </div>
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
