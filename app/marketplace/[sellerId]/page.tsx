import Header from "@/components/Header";
import Link from "next/link";
import { getSellerMarketProducts } from "@/app/actions/marketplace";
import MarketProductList from "@/components/MarketProductList";
import { Store, ArrowLeft, PackageX } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SellerMarketplacePage({
  params,
}: {
  params: Promise<{ sellerId: string }>;
}) {
  const { sellerId } = await params;
  const data = await getSellerMarketProducts(sellerId);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="relative overflow-hidden bg-gradient-to-r from-[#023E4A] to-[#0097A7] text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative max-w-7xl mx-auto px-4 pt-32 pb-16 sm:px-6 lg:px-8">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> All companies
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <Store className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-white/70 text-sm font-medium uppercase tracking-wide">Products by</p>
              <h1 className="text-3xl font-bold">{data?.seller.name ?? "Company"}</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        {!data || data.products.length === 0 ? (
          <div className="text-center py-20">
            <PackageX className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {data ? "This company has no products yet." : "Company not found."}
            </p>
          </div>
        ) : (
          <MarketProductList
            products={data.products.map((p) => ({
              id: p.id,
              name: p.name,
              price: p.price,
            }))}
          />
        )}
      </div>
    </div>
  );
}
