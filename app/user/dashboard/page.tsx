"use client";

import { useState, useEffect } from "react";
import { getUserSession } from "@/app/actions/auth";
import { getUserProducts, deleteProduct } from "@/app/actions/product";
import { getUserPlacedOrders } from "@/app/actions/order";
import SimpleEnhancedProductUploadForm from "@/components/SimpleEnhancedProductUploadForm";
import Header from "@/components/Header";
import {
  Package, Upload, TrendingUp, Users, ArrowRight, Home, Edit, Trash2, Eye,
  CheckCircle, Car, Utensils, Factory, Building, Layers, BoxesIcon,
  ShoppingBasket, ChefHat, Truck, Croissant, Coffee, ShoppingBag, ShoppingCart,
} from "lucide-react";
import Link from "next/link";

// ── Category config ──────────────────────────────────────────────────────────
const CATEGORY_META: Record<string, {
  label: string;
  description: string;
  color: string;        // tailwind gradient classes
  accentBg: string;
  accentText: string;
  icon: React.ElementType;
  quickLinks: { label: string; href: string; icon: React.ElementType }[];
}> = {
  RealEstate: {
    label: "Real Estate",
    description: "Manage your property listings for rent and sale",
    color: "from-orange-600 to-orange-500",
    accentBg: "bg-orange-50",
    accentText: "text-orange-700",
    icon: Home,
    quickLinks: [
      { label: "For Rent", href: "/real-estate/for-rent", icon: Home },
      { label: "For Sale", href: "/real-estate/for-sale", icon: Building },
    ],
  },
  Vehicles: {
    label: "Vehicles",
    description: "Manage your vehicle listings for rent and sale",
    color: "from-blue-700 to-blue-600",
    accentBg: "bg-blue-50",
    accentText: "text-blue-700",
    icon: Car,
    quickLinks: [
      { label: "Vehicles For Rent", href: "/vehicles/for-rent", icon: Car },
      { label: "Vehicles For Sale", href: "/vehicles/for-sale", icon: Car },
    ],
  },
  Food: {
    label: "Food & Dining",
    description: "Manage your food and dining products",
    color: "from-red-600 to-orange-500",
    accentBg: "bg-red-50",
    accentText: "text-red-700",
    icon: Utensils,
    quickLinks: [
      { label: "Restaurant", href: "/food/restaurant", icon: Utensils },
      { label: "Grocery", href: "/food/grocery", icon: ShoppingBasket },
      { label: "Catering", href: "/food/catering", icon: ChefHat },
      { label: "Food Delivery", href: "/food/food-delivery", icon: Truck },
      { label: "Bakery", href: "/food/bakery", icon: Croissant },
      { label: "Other Food", href: "/food/other-food", icon: Coffee },
    ],
  },
  Industry: {
    label: "Industry",
    description: "Manage your industrial raw materials and finished products",
    color: "from-[#023E4A] to-[#0097A7]",
    accentBg: "bg-cyan-50",
    accentText: "text-[#023E4A]",
    icon: Factory,
    quickLinks: [
      { label: "Industry Dashboard", href: "/industry/dashboard", icon: Factory },
      { label: "Raw Materials", href: "/industry/raw-materials", icon: Layers },
      { label: "Finished Products", href: "/industry/finished-products", icon: BoxesIcon },
    ],
  },
  OtherProducts: {
    label: "Other Products",
    description: "Manage your general products and services",
    color: "from-gray-700 to-gray-600",
    accentBg: "bg-gray-50",
    accentText: "text-gray-700",
    icon: Package,
    quickLinks: [
      { label: "Browse All", href: "/other-products", icon: Package },
      { label: "Supermarket", href: "/other-products/supermarket", icon: ShoppingCart },
      { label: "Supermarket Management", href: "/supermarket/dashboard", icon: ShoppingCart },
    ],
  },
};

const SUBCATEGORY_LABELS: Record<string, string> = {
  "for-rent": "For Rent", "for-sale": "For Sale",
  restaurant: "Restaurant", grocery: "Grocery", catering: "Catering",
  "food-delivery": "Food Delivery", bakery: "Bakery", "other-food": "Other Food",
  "raw-materials": "Raw Materials", "finished-products": "Finished Products",
  supermarket: "Supermarket",
};


// ── Types ────────────────────────────────────────────────────────────────────
interface Product {
  id: string; title: string; description: string; price?: number | null;
  category: string; subcategory?: string | null; propertyType?: string | null;
  available: boolean; contactNumber?: string | null; whatsappNumber?: string | null;
  village?: string | null; zone?: string | null; createdAt: Date; updatedAt: Date;
  userId: string;
  media?: { images: string[]; videos: string[]; mainImage?: string | null; mainVideo?: string | null } | null;
  user?: { name: string; id: string; email: string };
}

interface User { id: string; name: string; email: string; category: string }

// ── Component ────────────────────────────────────────────────────────────────
export default function UserDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const session = await getUserSession();
        setUser(session as User | null);
        if (session) {
          const [userProducts, userOrders] = await Promise.all([
            getUserProducts(),
            getUserPlacedOrders(),
          ]);
          setProducts((userProducts || []) as Product[]);
          setOrders(userOrders || []);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const refresh = () => {
      if (user) getUserProducts().then((p) => p && setProducts(p as Product[]));
    };
    window.addEventListener("productUpdated", refresh);
    window.addEventListener("productDeleted", refresh);
    return () => {
      window.removeEventListener("productUpdated", refresh);
      window.removeEventListener("productDeleted", refresh);
    };
  }, [user]);

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      window.dispatchEvent(new CustomEvent("productDeleted"));
    } catch {
      alert("Failed to delete product. Please try again.");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-cyan-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#023E4A] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Please <Link href="/login" className="text-[#023E4A] underline">log in</Link> to view your dashboard.</p>
      </main>
    );
  }

  const meta = CATEGORY_META[user.category] ?? CATEGORY_META["OtherProducts"];
  const CategoryIcon = meta.icon;

  // Products for this category only
  const myProducts = products.filter((p) => p.category === user.category);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-cyan-50/30">

      <Header />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className={`relative overflow-hidden bg-gradient-to-r ${meta.color} text-white pt-24`}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative max-w-7xl mx-auto px-4 py-14 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
              <CategoryIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-white/70 text-sm font-medium uppercase tracking-wide">{meta.label} Dashboard</p>
              <h1 className="text-3xl font-bold">Welcome back, {user.name}!</h1>
              <p className="mt-1 text-white/80">{meta.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Contract notifications ────────────────────────────────────── */}
      {orders.filter((o) => o.status === "contract_approved").length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pt-6 sm:px-6 lg:px-8">
          <div className="bg-indigo-50 border-l-4 border-indigo-600 p-5 rounded-r-lg shadow-sm">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-indigo-900">Contract Approvals</h3>
                <div className="mt-3 space-y-2">
                  {orders.filter((o) => o.status === "contract_approved").map((order) => (
                    <div key={order.id} className="bg-white p-3 rounded border border-indigo-100 text-sm text-gray-800">
                      Your contract for <strong>{order.productTitle}</strong> has been{" "}
                      <span className="text-indigo-600 font-semibold">approved</span>.
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Stats ────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-md transition-shadow">
            <Package className="h-10 w-10 text-[#023E4A] mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-gray-900">{myProducts.length}</h3>
            <p className="text-gray-500 text-sm">My {meta.label} Listings</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-md transition-shadow">
            <Upload className="h-10 w-10 text-[#023E4A] mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-gray-900">Active</h3>
            <p className="text-gray-500 text-sm">Upload Status</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-md transition-shadow">
            <TrendingUp className="h-10 w-10 text-[#023E4A] mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-gray-900">Growing</h3>
            <p className="text-gray-500 text-sm">Business Status</p>
          </div>
        </div>
      </div>

      {/* ── Category Quick Links ──────────────────────────────────────── */}
      {meta.quickLinks.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pb-2 sm:px-6 lg:px-8">
          <div className={`${meta.accentBg} rounded-xl p-5`}>
            <p className={`text-sm font-semibold ${meta.accentText} mb-3 uppercase tracking-wide`}>
              Browse {meta.label}
            </p>
            <div className="flex flex-wrap gap-3">
              {meta.quickLinks.map((link) => {
                const LinkIcon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:shadow-sm hover:border-gray-300 transition-all`}
                  >
                    <LinkIcon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Main content: upload form + product list ──────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Upload / Edit form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              {editingProduct ? (
                <>
                  <Edit className="h-5 w-5 text-blue-600 mr-2" />
                  <h2 className="text-lg font-bold text-gray-900">Edit Product</h2>
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 text-[#023E4A] mr-2" />
                  <h2 className="text-lg font-bold text-gray-900">Upload New {meta.label} Listing</h2>
                </>
              )}
            </div>

            {editingProduct ? (
              <SimpleEnhancedProductUploadForm
                initialData={products.find((p) => p.id === editingProduct)}
                onSuccess={() => setEditingProduct(null)}
                onCancel={() => setEditingProduct(null)}
              />
            ) : (
              <SimpleEnhancedProductUploadForm
                defaultCategory={user.category}
              />
            )}
          </div>

          {/* My Products */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <CategoryIcon className="h-5 w-5 text-[#023E4A]" />
                <h2 className="text-lg font-bold text-gray-900">My {meta.label} Products</h2>
              </div>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {myProducts.length} items
              </span>
            </div>

            {myProducts.length === 0 ? (
              <div className="text-center py-12">
                <div className={`${meta.accentBg} rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4`}>
                  <CategoryIcon className={`h-10 w-10 ${meta.accentText} opacity-60`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No listings yet</h3>
                <p className="text-gray-500 text-sm mb-4">Upload your first {meta.label.toLowerCase()} listing using the form</p>
                <div className={`inline-flex items-center ${meta.accentText} text-sm font-medium`}>
                  Get started <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {myProducts.map((product) => (
                  <div key={product.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{product.title}</h3>
                        <p className="text-gray-500 text-sm mt-1 line-clamp-2">{product.description}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {product.subcategory && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${meta.accentBg} ${meta.accentText}`}>
                              {SUBCATEGORY_LABELS[product.subcategory] ?? product.subcategory}
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            product.available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}>
                            {product.available ? "Available" : "Unavailable"}
                          </span>
                          {product.price != null && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                              ${product.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Link
                          href={`/product-details?id=${product.id}`}
                          className="p-2 border border-[#D4A017]/40 text-[#023E4A] rounded-lg hover:bg-cyan-50 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => setEditingProduct(product.id)}
                          className="p-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer actions ───────────────────────────────────────────── */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link
              href="/view-products"
              className="flex items-center justify-center px-5 py-3 border border-[#D4A017]/50 text-[#023E4A] rounded-xl hover:bg-cyan-50 transition-colors"
            >
              <Package className="h-4 w-4 mr-2" /> Browse Products
            </Link>
            <Link
              href="/user/customer-orders"
              className="flex items-center justify-center px-5 py-3 border border-blue-300 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors"
            >
              <ShoppingBag className="h-4 w-4 mr-2" /> My Orders
            </Link>
            <Link
              href="/contact"
              className="flex items-center justify-center px-5 py-3 bg-[#D4A017] text-[#023E4A] rounded-xl hover:bg-[#b8880f] transition-colors font-semibold"
            >
              <Users className="h-4 w-4 mr-2" /> Contact Support
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center px-5 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Home className="h-4 w-4 mr-2" /> Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
