"use client";

import { useState, useEffect } from "react";
import { getUserSession } from "@/app/actions/auth";
import { getUserPlacedOrders } from "@/app/actions/order";
import Link from "next/link";
import {
  ShoppingBag, ArrowLeft, Package, Clock, CheckCircle,
  XCircle, Truck, MapPin, CreditCard,
} from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  RealEstate: "Real Estate",
  Vehicles: "Vehicles",
  Food: "Food & Dining",
  Industry: "Industry",
  OtherProducts: "Other Products",
  Rent: "Rent",
};

const SUBCATEGORY_LABELS: Record<string, string> = {
  "for-rent": "For Rent",
  "for-sale": "For Sale",
  restaurant: "Restaurant",
  grocery: "Grocery",
  catering: "Catering",
  "food-delivery": "Food Delivery",
  bakery: "Bakery",
  "other-food": "Other Food",
  "raw-materials": "Raw Materials",
  "finished-products": "Finished Products",
};

const STATUS_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending:          { label: "Pending",          color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
  confirmed:        { label: "Confirmed",        color: "bg-blue-100 text-blue-700 border-blue-200",       icon: CheckCircle },
  preparing:        { label: "Preparing",        color: "bg-purple-100 text-purple-700 border-purple-200", icon: Package },
  out_for_delivery: { label: "Out for Delivery", color: "bg-orange-100 text-orange-700 border-orange-200", icon: Truck },
  delivered:        { label: "Delivered",        color: "bg-green-100 text-green-700 border-green-200",    icon: CheckCircle },
  cancelled:        { label: "Cancelled",        color: "bg-red-100 text-red-700 border-red-200",          icon: XCircle },
  contract_approved:{ label: "Contract Approved",color: "bg-indigo-100 text-indigo-700 border-indigo-200", icon: CheckCircle },
};

const PAYMENT_COLOR: Record<string, string> = {
  pending:  "bg-yellow-50 text-yellow-700",
  paid:     "bg-green-50 text-green-700",
  verified: "bg-green-50 text-green-700",
  failed:   "bg-red-50 text-red-700",
};

type Order = Awaited<ReturnType<typeof getUserPlacedOrders>>[number];

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLoggedIn, setUserLoggedIn] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        const session = await getUserSession();
        if (!session) {
          setUserLoggedIn(false);
          setLoading(false);
          return;
        }
        const data = await getUserPlacedOrders();
        setOrders(data as Order[]);
      } catch (err) {
        console.error("Error loading customer orders:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </main>
    );
  }

  if (!userLoggedIn) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">
          Please{" "}
          <Link href="/login" className="text-blue-600 underline">
            log in
          </Link>{" "}
          to view your orders.
        </p>
      </main>
    );
  }

  const statuses = ["all", "pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"];
  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const totalSpent = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.productPrice * o.quantity, 0);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 to-blue-600 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative max-w-7xl mx-auto px-4 py-14 sm:px-6 lg:px-8">
          <Link
            href="/user/dashboard"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-white/70 text-sm font-medium uppercase tracking-wide">Customer Portal</p>
              <h1 className="text-3xl font-bold">My Orders</h1>
              <p className="mt-1 text-white/80">All orders you have placed across every category</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Summary stats ──────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <ShoppingBag className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            <p className="text-gray-500 text-sm">Total Orders</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {orders.filter((o) => o.status === "delivered").length}
            </p>
            <p className="text-gray-500 text-sm">Delivered</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <CreditCard className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              RWF {totalSpent.toLocaleString()}
            </p>
            <p className="text-gray-500 text-sm">Total Spent</p>
          </div>
        </div>

        {/* ── Status filter tabs ──────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 mb-6">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                filter === s
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
              }`}
            >
              {s === "all" ? "All" : (STATUS_META[s]?.label ?? s)}
              {" "}
              <span className={`ml-1 text-xs ${filter === s ? "text-white/80" : "text-gray-400"}`}>
                ({s === "all" ? orders.length : orders.filter((o) => o.status === s).length})
              </span>
            </button>
          ))}
        </div>

        {/* ── Orders list ────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <ShoppingBag className="h-14 w-14 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No orders found</h3>
            <p className="text-gray-500 text-sm mb-6">
              {filter === "all"
                ? "You haven't placed any orders yet."
                : `No orders with status "${STATUS_META[filter]?.label ?? filter}".`}
            </p>
            <Link
              href="/view-products"
              className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Package className="h-4 w-4 mr-2" /> Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((order) => {
              const statusInfo = STATUS_META[order.status] ?? {
                label: order.status,
                color: "bg-gray-100 text-gray-600 border-gray-200",
                icon: Clock,
              };
              const StatusIcon = statusInfo.icon;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl shadow hover:shadow-md transition-shadow p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

                    {/* Left: order info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <ShoppingBag className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate text-base">
                            {order.productTitle}
                          </h3>

                          {/* Category + subcategory */}
                          <div className="flex flex-wrap gap-2 mt-1.5">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                              {CATEGORY_LABELS[order.category] ?? order.category}
                            </span>
                            {order.subcategory && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                {SUBCATEGORY_LABELS[order.subcategory] ?? order.subcategory}
                              </span>
                            )}
                          </div>

                          {/* Delivery address */}
                          {order.deliveryAddress && (
                            <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate">{order.deliveryAddress}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: status + price */}
                    <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-2 flex-shrink-0">
                      {/* Status badge */}
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {statusInfo.label}
                      </span>

                      {/* Payment status */}
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${PAYMENT_COLOR[order.paymentStatus] ?? "bg-gray-50 text-gray-600"}`}>
                        Payment: {order.paymentStatus}
                      </span>

                      {/* Price + qty */}
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          RWF {(order.productPrice * order.quantity).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">Qty: {order.quantity}</p>
                      </div>

                      {/* Date */}
                      <p className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          year: "numeric", month: "short", day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
