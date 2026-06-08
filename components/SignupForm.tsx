"use client";

import { useState } from "react";
import { useActionState } from "react";
import { signup } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Home,
  Car,
  Utensils,
  Factory,
  Package,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  MapPin,
} from "lucide-react";

const RWANDA_PROVINCES = [
  "Kigali City",
  "Eastern Province",
  "Western Province",
  "Northern Province",
  "Southern Province",
];

const RWANDA_DISTRICTS: Record<string, string[]> = {
  "Kigali City": ["Gasabo", "Kicukiro", "Nyarugenge"],
  "Eastern Province": ["Bugesera", "Gatsibo", "Kayonza", "Kirehe", "Ngoma", "Nyagatare", "Rwamagana"],
  "Western Province": ["Karongi", "Ngororero", "Nyabihu", "Nyamasheke", "Rubavu", "Rutsiro", "Rusizi"],
  "Northern Province": ["Burera", "Gakenke", "Gicumbi", "Musanze", "Rulindo"],
  "Southern Province": ["Gisagara", "Huye", "Kamonyi", "Muhanga", "Nyamagabe", "Nyanza", "Nyaruguru", "Ruhango"],
};

const CATEGORIES = [
  {
    value: "RealEstate",
    label: "Real Estate",
    description: "List properties for rent or sale — apartments, houses, land & working spaces",
    icon: Home,
    color: "from-orange-500 to-orange-600",
    border: "border-orange-300",
    bg: "bg-orange-50",
    ring: "ring-orange-400",
  },
  {
    value: "Vehicles",
    label: "Vehicles",
    description: "List cars, trucks, motorcycles & buses for rent or sale",
    icon: Car,
    color: "from-blue-600 to-blue-700",
    border: "border-blue-300",
    bg: "bg-blue-50",
    ring: "ring-blue-400",
  },
  {
    value: "Food",
    label: "Food & Dining",
    description: "Restaurants, grocery, catering, bakery, food delivery & more",
    icon: Utensils,
    color: "from-red-500 to-red-600",
    border: "border-red-300",
    bg: "bg-red-50",
    ring: "ring-red-400",
  },
  {
    value: "Industry",
    label: "Industry",
    description: "Raw materials and finished industrial products for B2B trade",
    icon: Factory,
    color: "from-slate-600 to-slate-700",
    border: "border-slate-300",
    bg: "bg-slate-50",
    ring: "ring-slate-400",
  },
  {
    value: "OtherProducts",
    label: "Other Products",
    description: "General merchandise, services and anything that doesn't fit above",
    icon: Package,
    color: "from-gray-500 to-gray-600",
    border: "border-gray-300",
    bg: "bg-gray-50",
    ring: "ring-gray-400",
  },
];

const SignupForm = () => {
  const initialState = { success: false, message: "" };
  const [state, formAction, isPending] = useActionState(signup, initialState);
  const [localError, setLocalError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");

  const handleCategorySelect = (value: string) => {
    setSelectedCategory(value);
  };

  const handleNextStep = () => {
    if (!selectedCategory) {
      setLocalError("Please select a category to continue.");
      return;
    }
    setLocalError(null);
    setStep(2);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setLocalError(null);
    const form = e.currentTarget;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const confirmPassword = (form.elements.namedItem("confirmPassword") as HTMLInputElement).value;

    if (password !== confirmPassword) {
      e.preventDefault();
      setLocalError("Passwords do not match.");
      return;
    }
  };

  const selectedCat = CATEGORIES.find((c) => c.value === selectedCategory);

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className={`flex items-center gap-1.5 text-sm font-medium ${step === 1 ? "text-[#F17105]" : "text-green-600"}`}>
          {step > 1 ? <CheckCircle className="w-4 h-4" /> : <span className="w-5 h-5 rounded-full bg-[#F17105] text-white text-xs flex items-center justify-center">1</span>}
          Category
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <div className={`flex items-center gap-1.5 text-sm font-medium ${step === 2 ? "text-[#F17105]" : "text-gray-400"}`}>
          <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${step === 2 ? "bg-[#F17105] text-white" : "bg-gray-200 text-gray-500"}`}>2</span>
          Details & Location
        </div>
      </div>

      {/* Step 1 — Category Selection */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 text-center mb-4">
            Select the category you will mainly use for uploading products
          </p>

          {localError && (
            <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700">{localError}</div>
          )}

          <div className="grid grid-cols-1 gap-3">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => handleCategorySelect(cat.value)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                    isSelected
                      ? `${cat.border} ${cat.bg} ring-2 ${cat.ring}`
                      : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                  }`}
                >
                  <div className={`w-11 h-11 bg-gradient-to-br ${cat.color} text-white rounded-full flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{cat.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">{cat.description}</p>
                  </div>
                  {isSelected && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          <Button
            type="button"
            onClick={handleNextStep}
            disabled={!selectedCategory}
            className="w-full bg-[#F17105] text-white py-3 rounded-lg mt-2 disabled:opacity-50"
          >
            Continue
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <a href="/login" className="text-[#F17105] font-semibold hover:underline">Login</a>
          </p>
        </div>
      )}

      {/* Step 2 — Personal Details */}
      {step === 2 && (
        <form action={formAction} onSubmit={handleSubmit} className="space-y-5">
          {/* Show selected category badge */}
          {selectedCat && (
            <div className={`flex items-center gap-3 p-3 rounded-lg border ${selectedCat.border} ${selectedCat.bg}`}>
              <div className={`w-8 h-8 bg-gradient-to-br ${selectedCat.color} text-white rounded-full flex items-center justify-center flex-shrink-0`}>
                <selectedCat.icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Signing up as</p>
                <p className="font-semibold text-gray-800 text-sm">{selectedCat.label}</p>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-[#F17105] hover:underline"
              >
                Change
              </button>
            </div>
          )}

          <input type="hidden" name="category" value={selectedCategory} />

          {(state.message || localError) && (
            <div className={`p-3 rounded-lg text-sm ${state.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {localError ?? state.message}
            </div>
          )}

          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" name="name" type="text" placeholder="Enter your full name" required disabled={isPending} />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="Enter your email" required disabled={isPending} />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" placeholder="Create a password" autoComplete="new-password" required disabled={isPending} />
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="Repeat your password" autoComplete="new-password" required disabled={isPending} />
          </div>

          {/* Location of selling */}
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-[#F17105]" />
              <span className="text-sm font-semibold text-gray-800">Location of Selling</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="province" className="text-xs text-gray-600">Province</Label>
                <select
                  id="province"
                  name="province"
                  value={province}
                  onChange={(e) => { setProvince(e.target.value); setDistrict(""); }}
                  disabled={isPending}
                  className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F17105] bg-white text-gray-700 disabled:opacity-50"
                >
                  <option value="">Select province</option>
                  {RWANDA_PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="district" className="text-xs text-gray-600">District</Label>
                <select
                  id="district"
                  name="district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  disabled={isPending || !province}
                  className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F17105] bg-white text-gray-700 disabled:opacity-50"
                >
                  <option value="">Select district</option>
                  {(RWANDA_DISTRICTS[province] ?? []).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="sector" className="text-xs text-gray-600">Sector</Label>
                <Input id="sector" name="sector" type="text" placeholder="e.g. Kimironko" disabled={isPending} className="mt-1 text-sm" />
              </div>

              <div>
                <Label htmlFor="zone" className="text-xs text-gray-600">Zone / Neighborhood</Label>
                <Input id="zone" name="zone" type="text" placeholder="e.g. Zone A" disabled={isPending} className="mt-1 text-sm" />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              disabled={isPending}
              className="px-4"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1 bg-[#F17105] text-white py-3 rounded-lg">
              {isPending ? "Creating account..." : "Create Account"}
            </Button>
          </div>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <a href="/login" className="text-[#F17105] font-semibold hover:underline">Login</a>
          </p>
        </form>
      )}
    </div>
  );
};

export default SignupForm;
