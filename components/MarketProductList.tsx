"use client";

import { useState, useTransition } from "react";
import { placeMarketOrder } from "@/app/actions/marketplace";
import { Tag, ShoppingCart, X, CheckCircle2 } from "lucide-react";

interface MarketProduct {
  id: string;
  name: string;
  price: number;
}

export default function MarketProductList({ products }: { products: MarketProduct[] }) {
  const [active, setActive] = useState<MarketProduct | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const openOrder = (p: MarketProduct) => {
    setActive(p);
    setCustomerName("");
    setCustomerPhone("");
    setQuantity("1");
    setFeedback(null);
  };

  const submitOrder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!active) return;
    const formData = new FormData();
    formData.set("productId", active.id);
    formData.set("customerName", customerName);
    formData.set("customerPhone", customerPhone);
    formData.set("quantity", quantity);
    startTransition(async () => {
      const res = await placeMarketOrder(null, formData);
      setFeedback({ ok: res.success, msg: res.message });
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col"
          >
            <h3 className="font-semibold text-gray-900 text-lg mb-3">{p.name}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-5">
              <span className="inline-flex items-center gap-1 font-semibold text-[#023E4A]">
                <Tag className="w-4 h-4" /> {p.price.toLocaleString()} RWF
              </span>
            </div>
            <button
              onClick={() => openOrder(p)}
              className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#D4A017] hover:bg-[#b8880f] text-[#023E4A] text-sm font-semibold px-4 py-2.5 transition-colors"
            >
              <ShoppingCart className="w-4 h-4" /> Order Now
            </button>
          </div>
        ))}
      </div>

      {/* Order dialog */}
      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setActive(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            {feedback?.ok ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-800 font-medium mb-6">{feedback.msg}</p>
                <button
                  onClick={() => setActive(null)}
                  className="rounded-lg bg-[#023E4A] text-white text-sm font-semibold px-6 py-2.5"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Order {active.name}</h3>
                <p className="text-sm text-gray-500 mb-5">
                  {active.price.toLocaleString()} RWF each
                </p>
                <form onSubmit={submitOrder} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0097A7] focus:ring-1 focus:ring-[#0097A7] outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="07xxxxxxxx"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0097A7] focus:ring-1 focus:ring-[#0097A7] outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0097A7] focus:ring-1 focus:ring-[#0097A7] outline-none"
                      required
                    />
                  </div>

                  {feedback && !feedback.ok && (
                    <p className="text-sm text-red-600">{feedback.msg}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#D4A017] hover:bg-[#b8880f] text-[#023E4A] text-sm font-semibold px-4 py-2.5 transition-colors disabled:opacity-60"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {isPending ? "Placing order…" : "Place Order"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
