"use client";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

interface TeamMember {
  id: string;
  name: string;
  position: string;
  image: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export default function AboutUsSection() {
  const [teamworkers, setTeamworkers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/team');
      const data = await response.json();
      
      if (data.success) {
        setTeamworkers(data.data || []);
      } else {
        console.error('Failed to fetch team members:', data.message);
        // Fallback to hardcoded data if API fails
        setTeamworkers([
          {
            id: "1",
            name: "IRADUKUNDA Stiven",
            position: "Chief Executive Officer",
            image: "/images/worker1.jpg?height=400&width=300",
            order: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "2",
            name: "GUSENGA Benjamin",
            position: "Project Manager",
            image: "/images/worker2.jpg?height=400&width=300",
            order: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "3",
            name: "AKIMANIMPAYE Rachel",
            position: "Secretary",
            image: "/images/worker3.jpg?height=400&width=300",
            order: 2,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "4",
            name: "MASENGESHO Bertin",
            position: "Accountant",
            image: "/images/worker4.jpg?height=400&width=300",
            order: 3,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "5",
            name: "NIRAGIRE Magnifique",
            position: "IT Specialist",
            image: "/images/worker5.jpg?height=400&width=300",
            order: 4,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "6",
            name: "Sostene BANANAYO",
            position: "Developer",
            image: "/images/profile.jpg?height=400&width=300",
            order: 5,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const [isVisible, setIsVisible] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const sectionRef = useRef(null);
  const autoplayRef = useRef(
    Autoplay({
      delay: 2000,
      stopOnInteraction: true,
      stopOnMouseEnter: true,
    })
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setAnimationKey((prev) => prev + 1);
        } else {
          setIsVisible(false);
        }
      },
      {
        threshold: 0.2,
        rootMargin: "-50px 0px",
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <section
        ref={sectionRef}
        id="about"
        className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Loading Team...
            </h2>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      id="about"
      className="bg-white pt-12 pb-4 px-[3rem] sm:px-[3rem] md:px-[3rem] lg:px-[4rem]"
    >
      <div className="max-w-7xl mx-auto">
        {/* Top Section */}
        <div
          key={`title-${animationKey}`}
          className={`flex justify-center items-center mb-5 font-bold text-[#0066FF] text-2xl transition-all duration-800 ${
            isVisible
              ? "animate-fadeInUp animation-delay-200"
              : "opacity-0 translate-y-[30px]"
          }`}
        >
          <h1>About Us</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 pb-4 gap-2 md:gap-6 items-center mb-6 md:mb-8">
          <div
            key={`left-${animationKey}`}
            className={`space-y-4 md:space-y-6 font-sans transition-all duration-1000 ${
              isVisible ? "animate-fadeInLeft" : "opacity-0 translate-x-[-50px]"
            }`}
          >
            <div>
              <div
                key={`badge-${animationKey}`}
                className={`inline-block bg-[#F17105]/20 text-gray-700 px-4 py-2 rounded-full text-[12px] font-medium mb-4 hover:bg-[#F17105]/30 transition-all duration-800 ${
                  isVisible
                    ? "animate-fadeInUp animation-delay-400"
                    : "opacity-0 translate-y-[30px]"
                }`}
              >
                WHO WE ARE
              </div>
              <h2
                key={`heading1-${animationKey}`}
                className={`text-sm md:text-xl lg:text-2xl font-semibold text-[#F17105] leading-tight transition-all duration-800 ${
                  isVisible
                    ? "animate-fadeInUp animation-delay-600"
                    : "opacity-0 translate-y-[30px]"
                }`}
              >
                DELIVERING{" "}
                <span className="text-[#F17105]/50">PROFESSIONAL</span>
              </h2>
              <h2
                key={`heading2-${animationKey}`}
                className={`text-sm md:text-xl lg:text-2xl font-semibold text-[#F17105]/50 leading-tight mb-4 transition-all duration-800 ${
                  isVisible
                    ? "animate-fadeInUp animation-delay-700"
                    : "opacity-0 translate-y-[30px]"
                }`}
              >
                CONSULTING <span className="text-[#F17105]">SERVICES</span>
              </h2>
            </div>
            <div
              key={`description-${animationKey}`}
              className={`text-[#4B584F] text-[12px] leading-relaxed max-w-lg transition-all duration-800 ${
                isVisible
                  ? "animate-fadeInUp animation-delay-800"
                  : "opacity-0 translate-y-[30px]"
              }`}
            >
              <p>
                Since our establishment, VERTEX CONSULTING Ltd has been
                providing comprehensive management consultancy services to
                organizations across various sectors. From strategic business
                planning to operational excellence, manufacturing solutions, and
                global trade facilitation, we combine expertise and innovation
                to help you achieve sustainable growth. Whether you're a
                startup, established business, or government institution, VERTEX
                CONSULTING is your trusted partner in building efficient and
                profitable operations.
              </p>
            </div>
          </div>
          <div
            key={`right-${animationKey}`}
            className={`relative flex justify-center lg:justify-end transition-all duration-1000 ${
              isVisible ? "animate-fadeInRight" : "opacity-0 translate-x-[50px]"
            }`}
          >
            <div className="relative w-full max-w-md lg:max-w-lg">
              <div className="flex items-center justify-center animate-pulse-slow">
                <img
                  src="/images/logo.jpg"
                  alt="VERTEX CONSULTING Logo"
                  className="w-48 h-48 md:w-60 md:h-60 lg:w-72 lg:h-72 rounded-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* OUR TEAM */}
        <div
          key={`team-${animationKey}`}
          className={`bg-[#F17105]/50 rounded-lg shadow-lg mb-2 md:mb-4 transition-all duration-1000 ${
            isVisible
              ? "animate-fadeInUp animation-delay-1000"
              : "opacity-0 translate-y-[50px]"
          }`}
        >
          <div className="text-center py-5">
            <h2
              key={`team-title-${animationKey}`}
              className={`text-1xl font-bold text-[#F17105] transition-all duration-800 ${
                isVisible
                  ? "animate-fadeInUp animation-delay-1200"
                  : "opacity-0 translate-y-[30px]"
              }`}
            >
              OUR <span className="text-[#F17105]/50">TEAM</span>
            </h2>
          </div>
          <div className="px-8 pb-8">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              plugins={[autoplayRef.current]}
              className="w-full"
              onMouseEnter={() => autoplayRef.current.stop()}
              onMouseLeave={() => autoplayRef.current.play()}
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {teamworkers.map((worker, index) => (
                  <CarouselItem
                    key={worker.id}
                    className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3"
                  >
                    <Card
                      key={`card-${worker.id}-${animationKey}`}
                      className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-800 ${
                        isVisible
                          ? "animate-fadeInUp"
                          : "opacity-0 translate-y-[50px]"
                      }`}
                      style={{
                        animationDelay: `${1400 + index * 100}ms`,
                        transitionDelay: isVisible
                          ? `${1400 + index * 100}ms`
                          : "0ms",
                      }}
                    >
                      <div className="w-full h-48 overflow-hidden relative group">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                        <div className="absolute inset-0 bg-[#F17105]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                        <img
                          src={worker.image || "/placeholder.svg"}
                          alt={worker.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <CardContent className="p-3">
                        <h3 className="text-[12px] font-semibold text-gray-800 group-hover:text-[#F17105] transition-colors">
                          {worker.name}
                        </h3>
                        <p className="text-[10px] text-gray-600 mb-3">
                          {worker.position}
                        </p>
                        <div className="flex justify-end">
                          <div className="bg-[#F17105] text-white w-6 h-6 flex items-center justify-center rounded-full hover:bg-[#F17105]/80 hover:scale-110 transition-all duration-300 cursor-pointer text-xs shadow-lg">
                            f
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2 hover:scale-110 transition-transform" />
              <CarouselNext className="right-2 hover:scale-110 transition-transform" />
            </Carousel>
          </div>
        </div>
      </div>
    </section>
  );
}
