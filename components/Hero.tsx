"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface HeroProps {
  products?: any[];
}

export default function Hero({ products = [] }: HeroProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const heroImages = [
    "/images/vertex1.png",
    "/images/vertex2.png",
    "/images/vertex4.jpg.jpeg",
    "/images/vertex5.jpg.jpeg",
    "/images/vertex6.jpg.jpeg",
  ];

  // Change image every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(
        (prevIndex) => (prevIndex + 1) % heroImages.length
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Product ticker
  const tickerItems = products.length >= 2 ? [...products, ...products] : [];
  const animDuration = Math.max(18, products.length * 3.5);

  return (
    <section className="relative min-h-screen overflow-hidden flex items-center justify-center">
      {/* Background Image Carousel */}
      <div className="absolute inset-0">
        {heroImages.map((image, index) => (
          <div
            key={image}
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${
              index === currentImageIndex ? "opacity-100" : "opacity-0"
            }`}
            style={{
              backgroundImage: `url(${image})`,
            }}
          />
        ))}
      </div>

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70" />
      <div className="absolute inset-0 bg-[#D4A017]/10" />

      {/* Product Ticker */}
      {tickerItems.length > 0 && (
        <div className="absolute left-0 top-0 h-full w-36 overflow-hidden z-20 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-black/80 to-transparent z-10" />
          <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black/80 to-transparent z-10" />

          <div
            className="flex flex-col gap-2 px-2 pt-24"
            style={{
              animation: `ticker-down ${animDuration}s linear infinite`,
            }}
          >
            {tickerItems.map((product, i) => {
              const media = Array.isArray(product.media)
                ? product.media[0]
                : product.media;

              const image =
                media?.mainImage || media?.images?.[0] || null;

              return (
                <Link
                  key={i}
                  href={`/product-details?id=${product.id}`}
                  className="pointer-events-auto block bg-white/90 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg hover:bg-white hover:scale-[1.04] active:scale-100 transition-all duration-200 group"
                >
                  {image ? (
                    <div className="relative h-20 w-full overflow-hidden">
                      <Image
                        src={image}
                        alt={product.title}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-20 w-full bg-gradient-to-br from-[#023E4A] to-[#0097A7] flex items-center justify-center">
                      <span className="text-white/50 text-[10px]">
                        No image
                      </span>
                    </div>
                  )}

                  <div className="px-2 py-1.5">
                    <p className="text-[11px] font-semibold text-gray-900 line-clamp-2 leading-tight">
                      {product.title}
                    </p>

                    {product.price != null && (
                      <p className="text-[10px] font-bold text-[#023E4A] mt-0.5">
                        Frw {Number(product.price).toLocaleString()}
                      </p>
                    )}

                    <p className="text-[9px] text-gray-400 mt-0.5 uppercase tracking-wide truncate">
                      {product.subcategory?.replace(/-/g, " ") ??
                        product.category}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Hero Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto mt-[5rem]">
        <h1 className="text-3xl md:text-5xl lg:text-7xl text-[#D4A017] font-bold mb-6 leading-tight">
          VERTEX CONSULTING LTD
        </h1>

        <p className="text-[12px] md:text-[16px] mb-8 max-w-2xl mx-auto">
          Your trusted business partner providing comprehensive management
          consultancy and professional services to drive your organization
          forward.
        </p>

        {/* Indicators */}
        <div className="flex justify-center space-x-2 mt-8">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentImageIndex
                  ? "bg-[#D4A017] w-8"
                  : "bg-white/50 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}