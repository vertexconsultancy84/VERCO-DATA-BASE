"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  CircleCheckBig,
} from "lucide-react";
import { useActionState } from "react";
import { registerInterest } from "@/app/actions/register"; // Import the new Server Action

const services = [
  "Management Consultancy",
  "Business Strategy Development",
  "Wholesale Trade",
  "Cargo Handling",
  "Food Delivery",
  "Real Estate Services for Sale and rent",
  "Construction Services",
  "Interior Design",
  "Transportation Services",
  "Photography & Videography",
  "Digital Marketing",
  "Accounting Services",
  "Consulting Services",
  "Training & Education",
  "Logistics & Supply Chain",
  "Tax consultation",
  "Product Pricing Strategy",
   "Other Services",
];

export default function HomeServices() {
  const [isVisible, setIsVisible] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const sectionRef = useRef(null);

  // Initial state for useActionState
  const initialState = {
    success: false,
    message: "",
    errors: {} as {
      companyName?: string[];
      email?: string[];
      tinNumber?: string[];
      phoneNumber?: string[];
      location?: string[];
      selectedServices?: string[];
    },
  };

  const [state, formAction, isPending] = useActionState(
    registerInterest,
    initialState
  );

  const [selectedServicesState, setSelectedServicesState] = useState<string[]>(
    []
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

  useEffect(() => {
    if (state.success) {
      setSelectedServicesState([]);
    }
  }, [state.success]);

  const handleServiceToggle = (service: string) => {
    setSelectedServicesState((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  return (
    <section
      ref={sectionRef}
      className="py-16 px-[3rem] sm:px-[3rem] md:px-[3rem] lg:px-[4rem] bg-white"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div
          key={`header-${animationKey}`}
          className={`text-center mb-12 transition-all duration-1000 ${
            isVisible ? "animate-fadeInUp" : "opacity-0 translate-y-[30px]"
          }`}
        >
          <h2
            key={`title-${animationKey}`}
            className={`text-2xl md:text-3xl font-bold text-[#0066FF] mb-4 transition-all duration-800 ${
              isVisible
                ? "animate-fadeInUp animation-delay-200"
                : "opacity-0 translate-y-[30px]"
            }`}
          >
            Our Services
          </h2>
          <p
            key={`subtitle-${animationKey}`}
            className={`text-gray-600 text-lg max-w-2xl mx-auto transition-all duration-800 ${
              isVisible
                ? "animate-fadeInUp animation-delay-400"
                : "opacity-0 translate-y-[30px]"
            }`}
          >
            Comprehensive consulting solutions tailored to your business needs
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-4 items-start">
          {/* Services List */}
          <div
            key={`services-${animationKey}`}
            className={`transition-all duration-1000 ${
              isVisible
                ? "animate-fadeInLeft animation-delay-600"
                : "opacity-0 translate-x-[-50px]"
            }`}
          >
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200 h-full flex flex-col">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
                Available Services
              </h3>

              {/* Services Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                {services.map((service, index) => (
                  <div className="flex items-center gap-2 group p-2 rounded hover:bg-gray-100 transition-colors duration-300" key={index}>
                    <CircleCheckBig className="w-4 h-4 text-[#0066FF] flex-shrink-0" />
                    <h4 className="text-gray-800 font-medium text-xs sm:text-sm group-hover:text-[#F17105] transition-colors duration-300 flex-1">
                      {service}
                    </h4>
                    <div className="w-2 h-2 bg-[#F17105] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0"></div>
                  </div>
                ))}
              </div>

              {/* Button at Bottom */}
              <div
                key={`button-${animationKey}`}
                className={`text-center transition-all duration-1000 ${
                  isVisible
                    ? "animate-fadeInUp animation-delay-1400"
                    : "opacity-0 translate-y-[30px]"
                }`}
              >
                <Link href="/services">
                  <Button className="bg-[#F17105] hover:bg-[#F17105]/90 text-white px-4 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl w-full sm:w-auto">
                    View All Services Details
                    <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Registration Form */}
          <div
            key={`form-${animationKey}`}
            className={`transition-all duration-1000 ${
              isVisible
                ? "animate-fadeInRight animation-delay-800"
                : "opacity-0 translate-x-[50px]"
            }`}
          >
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200 shadow-lg">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">
                Register Your Interest
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm mb-4 sm:mb-6">
                Fill out the form below to get started with our consulting
                services. We will contact you shortly.
              </p>

              <form action={formAction} className="space-y-5">
                <div>
                  <Input
                    name="companyName"
                    type="text"
                    placeholder="Company/User Name *"
                    required
                    disabled={isPending}
                    className="w-full h-11 px-4 border text-base border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F17105] focus:border-transparent transition-all duration-200"
                  />
                  {state.errors?.companyName && (
                    <p className="text-red-500 text-sm mt-1">
                      {state.errors.companyName[0]}
                    </p>
                  )}
                </div>

                <div>
                  <Input
                    name="email"
                    type="email"
                    placeholder="Email Address *"
                    required
                    disabled={isPending}
                    className="w-full h-11 px-4 border text-base border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F17105] focus:border-transparent transition-all duration-200"
                  />
                  {state.errors?.email && (
                    <p className="text-red-500 text-sm mt-1">
                      {state.errors.email[0]}
                    </p>
                  )}
                </div>

                <div>
                  <Input
                    name="tinNumber"
                    type="text"
                    placeholder="TIN Number *"
                    required
                    disabled={isPending}
                    className="w-full h-11 px-4 border text-base border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F17105] focus:border-transparent transition-all duration-200"
                  />
                  {state.errors?.tinNumber && (
                    <p className="text-red-500 text-sm mt-1">
                      {state.errors.tinNumber[0]}
                    </p>
                  )}
                </div>

                <div>
                  <Input
                    name="phoneNumber"
                    type="tel"
                    placeholder="Phone Number *"
                    required
                    disabled={isPending}
                    className="w-full h-11 px-4 border text-base border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F17105] focus:border-transparent transition-all duration-200"
                  />
                  {state.errors?.phoneNumber && (
                    <p className="text-red-500 text-sm mt-1">
                      {state.errors.phoneNumber[0]}
                    </p>
                  )}
                </div>

                <div>
                  <Input
                    name="location"
                    type="text"
                    placeholder="Location *"
                    required
                    disabled={isPending}
                    className="w-full h-11 px-4 border text-base border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F17105] focus:border-transparent transition-all duration-200"
                  />
                  {state.errors?.location && (
                    <p className="text-red-500 text-sm mt-1">
                      {state.errors.location[0]}
                    </p>
                  )}
                </div>

                {/* Services Selection */}
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-4">
                    Select Services You Need *
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-4 bg-white shadow-inner">
                    {services.map((service) => (
                      <label
                        key={service}
                        className="flex items-center space-x-3 mb-3 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          name="selectedServices" // Important for FormData
                          value={service} // Important for FormData
                          checked={selectedServicesState.includes(service)}
                          onChange={() => handleServiceToggle(service)}
                          disabled={isPending}
                          className="w-5 h-5 text-[#F17105] border-gray-300 rounded focus:ring-[#F17105] accent-[#F17105]"
                        />
                        <span className="text-base text-gray-800">
                          {service}
                        </span>
                      </label>
                    ))}
                  </div>
                  {state.errors?.selectedServices && (
                    <p className="text-red-500 text-sm mt-1">
                      {state.errors.selectedServices[0]}
                    </p>
                  )}
                </div>

                {/* Status Message */}
                {state.message && (
                  <div
                    className={`flex items-center space-x-2 p-3 rounded-lg text-sm ${
                      state.success
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {state.success ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    <span>{state.message}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isPending || selectedServicesState.length === 0}
                  className="w-full bg-[#F17105] hover:bg-[#F17105]/90 text-white font-semibold rounded-lg py-3 text-lg hover:scale-[1.01] transition-all duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isPending ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    "Register Interest"
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
