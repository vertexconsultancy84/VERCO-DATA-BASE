"use client";

import { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import AnnouncementBanner from "@/components/AnnouncementBanner";
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
  BoxesIcon,
  Search,
  UtensilsCrossed,
  ShoppingBasket,
  ChefHat,
  Truck,
  Croissant,
  Soup,
} from "lucide-react";
import Link from "next/link";

interface SearchPanel {
  category: string;
  subcategory: string;
  categoryLabel: string;
  browseHref: string;
  accentColor: string;
}

// ── Shared presentational pieces for the "Browse by Category" section ──

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
  cta: string;
  ctaIcon: React.ElementType;
  accent: string;
  href?: string;
  onClick?: () => void;
}

function CategoryCard({
  icon: Icon, gradient, title, desc, count, unit, cta, ctaIcon: CtaIcon, accent, href, onClick,
}: CategoryCardProps) {
  const cls =
    "group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 w-full text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-transparent";
  const inner = (
    <>
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
            <CtaIcon className="w-3 h-3" /> {cta}
          </span>
        </div>
      </div>
    </>
  );
  return href ? (
    <Link href={href} className={cls}>{inner}</Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>{inner}</button>
  );
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
        finishedProducts: industryProducts.filter(p => p.subcategory === 'finished-products')
      },
      other: otherProducts
    };
  };

  // Compute once per products change instead of on every count badge render
  const cats = useMemo(getProductsByCategory, [products]);

  const foodItems = [
    { key: "restaurant",    title: "Restaurant",    desc: "Dine-in & local eateries",   href: "/food/restaurant",    icon: UtensilsCrossed, gradient: "from-amber-500 to-orange-600",   accent: "text-orange-600", count: cats.food.restaurant.length },
    { key: "grocery",       title: "Grocery",       desc: "Fresh produce & essentials", href: "/food/grocery",       icon: ShoppingBasket,  gradient: "from-lime-500 to-green-600",     accent: "text-green-600",  count: cats.food.grocery.length },
    { key: "catering",      title: "Catering",      desc: "Events & bulk catering",     href: "/food/catering",      icon: ChefHat,         gradient: "from-rose-500 to-pink-600",      accent: "text-rose-600",   count: cats.food.catering.length },
    { key: "food-delivery", title: "Food Delivery", desc: "Order in, delivered fast",   href: "/food/food-delivery", icon: Truck,           gradient: "from-cyan-500 to-teal-600",      accent: "text-teal-600",   count: cats.food.foodDelivery.length },
    { key: "bakery",        title: "Bakery",        desc: "Bread, cakes & pastries",    href: "/food/bakery",        icon: Croissant,       gradient: "from-yellow-500 to-amber-600",   accent: "text-amber-600",  count: cats.food.bakery.length },
    { key: "other-food",    title: "Other Food",    desc: "More tasty options",         href: "/food/other-food",    icon: Soup,            gradient: "from-fuchsia-500 to-purple-600", accent: "text-purple-600", count: cats.food.otherFood.length },
  ];

  return (
    <main className="min-h-screen">
      <AnnouncementBanner />
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
      <section className="py-14 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-[#0097A7] bg-cyan-50 px-3 py-1 rounded-full mb-3">
              Marketplace
            </span>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Browse by Category</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore products and services across every category — find the right supplier in seconds.
            </p>
          </div>

          <div className="space-y-10">
            {/* Real Estate & Vehicles — side by side, each header tied to its own cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Real Estate */}
              <div>
                <GroupHeader icon={Home} title="Real Estate" accent="text-[#023E4A]" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CategoryCard
                    icon={Home} gradient="from-[#023E4A] to-[#0097A7]" accent="text-[#023E4A]"
                    title="For Rent" desc="Apartments, Houses & Working Spaces"
                    count={cats.realEstate.forRent.length} unit="properties"
                    cta="Find supplier" ctaIcon={Search}
                    onClick={() => openSearch({ category: "RealEstate", subcategory: "for-rent", categoryLabel: "Real Estate — For Rent", browseHref: "/real-estate/for-rent", accentColor: "orange" })}
                  />
                  <CategoryCard
                    icon={Building} gradient="from-emerald-500 to-emerald-600" accent="text-emerald-600"
                    title="For Sale" desc="Houses & Properties"
                    count={cats.realEstate.forSale.length} unit="properties"
                    cta="Find supplier" ctaIcon={Search}
                    onClick={() => openSearch({ category: "RealEstate", subcategory: "for-sale", categoryLabel: "Real Estate — For Sale", browseHref: "/real-estate/for-sale", accentColor: "emerald" })}
                  />
                </div>
              </div>

              {/* Vehicles */}
              <div>
                <GroupHeader icon={Car} title="Vehicles" accent="text-blue-600" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CategoryCard
                    icon={Car} gradient="from-blue-600 to-blue-700" accent="text-blue-600"
                    title="For Rent" desc="Sedans, SUVs, Trucks & More"
                    count={cats.vehicles.forRent.length} unit="vehicles"
                    cta="Find supplier" ctaIcon={Search}
                    onClick={() => openSearch({ category: "Vehicles", subcategory: "for-rent", categoryLabel: "Vehicles — For Rent", browseHref: "/vehicles/for-rent", accentColor: "blue" })}
                  />
                  <CategoryCard
                    icon={Car} gradient="from-sky-500 to-sky-600" accent="text-sky-600"
                    title="For Sale" desc="Buy Cars, Trucks & Motorcycles"
                    count={cats.vehicles.forSale.length} unit="vehicles"
                    cta="Find supplier" ctaIcon={Search}
                    onClick={() => openSearch({ category: "Vehicles", subcategory: "for-sale", categoryLabel: "Vehicles — For Sale", browseHref: "/vehicles/for-sale", accentColor: "blue" })}
                  />
                </div>
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
                    count={f.count} unit="items"
                    cta="Browse" ctaIcon={ArrowRight}
                    href={f.href}
                  />
                ))}
              </div>
            </div>

            {/* Industry & more */}
            <div>
              <GroupHeader icon={Factory} title="Industry & More" accent="text-indigo-600" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <CategoryCard
                  icon={BoxesIcon} gradient="from-indigo-500 to-blue-600" accent="text-indigo-600"
                  title="Industry — Finished Products" desc="Browse industries and the products they sell"
                  count={cats.industry.finishedProducts.length} unit="items"
                  cta="View industries" ctaIcon={ArrowRight}
                  href="/industry/finished-products"
                />
                <CategoryCard
                  icon={Package} gradient="from-slate-500 to-gray-600" accent="text-gray-600"
                  title="Other Products" desc="Everything else on the marketplace"
                  count={cats.other.length} unit="items"
                  cta="Browse" ctaIcon={ArrowRight}
                  href="/other-products"
                />
                {/* View all — accent call to action */}
                <Link
                  href="/view-products"
                  className="group relative overflow-hidden rounded-2xl p-5 w-full flex flex-col items-center justify-center text-center bg-gradient-to-br from-[#023E4A] to-[#0097A7] text-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                >
                  <Search className="w-7 h-7 mb-2 opacity-90" />
                  <span className="text-base font-bold">View All Products</span>
                  <span className="text-xs text-white/80 mt-1">See the full catalog in one place</span>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold">
                    Explore <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Link>
              </div>
            </div>
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
