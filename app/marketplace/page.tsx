import Header from "@/components/Header";
import Link from "next/link";
import { getMarketSellers } from "@/app/actions/marketplace";
import { Store, ArrowRight, ShoppingBag } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  const sellers = await getMarketSellers();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="relative overflow-hidden bg-gradient-to-r from-[#023E4A] to-[#0097A7] text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative max-w-7xl mx-auto px-4 pt-32 pb-16 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-white/70 text-sm font-medium uppercase tracking-wide">Order Now</p>
              <h1 className="text-3xl font-bold">Marketplace</h1>
              <p className="mt-1 text-white/80">Choose a company to see their products and order.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        {sellers.length === 0 ? (
          <div className="text-center py-20">
            <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No companies have published products yet.</p>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold text-gray-800 mb-6">Companies &amp; Sellers</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sellers.map((s) => (
                <Link
                  key={s.id}
                  href={`/marketplace/${s.id}`}
                  className="group bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-center gap-4 hover:border-[#0097A7] hover:shadow-md transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#023E4A]/5 border border-gray-200 flex items-center justify-center shrink-0">
                    <Store className="w-6 h-6 text-[#0097A7]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{s.name}</h3>
                    <span className="inline-flex items-center gap-1 mt-1 text-gray-600 text-sm font-medium group-hover:gap-2 transition-all">
                      {s.count} product{s.count === 1 ? "" : "s"} <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
