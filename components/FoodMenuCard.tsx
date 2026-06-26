"use client";

import Image from "next/image";
import Link from "next/link";

interface FoodMenuProduct {
  id: string;
  title: string;
  price?: number | null;
  category: string;
  subcategory?: string | null;
  media?:
    | { images?: string[]; mainImage?: string | null }
    | Array<{ images?: string[]; mainImage?: string | null }>
    | null;
  image?: string;
  mainImage?: string;
  images?: string[];
}

interface FoodMenuCardProps {
  product: FoodMenuProduct;
}

// Soft, multi-point "burst" badge that holds the price — mirrors the menu mockup.
function PriceBurst({ amount }: { amount?: number | null }) {
  const spikes = 14;
  const cx = 50;
  const cy = 50;
  const outer = 49;
  const inner = 41;
  const points: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI / spikes) * i - Math.PI / 2;
    points.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`);
  }
  const value =
    amount == null ? "—" : amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return (
    <div className="absolute -top-3 -right-2 z-20 h-20 w-20 drop-shadow-md">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <polygon points={points.join(" ")} fill="#5a6b8c" stroke="#cbd5e1" strokeWidth="2" strokeLinejoin="round" />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center leading-none text-white">
        <span className="text-[10px] font-semibold uppercase tracking-wide opacity-90">RWF</span>
        <span className="font-bold text-sm tracking-tight">{value}</span>
      </span>
    </div>
  );
}

function resolveImage(product: FoodMenuProduct): string | null {
  const media = Array.isArray(product.media) ? product.media[0] : product.media;
  let url: string | null =
    media?.mainImage ||
    (media?.images && media.images[0]) ||
    product.image ||
    product.mainImage ||
    (product.images && product.images[0]) ||
    null;

  if (url) {
    url = url.replace(".jpg.jpg", ".jpg").replace(".mp4.mp4", ".mp4");
  }
  return url;
}

export default function FoodMenuCard({ product }: FoodMenuCardProps) {
  const imageUrl = resolveImage(product);

  const handleBuyNow = () => {
    window.dispatchEvent(
      new CustomEvent("addToCart", {
        detail: {
          productId: product.id,
          productTitle: product.title,
          productPrice: product.price || 0,
          category: product.category,
          subcategory: product.subcategory,
          image: imageUrl ?? undefined,
          quantity: 1,
        },
      })
    );
  };

  return (
    <div className="relative flex flex-col items-center">
      {/* Dish photo */}
      <div className="relative z-10 w-full">
        <Link href={`/product-details?id=${product.id}`} className="block">
          <div className="relative mx-auto h-44 w-44 overflow-hidden rounded-full bg-white shadow-lg ring-4 ring-white/70">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={product.title}
                fill
                className="object-cover transition-transform duration-300 hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                <span className="text-3xl">🍽️</span>
              </div>
            )}
          </div>
        </Link>
        <PriceBurst amount={product.price} />
      </div>

      {/* Info panel */}
      <div className="-mt-8 w-full rounded-2xl bg-[#eceaf4] px-4 pb-4 pt-12 text-center shadow-md">
        <h3 className="mb-2 font-serif text-lg font-semibold italic text-gray-800 line-clamp-2 min-h-[3.5rem] flex items-center justify-center">
          {product.title}
        </h3>
        <button
          type="button"
          onClick={handleBuyNow}
          className="text-base font-bold italic text-gray-700 underline-offset-4 transition-colors hover:text-orange-600 hover:underline"
        >
          BUY NOW
        </button>
      </div>
    </div>
  );
}
