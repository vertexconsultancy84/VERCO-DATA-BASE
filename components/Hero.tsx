"use client";

import { useState, useEffect } from "react";

export default function Hero() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Array of images for the carousel
  const heroImages = [
    "/images/vertex1.png",
    "/images/vertex2.png", 
    "/images/vertex4.jpg.jpeg",
    "/images/vertex5.jpg.jpeg",
    "/images/vertex6.jpg.jpeg",
  ];

  // Auto-advance images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 24 * 60 * 60 * 1000); // Change image every 24 hours (24 * 60 * 60 * 1000 milliseconds)

    return () => clearInterval(interval);
  }, [heroImages.length]);

  return (
    <section className="relative min-h-screen overflow-hidden flex items-center justify-center">
      {/* Animated Image Carousel Background */}
      <div className="absolute inset-0">
        <div className="relative w-full h-full">
          {/* Current Image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-in-out"
            style={{ backgroundImage: `url(${heroImages[currentImageIndex]})` }}
          />

          {/* Next Image (sliding in from right) */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transform translate-x-full transition-transform duration-1000 ease-in-out"
            style={{
              backgroundImage: `url(${heroImages[(currentImageIndex + 1) % heroImages.length]})`,
              animation: "slideInFromRight 86400000ms infinite" // 24 hours in milliseconds (24 * 60 * 60 * 1000)
            }}
          />

          {/* Additional sliding images for continuous effect */}
          {heroImages.slice(2).map((image, index) => (
            <div
              key={index}
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-0"
              style={{
                backgroundImage: `url(${image})`,
                animation: `slideInFromRight ${86400000 * (index + 2)}ms infinite` // 24 hours * (index + 2)
              }}
            />
          ))}
        </div>
      </div>

      {/* Enhanced overlay with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70"></div>
      <div className="absolute inset-0 bg-[#F17105]/10"></div>

      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto mt-[5rem]">
        <h1 className="text-3xl md:text-5xl lg:text-7xl text-[#F17105] font-bold mb-6 leading-tight animate-fadeInUp animation-delay-800">
          VERTEX CONSULTING LTD
        </h1>
        <p className="text-[12px] md:text-[16px] mb-8 max-w-2xl mx-auto animate-fadeInUp animation-delay-1000">
          Your trusted business partner providing comprehensive management
          consultancy and professional services to drive your organization
          forward.
        </p>

        {/* Image Indicators */}
        <div className="flex justify-center space-x-2 mt-8">
          {heroImages.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentImageIndex
                  ? 'bg-[#F17105] w-8'
                  : 'bg-white/50 hover:bg-white/70'
                }`}
              onClick={() => setCurrentImageIndex(index)}
            />
          ))}
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes slideInFromRight {
          0% {
            transform: translateX(100%);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          25% {
            transform: translateX(0);
            opacity: 1;
          }
          90% {
            transform: translateX(0);
            opacity: 1;
          }
          100% {
            transform: translateX(-100%);
            opacity: 0;
          }
        }
      `}</style>
    </section>
  );
}
