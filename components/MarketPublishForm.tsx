"use client";

import { useEffect, useState, useTransition } from "react";
import {
  publishMarketProduct,
  getMyMarketProducts,
  deleteMarketProduct,
  getMyMarketOrders,
} from "@/app/actions/marketplace";
import { PlusCircle, Trash2, Tag, ShoppingBag } from "lucide-react";

interface MarketProduct {
  id: string;
  name: string;
  price: number;
  createdAt: string | Date;
}

interface MarketOrder {
  id: string;
  productName: string;
  price: number;
  quantity: number;
  customerName: string;
  customerPhone: string;
  status: string;
  createdAt: string | Date;
}

export default function MarketPublishForm() {
  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [orders, setOrders] = useState<MarketOrder[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = async () => {
    const [p, o] = await Promise.all([getMyMarketProducts(), getMyMarketOrders()]);
    setProducts(p as MarketProduct[]);
    setOrders(o as MarketOrder[]);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);
    const formData = new FormData();
    formData.set("name", name);
    formData.set("price", price);
    startTransition(async () => {
      const res = await publishMarketProduct(null, formData);
      setFeedback({ ok: res.success, msg: res.message });
      if (res.success) {
        setName("");
        setPrice("");
        refresh();
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteMarketProduct(id);
      refresh();
    });
  };

  return (
    <div className="mb-10">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Publish form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 h-fit">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag className="w-5 h-5 text-[#0097A7]" />
            <h2 className="text-lg font-bold text-gray-900">Publish a Product</h2>
          </div>
          <p className="text-sm text-gray-500 mb-5">
            Shown to customers in the public marketplace. No image needed.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rice 25kg"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0097A7] focus:ring-1 focus:ring-[#0097A7] outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (RWF)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0097A7] focus:ring-1 focus:ring-[#0097A7] outline-none"
                required
              />
            </div>

            {feedback && (
              <p className={`text-sm ${feedback.ok ? "text-green-600" : "text-red-600"}`}>
                {feedback.msg}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#023E4A] hover:bg-[#0097A7] text-white text-sm font-semibold px-4 py-2.5 transition-colors disabled:opacity-60"
            >
              <PlusCircle className="w-4 h-4" />
              {isPending ? "Publishing…" : "Publish Product"}
            </button>
          </form>
        </div>

        {/* Published products list */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            My Published Products <span className="text-gray-400 font-normal">({products.length})</span>
          </h2>

          {products.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">
              No products published yet. Add one using the form.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {products.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3 gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{p.name}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-0.5">
                      <span className="inline-flex items-center gap-1">
                        <Tag className="w-3 h-3" /> {p.price.toLocaleString()} RWF
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={isPending}
                    className="text-gray-400 hover:text-red-600 transition-colors shrink-0"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Received orders */}
      {orders.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Orders Received <span className="text-gray-400 font-normal">({orders.length})</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="py-2 pr-4 font-medium">Product</th>
                  <th className="py-2 pr-4 font-medium">Qty</th>
                  <th className="py-2 pr-4 font-medium">Customer</th>
                  <th className="py-2 pr-4 font-medium">Phone</th>
                  <th className="py-2 pr-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-gray-50">
                    <td className="py-2 pr-4 text-gray-900">{o.productName}</td>
                    <td className="py-2 pr-4">{o.quantity}</td>
                    <td className="py-2 pr-4">{o.customerName}</td>
                    <td className="py-2 pr-4">
                      <a href={`tel:${o.customerPhone}`} className="text-[#0097A7] hover:underline">
                        {o.customerPhone}
                      </a>
                    </td>
                    <td className="py-2 pr-4 text-gray-500">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
