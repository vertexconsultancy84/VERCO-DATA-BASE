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
import HomeServices from "@/components/HomeServices";
import SupplierSearchPanel from "@/components/SupplierSearchPanel";
import { getAllPublishedProducts } from "@/app/actions/product";
import {
  ArrowRight,
  Home,
  Building,
  Package,
  Car,
  Factory,
  Layers,
  BoxesIcon,
  Search,
} from "lucide-react";
import Link from "next/link";

interface SearchPanel {
  category: string;
  subcategory: string;
  categoryLabel: string;
  browseHref: string;
  accentColor: string;
}

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<AboutTeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [searchPanel, setSearchPanel] = useState<SearchPanel | null>(null);

  const openSearch = (panel: SearchPanel) => setSearchPanel(panel);

  useEffect(() => {
    let cancelled = false;

    // Fetch products independently so team API failure doesn't affect counts
    getAllPublishedProducts()
      .then((prodList) => { if (!cancelled) setProducts(prodList || []); })
      .catch(() => { if (!cancelled) setProducts([]); });

    // Fetch team independently
    setTeamLoading(true);
    fetch("/api/team")
      .then((r) => r.json())
      .then((teamRes) => {
        if (cancelled) return;
        if (teamRes.success) setTeamMembers(teamRes.data || []);
        else setTeamMembers(TEAM_FALLBACK_MEMBERS);
      })
      .catch(() => { if (!cancelled) setTeamMembers(TEAM_FALLBACK_MEMBERS); })
      .finally(() => { if (!cancelled) setTeamLoading(false); });

    return () => { cancelled = true; };
  }, []);

  // Group products by category and subcategory
  const getProductsByCategory = () => {
    const realEstateProducts = products.filter(p => p.category === 'RealEstate');
    const foodProducts = products.filter(p => p.category === 'Food');
    const otherProducts = products.filter(p => p.category === 'OtherProducts');
    const vehicleProducts = products.filter(p => p.category === 'Vehicles');
    const industryProducts = products.filter(p => p.category === 'Industry');

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
      vehicles: {
        forRent: vehicleProducts.filter(p => p.subcategory === 'for-rent'),
        forSale: vehicleProducts.filter(p => p.subcategory === 'for-sale')
      },
      industry: {
        rawMaterials: industryProducts.filter(p => p.subcategory === 'raw-materials'),
        finishedProducts: industryProducts.filter(p => p.subcategory === 'finished-products')
      },
      other: otherProducts
    };
  };

  return (
    <main className="min-h-screen">
      <Header />
      <Hero products={products} />

      <SupplierSearchPanel
        isOpen={searchPanel !== null}
        onClose={() => setSearchPanel(null)}
        category={searchPanel?.category ?? ""}
        subcategory={searchPanel?.subcategory ?? ""}
        categoryLabel={searchPanel?.categoryLabel ?? ""}
        browseHref={searchPanel?.browseHref ?? "/"}
        accentColor={searchPanel?.accentColor}
      />

      {/* Categories Section */}
      <section className="pt-2 pb-4 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Browse by Category
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Explore products and services by category
            </p>
          </div>

          {/* Real Estate & Vehicles Categories — same horizontal row */}
          <div className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-2">
              <h3 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
                <Home className="w-5 h-5 text-[#023E4A]" /> Real Estate
              </h3>
              <h3 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-600" /> Vehicles
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              {/* Real Estate — For Rent */}
              <button
                onClick={() => openSearch({ category: "RealEstate", subcategory: "for-rent", categoryLabel: "Real Estate — For Rent", browseHref: "/real-estate/for-rent", accentColor: "orange" })}
                className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-lg hover:border-[#D4A017]/50 text-left w-full"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#023E4A] to-[#0097A7] text-white rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Home className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">For Rent</h4>
                  <p className="text-sm text-gray-600">Apartments, Houses & Working Spaces</p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {getProductsByCategory().realEstate.forRent.length} properties
                    </span>
                    <span className="text-xs text-[#023E4A] flex items-center gap-0.5 font-medium">
                      <Search className="w-3 h-3" /> Find supplier
                    </span>
                  </div>
                </div>
              </button>

              {/* Real Estate — For Sale */}
              <button
                onClick={() => openSearch({ category: "RealEstate", subcategory: "for-sale", categoryLabel: "Real Estate — For Sale", browseHref: "/real-estate/for-sale", accentColor: "emerald" })}
                className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-lg hover:border-emerald-300 text-left w-full"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Building className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">For Sale</h4>
                  <p className="text-sm text-gray-600">Houses & Properties</p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {getProductsByCategory().realEstate.forSale.length} properties
                    </span>
                    <span className="text-xs text-emerald-600 flex items-center gap-0.5 font-medium">
                      <Search className="w-3 h-3" /> Find supplier
                    </span>
                  </div>
                </div>
              </button>

              {/* Vehicles — For Rent */}
              <button
                onClick={() => openSearch({ category: "Vehicles", subcategory: "for-rent", categoryLabel: "Vehicles — For Rent", browseHref: "/vehicles/for-rent", accentColor: "blue" })}
                className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-lg hover:border-blue-300 text-left w-full"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Car className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">For Rent</h4>
                  <p className="text-sm text-gray-600">Sedans, SUVs, Trucks & More</p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {getProductsByCategory().vehicles.forRent.length} vehicles
                    </span>
                    <span className="text-xs text-blue-600 flex items-center gap-0.5 font-medium">
                      <Search className="w-3 h-3" /> Find supplier
                    </span>
                  </div>
                </div>
              </button>

              {/* Vehicles — For Sale */}
              <button
                onClick={() => openSearch({ category: "Vehicles", subcategory: "for-sale", categoryLabel: "Vehicles — For Sale", browseHref: "/vehicles/for-sale", accentColor: "blue" })}
                className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-lg hover:border-sky-300 text-left w-full"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-sky-600 text-white rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Car className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">For Sale</h4>
                  <p className="text-sm text-gray-600">Buy Cars, Trucks & Motorcycles</p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {getProductsByCategory().vehicles.forSale.length} vehicles
                    </span>
                    <span className="text-xs text-sky-600 flex items-center gap-0.5 font-medium">
                      <Search className="w-3 h-3" /> Find supplier
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Industry Category */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Factory className="w-5 h-5 text-[#023E4A]" /> Industry
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {/* Industry — Raw Materials */}
              <button
                onClick={() => openSearch({ category: "Industry", subcategory: "raw-materials", categoryLabel: "Industry — Raw Materials", browseHref: "/industry/raw-materials", accentColor: "slate" })}
                className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-lg hover:border-slate-400 text-left w-full"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#023E4A] to-[#0097A7] text-white rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Raw Materials</h4>
                  <p className="text-sm text-gray-600">Industrial raw materials & inputs</p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {getProductsByCategory().industry.rawMaterials.length} items
                    </span>
                    <span className="text-xs text-[#023E4A] flex items-center gap-0.5 font-medium">
                      <Search className="w-3 h-3" /> Find supplier
                    </span>
                  </div>
                </div>
              </button>

              {/* Industry — Finished Products */}
              <button
                onClick={() => openSearch({ category: "Industry", subcategory: "finished-products", categoryLabel: "Industry — Finished Products", browseHref: "/industry/finished-products", accentColor: "slate" })}
                className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-lg hover:border-slate-400 text-left w-full"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <BoxesIcon className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Finished Products</h4>
                  <p className="text-sm text-gray-600">Manufactured & finished goods</p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {getProductsByCategory().industry.finishedProducts.length} items
                    </span>
                    <span className="text-xs text-teal-600 flex items-center gap-0.5 font-medium">
                      <Search className="w-3 h-3" /> Find supplier
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Other Products + View All Products — same row */}
          <div className="flex items-center justify-between gap-4 mb-8">
            <Link
              href="/other-products"
              className="group inline-flex items-center gap-3 px-8 py-4 border-2 border-gray-200 bg-white rounded-xl text-gray-700 font-semibold text-base hover:shadow-lg hover:border-gray-400 transition-all duration-300"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 text-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Package className="w-5 h-5" />
              </div>
              Other Products
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/view-products"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#023E4A] hover:bg-[#012d36] transition-colors"
            >
              View All Products
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <AboutSection teamMembers={teamMembers} teamLoading={teamLoading} />
      <HomeServices />
      <ContactSection />
      <Footer />
    </main>
  );
}
