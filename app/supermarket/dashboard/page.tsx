"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getUserSession } from "@/app/actions/auth";
import { getUserProducts, deleteProduct } from "@/app/actions/product";
import SimpleEnhancedProductUploadForm from "@/components/SimpleEnhancedProductUploadForm";
import SupermarketNavbar from "@/components/SupermarketNavbar";
import Header from "@/components/Header";
import Link from "next/link";
import {
  ShoppingCart, Calculator, Upload, Package, Edit, Trash2, Eye,
  CheckCircle, ArrowRight, TrendingUp, ShoppingBag, BarChart2, Receipt,
} from "lucide-react";

interface Product {
  id: string;
  title: string;
  description: string;
  price?: number | null;
  category: string;
  subcategory?: string | null;
  available: boolean;
  media?: { images: string[]; mainImage?: string | null } | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  category: string;
}

type Tab = "tools" | "upload";

const SUBCATEGORY_LABELS: Record<string, string> = {
  supermarket: "Supermarket",
};

// Management tool cards — each with its own icon and accent gradient.
const SUPERMARKET_TOOLS = [
  {
    href: "/supermarket/stock-records",
    title: "Stock Records",
    desc: "Track inventory levels and finished products",
    icon: TrendingUp,
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    href: "/supermarket/finished-product-calculator",
    title: "Finished Products Price Calculator",
    desc: "Calculate prices and save products to stock",
    icon: Calculator,
    gradient: "from-[#0097A7] to-cyan-600",
  },
  {
    href: "/supermarket/orders",
    title: "Customer Orders",
    desc: "Manage orders, payments and deliveries",
    icon: ShoppingBag,
    gradient: "from-amber-500 to-orange-600",
  },
  {
    href: "/supermarket/analytics",
    title: "Sales Analytics",
    desc: "Visualize revenue and sales trends",
    icon: BarChart2,
    gradient: "from-fuchsia-500 to-purple-600",
  },
  {
    href: "/supermarket/transactions",
    title: "Transaction Records",
    desc: "Log service payments made in person",
    icon: Receipt,
    gradient: "from-rose-500 to-pink-600",
  },
] as const;

function SupermarketDashboardContent() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    return (searchParams.get("tab") as Tab) ?? "tools";
  });
  const [confirmedPrice, setConfirmedPrice] = useState<number | null>(() => {
    const p = searchParams.get("price");
    return p ? parseFloat(p) : null;
  });
  const [editingProduct, setEditingProduct] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const session = await getUserSession();
        setUser(session as User | null);
        if (session) {
          const p = await getUserProducts();
          setProducts((p || []) as Product[]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const refresh = () =>
      getUserProducts().then((p) => p && setProducts(p as Product[]));
    window.addEventListener("productUpdated", refresh);
    window.addEventListener("productDeleted", refresh);
    return () => {
      window.removeEventListener("productUpdated", refresh);
      window.removeEventListener("productDeleted", refresh);
    };
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this product?")) return;
    await deleteProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    window.dispatchEvent(new CustomEvent("productDeleted"));
  };

  const myProducts = products.filter((p) => p.category === "OtherProducts");

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-32 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#023E4A] mx-auto mb-4" />
          <p className="text-gray-500">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">
          Please{" "}
          <Link href="/login" className="text-[#023E4A] underline">
            log in
          </Link>{" "}
          to access this dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <SupermarketNavbar />

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#023E4A] to-[#0097A7] text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative max-w-7xl mx-auto px-4 pt-20 pb-8 sm:px-6 sm:pt-24 sm:pb-10 lg:px-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 ring-1 ring-white/25 rounded-xl flex items-center justify-center shrink-0">
              <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-white/70 text-xs sm:text-sm font-medium uppercase tracking-wide">
                Supermarket Dashboard
              </p>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">Welcome, {user.name}!</h1>
              <p className="mt-0.5 text-sm text-white/80 hidden sm:block">
                Manage your supermarket stock, pricing and product listings
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex border-b border-gray-200 gap-1">
          <button
            onClick={() => setActiveTab("tools")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px ${
              activeTab === "tools"
                ? "border-[#D4A017] text-[#023E4A]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Calculator className="w-4 h-4" />
            Management Tools
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px ${
              activeTab === "upload"
                ? "border-[#D4A017] text-[#023E4A]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload Product
            {confirmedPrice !== null && (
              <span className="ml-1 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                price ready
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Tab: Management Tools ──────────────────────────────────────── */}
      {activeTab === "tools" && (
        <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-[#0097A7]/15 bg-gradient-to-br from-[#023E4A] via-[#024d5c] to-[#0097A7] p-6 sm:p-8 shadow-lg">
            {/* decorative glows */}
            <div className="pointer-events-none absolute -top-24 -right-16 w-72 h-72 rounded-full bg-[#06B6D4]/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-[#D4A017]/10 blur-3xl" />

            <div className="relative mb-6">
              <p className="text-[#7FE7F1] text-xs font-semibold uppercase tracking-wider">Workspace</p>
              <h2 className="text-2xl font-bold text-white">Supermarket Management Tools</h2>
              <p className="text-white/70 text-sm mt-1">Everything you need to price, list, track and analyze your stock</p>
            </div>

            <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {SUPERMARKET_TOOLS.map(({ href, title, desc, icon: Icon, gradient }) => (
                <Link
                  key={href}
                  href={href}
                  className="group relative overflow-hidden bg-white/95 backdrop-blur rounded-2xl border border-white/40 shadow-sm p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
                >
                  {/* hover accent bar */}
                  <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-base leading-tight">{title}</h3>
                      <p className="text-xs text-gray-500 mt-1 leading-snug">{desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-4 text-sm font-semibold text-[#023E4A] group-hover:gap-2 transition-all">
                    Open
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Upload Product ───────────────────────────────────────────── */}
      {activeTab === "upload" && (
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Upload / Edit form */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                {editingProduct ? (
                  <>
                    <Edit className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-bold text-gray-900">Edit Product</h2>
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-[#023E4A]" />
                    <h2 className="text-lg font-bold text-gray-900">Upload Supermarket Listing</h2>
                  </>
                )}
              </div>

              {confirmedPrice !== null && !editingProduct && (
                <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>
                    Price from calculator:{" "}
                    <strong>
                      Frw{" "}
                      {confirmedPrice.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </strong>{" "}
                    — pre-filled in the Price field below.
                  </span>
                  <button
                    onClick={() => setActiveTab("tools")}
                    className="ml-auto shrink-0 underline text-green-800 hover:text-green-900"
                  >
                    Recalculate
                  </button>
                </div>
              )}

              {editingProduct ? (
                <SimpleEnhancedProductUploadForm
                  initialData={products.find((p) => p.id === editingProduct)}
                  onSuccess={() => setEditingProduct(null)}
                  onCancel={() => setEditingProduct(null)}
                />
              ) : (
                <SimpleEnhancedProductUploadForm
                  defaultCategory="OtherProducts"
                  defaultPrice={confirmedPrice ?? undefined}
                  key={confirmedPrice ?? "upload"}
                />
              )}
            </div>

            {/* My products list */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-[#023E4A]" />
                  <h2 className="text-lg font-bold text-gray-900">My Supermarket Products</h2>
                </div>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {myProducts.length} items
                </span>
              </div>

              {myProducts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-cyan-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="h-10 w-10 text-[#0097A7]" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No listings yet</h3>
                  <p className="text-gray-500 text-sm mb-4">
                    Use the form to upload your first supermarket product
                  </p>
                  <div className="inline-flex items-center text-[#023E4A] text-sm font-medium">
                    Get started <ArrowRight className="ml-1 h-4 w-4" />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {myProducts.map((product) => (
                    <div
                      key={product.id}
                      className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {product.title}
                          </h3>
                          <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                            {product.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {product.subcategory && (
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-cyan-50 text-[#023E4A]">
                                {SUBCATEGORY_LABELS[product.subcategory] ?? product.subcategory}
                              </span>
                            )}
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                product.available
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {product.available ? "Available" : "Unavailable"}
                            </span>
                            {product.price != null && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                Frw {product.price.toFixed(2)}
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
                            onClick={() => handleDelete(product.id)}
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
        </div>
      )}

    </div>
  );
}

export default function SupermarketDashboard() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#023E4A] border-t-transparent" />
      </div>
    }>
      <SupermarketDashboardContent />
    </Suspense>
  );
}
