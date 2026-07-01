"use client";

import { useState, useRef } from "react";
import { createProduct } from "@/app/actions/product";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MapPin, Upload, X, Building, FileText, Image as ImageIcon,
  Phone, PackageCheck, Tag, CheckCircle2, Sparkles, Navigation,
  Check, ChevronLeft, ChevronRight, ClipboardCheck,
} from "lucide-react";

// Matches view-products page categories exactly
const realEstateSubcategories = {
  "for-rent": "For Rent",
  "for-sale": "For Sale"
};

const forRentPropertyTypes = {
  apartment: "Apartment",
  "working-space": "Working Space",
  "home-less-than-3": "Home (< 3 chambers, especially students)",
  "home-greater-than-3": "Home (> 3 chambers)"
};

const forSalePropertyTypes = {
  "house-for-sale": "House for Sale",
  "land-for-building": "Land for Building (IBIBANZA)"
};

const foodSubcategories = {
  restaurant: "Restaurant",
  grocery: "Grocery",
  catering: "Catering",
  "food-delivery": "Food Delivery",
  bakery: "Bakery",
  "other-food": "Other Food"
};

const industrySubcategories = {
  "finished-products": "Finished Products"
};

const otherProductsSubcategories = {
  supermarket: "Supermarket",
};

const vehicleTypes = {
  taxi: "Taxi",
  truck: "Truck / Pickup",
  van: "Van / Minibus",
  bus: "Bus / Coach",
  motorcycle: "Motorcycle"
};

// Reusable section wrapper — gives the form a clean, grouped, card-based look.
// Defined at module level (not inside the component) so inputs never remount.
function FormSection({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-gradient-to-b from-gray-50/80 to-white p-5 sm:p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#023E4A] to-[#0097A7] flex items-center justify-center shrink-0 shadow-sm">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-gray-900 leading-tight">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

// Wizard step definitions — drives the stepper header and section visibility.
const STEPS = [
  { id: 1, title: "Details", desc: "Product info" },
  { id: 2, title: "Media", desc: "Photos" },
  { id: 3, title: "Location", desc: "Where it is" },
  { id: 4, title: "Logistics", desc: "Availability & contact" },
  { id: 5, title: "Review", desc: "Confirm & submit" },
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  RealEstate: "Real Estate",
  Vehicles: "Vehicles",
  Food: "Food & Dining",
  Industry: "Industry",
  OtherProducts: "Other Products",
};

const prettify = (slug?: string) =>
  slug ? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";

// Horizontal progress stepper. Full labels on sm+, compact dots on mobile.
function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center">
      {STEPS.map((s, i) => {
        const done = current > s.id;
        const active = current === s.id;
        return (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center text-center shrink-0">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                  active
                    ? "bg-[#0097A7] border-[#0097A7] text-white shadow-sm"
                    : done
                    ? "bg-[#023E4A] border-[#023E4A] text-white"
                    : "bg-white border-gray-300 text-gray-400"
                }`}
              >
                {done ? <Check className="w-4 h-4" /> : s.id}
              </div>
              <div className="mt-1.5 hidden sm:block">
                <p className={`text-xs font-semibold leading-tight ${active || done ? "text-[#023E4A]" : "text-gray-400"}`}>
                  {s.title}
                </p>
                <p className="text-[10px] text-gray-400 leading-tight">{s.desc}</p>
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 sm:mx-3 rounded transition-colors ${done ? "bg-[#023E4A]" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Small label/value row used in the Review step summary.
function ReviewRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-900 font-medium text-right break-words min-w-0">
        {value || <span className="text-gray-400 font-normal">—</span>}
      </span>
    </div>
  );
}

interface SimpleEnhancedProductUploadFormProps {
  onSuccess?: () => void;
  initialData?: any;
  onCancel?: () => void;
  defaultCategory?: string;
  defaultPrice?: number;
}

export default function SimpleEnhancedProductUploadForm({ onSuccess, initialData, onCancel, defaultCategory, defaultPrice }: SimpleEnhancedProductUploadFormProps) {
  const isEditMode = !!initialData;
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [previewImages, setPreviewImages] = useState<string[]>(initialData?.media?.images || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isAvailable, setIsAvailable] = useState(initialData?.available !== false);
  const [contactNumber, setContactNumber] = useState(initialData?.contactNumber || "");
  const [whatsappNumber, setWhatsappNumber] = useState(initialData?.whatsappNumber || "");
  const [category, setCategory] = useState(initialData?.category || defaultCategory || "OtherProducts");
  const [subcategory, setSubcategory] = useState(initialData?.subcategory || "");
  const [propertyType, setPropertyType] = useState(initialData?.propertyType || "");
  const [ownerFullName, setOwnerFullName] = useState(initialData?.ownerFullName || "");
  const [ownerNationality, setOwnerNationality] = useState(initialData?.ownerNationality || "");
  const [ownerID, setOwnerID] = useState(initialData?.ownerID || "");
  const [ownerAddress, setOwnerAddress] = useState(initialData?.ownerAddress || "");
  const [isDragging, setIsDragging] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Reads current values of the uncontrolled inputs (used by the Review step).
  const readSnapshot = () => {
    const f = formRef.current;
    const get = (name: string) =>
      ((f?.elements.namedItem(name) as HTMLInputElement | null)?.value || "").trim();
    return {
      title: get("title"),
      description: get("description"),
      price: get("price"),
      province: get("province"),
      district: get("district"),
      sector: get("sector"),
      village: get("village"),
      zone: get("zone"),
      latitude: get("latitude"),
      longitude: get("longitude"),
    };
  };

  // Step 1 holds the only required fields — validate before advancing/submitting.
  const validateDetails = () => {
    const { title, description } = readSnapshot();
    if (!title) {
      setError("Please enter a product title.");
      return false;
    }
    if (!description) {
      setError("Please enter a product description.");
      return false;
    }
    setError("");
    return true;
  };

  const goNext = () => {
    if (currentStep === 1 && !validateDetails()) {
      setCurrentStep(1);
      return;
    }
    setError("");
    setCurrentStep((s) => Math.min(STEPS.length, s + 1));
  };

  const goBack = () => {
    setError("");
    setCurrentStep((s) => Math.max(1, s - 1));
  };

  const processFiles = (files: FileList | File[]) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    Array.from(files).forEach(file => {
      if (allowedTypes.includes(file.type) && file.size <= 5 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          setPreviewImages(prev => [...prev, result]);
        };
        reader.readAsDataURL(file);
      } else {
        alert(`Invalid image file or size too large. Please use JPEG, PNG, GIF, or WebP under 5MB.`);
      }
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    processFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) processFiles(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
    if (mainImageIndex === index) {
      setMainImageIndex(0);
    }
  };

  const setAsMainImage = (index: number) => {
    setMainImageIndex(index);
  };

  const handleLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latInput = document.getElementById('latitude') as HTMLInputElement;
          const lngInput = document.getElementById('longitude') as HTMLInputElement;
          if (latInput) latInput.value = position.coords.latitude.toString();
          if (lngInput) lngInput.value = position.coords.longitude.toString();
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Unable to get your location. Please enter coordinates manually.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const dataUrlToFile = async (dataUrl: string, filename: string, mimeType: string): Promise<File> => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return new File([blob], filename, { type: mimeType });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // The form only finalizes on the Review step — earlier steps just advance.
    if (currentStep < STEPS.length) {
      goNext();
      return;
    }

    if (!validateDetails()) {
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const formData = new FormData(e.currentTarget);
      let result;

      if (isEditMode) {
        // In edit mode use the plain-object path — no file conversion needed
        const { updateProduct } = await import("@/app/actions/product");

        const updateData: any = {
          title: formData.get("title") as string,
          description: formData.get("description") as string,
          category,
          subcategory,
          propertyType,
          price: formData.get("price") ? parseFloat(formData.get("price") as string) : null,
          latitude: formData.get("latitude") ? parseFloat(formData.get("latitude") as string) : null,
          longitude: formData.get("longitude") ? parseFloat(formData.get("longitude") as string) : null,
          province: formData.get("province") as string,
          district: formData.get("district") as string,
          sector: formData.get("sector") as string,
          village: formData.get("village") as string,
          zone: formData.get("zone") as string,
          available: isAvailable,
          contactNumber,
          whatsappNumber,
          ownerFullName,
          ownerNationality,
          ownerID,
          ownerAddress,
          images: previewImages,
          videos: [],
        };

        result = await updateProduct(initialData.id, updateData);
      } else {
        // In create mode convert data-URLs to File objects and POST to the upload API
        for (let i = 0; i < previewImages.length; i++) {
          const file = await dataUrlToFile(previewImages[i], `image_${i}.jpg`, "image/jpeg");
          formData.append("image", file);
        }
        const response = await fetch("/api/upload", { method: "POST", body: formData });
        result = await response.json();
      }

      if (result.success) {
        setSuccess(isEditMode ? "Product updated successfully!" : "Product uploaded successfully!");
        setError("");

        if (!isEditMode) {
          setPreviewImages([]);
          setMainImageIndex(0);
          setCurrentStep(1);
        }

        window.dispatchEvent(
          new CustomEvent("productUpdated", {
            detail: {
              action: isEditMode ? "updated" : "created",
              productId: isEditMode ? initialData.id : result.productId,
            },
          })
        );

        setTimeout(() => setSuccess(""), 5000);
        onSuccess?.();
      } else {
        setError(result.message || "Something went wrong");
        setSuccess("");
      }
    } catch (err) {
      console.error("Operation error:", err);
      setError(`Failed to ${isEditMode ? "update" : "upload"} product. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const snap = currentStep === STEPS.length ? readSnapshot() : null;

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">

      {/* ── Stepper header ───────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
        <Stepper current={currentStep} />
        <p className="sm:hidden mt-3 text-center text-sm font-semibold text-[#023E4A]">
          Step {currentStep} of {STEPS.length} — {STEPS[currentStep - 1].title}
        </p>
      </div>

      {/* ── Step 1 · Product Details ─────────────────────────────── */}
      <div className={currentStep === 1 ? "" : "hidden"}>
      {/* ── Product Details ─────────────────────────────────────── */}
      <FormSection icon={FileText} title="Product Details" subtitle="The essentials buyers will see first">
        <div className="space-y-5">
          {/* Title */}
          <div>
            <Label htmlFor="title">Product Title</Label>
            <Input
              id="title"
              name="title"
              type="text"
              placeholder="Enter product title"
              defaultValue={initialData?.title}
              className="w-full mt-1.5"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe your product..."
              defaultValue={initialData?.description}
              rows={4}
              className="w-full resize-none mt-1.5"
            />
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">Product Category</Label>
            <Select value={category} onValueChange={(value) => {
              setCategory(value);
              setSubcategory("");
              setPropertyType("");
            }} disabled={isSubmitting}>
              <SelectTrigger className="w-full mt-1.5">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RealEstate">🏠 Real Estate</SelectItem>
                <SelectItem value="Vehicles">🚗 Vehicles</SelectItem>
                <SelectItem value="Food">🍽️ Food & Dining</SelectItem>
                <SelectItem value="Industry">🏭 Industry</SelectItem>
                <SelectItem value="OtherProducts">📦 Other Products</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 mt-2">
              Select category that best describes your product or service
            </p>
            <input type="hidden" name="category" value={category} />
          </div>

          {/* Subcategory — Real Estate */}
          {category === "RealEstate" && (
            <div>
              <Label htmlFor="subcategory">Property Intent</Label>
              <Select value={subcategory} onValueChange={(v) => { setSubcategory(v); setPropertyType(""); }} disabled={isSubmitting}>
                <SelectTrigger className="w-full mt-1.5">
                  <SelectValue placeholder="For Rent or For Sale?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="for-rent">🔑 For Rent</SelectItem>
                  <SelectItem value="for-sale">🏷️ For Sale</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">Is this property for rent or for sale?</p>
              <input type="hidden" name="subcategory" value={subcategory} />
            </div>
          )}

          {/* Property Type — For Rent */}
          {category === "RealEstate" && subcategory === "for-rent" && (
            <div>
              <Label htmlFor="propertyType">Property Type</Label>
              <Select value={propertyType} onValueChange={setPropertyType} disabled={isSubmitting}>
                <SelectTrigger className="w-full mt-1.5">
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">🏢 Apartment</SelectItem>
                  <SelectItem value="working-space">💼 Working Space</SelectItem>
                  <SelectItem value="home-less-than-3">🏠 Home (&lt; 3 chambers, especially students)</SelectItem>
                  <SelectItem value="home-greater-than-3">🏠 Home (&gt; 3 chambers)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">What type of property is available for rent?</p>
              <input type="hidden" name="propertyType" value={propertyType} />
            </div>
          )}

          {/* Property Type — For Sale */}
          {category === "RealEstate" && subcategory === "for-sale" && (
            <div>
              <Label htmlFor="propertyType">Property Type</Label>
              <Select value={propertyType} onValueChange={setPropertyType} disabled={isSubmitting}>
                <SelectTrigger className="w-full mt-1.5">
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="house-for-sale">🏡 House for Sale</SelectItem>
                  <SelectItem value="land-for-building">🏗️ Land for Building (IBIBANZA)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">What type of property is for sale?</p>
              <input type="hidden" name="propertyType" value={propertyType} />
            </div>
          )}

          {/* Subcategory — Vehicles */}
          {category === "Vehicles" && (
            <div>
              <Label htmlFor="subcategory">Vehicle Intent</Label>
              <Select value={subcategory} onValueChange={(v) => { setSubcategory(v); setPropertyType(""); }} disabled={isSubmitting}>
                <SelectTrigger className="w-full mt-1.5">
                  <SelectValue placeholder="For Rent or For Sale?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="for-rent">🔑 For Rent</SelectItem>
                  <SelectItem value="for-sale">🏷️ For Sale</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">Is this vehicle for rent or for sale?</p>
              <input type="hidden" name="subcategory" value={subcategory} />
            </div>
          )}

          {/* Vehicle Type */}
          {category === "Vehicles" && subcategory && (
            <div>
              <Label htmlFor="propertyType">Vehicle Type</Label>
              <Select value={propertyType} onValueChange={setPropertyType} disabled={isSubmitting}>
                <SelectTrigger className="w-full mt-1.5">
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(vehicleTypes).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">Select the specific vehicle type</p>
              <input type="hidden" name="propertyType" value={propertyType} />
            </div>
          )}

          {/* Subcategory — Food */}
          {category === "Food" && (
            <div>
              <Label htmlFor="subcategory">Food Type</Label>
              <Select value={subcategory} onValueChange={setSubcategory} disabled={isSubmitting}>
                <SelectTrigger className="w-full mt-1.5">
                  <SelectValue placeholder="Select food type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(foodSubcategories).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">Select the specific food category</p>
              <input type="hidden" name="subcategory" value={subcategory} />
            </div>
          )}

          {/* Subcategory — Industry */}
          {category === "Industry" && (
            <div>
              <Label htmlFor="subcategory">Industry Type</Label>
              <Select value={subcategory} onValueChange={setSubcategory} disabled={isSubmitting}>
                <SelectTrigger className="w-full mt-1.5">
                  <SelectValue placeholder="Select industry type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(industrySubcategories).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">Industry finished product</p>
              <input type="hidden" name="subcategory" value={subcategory} />
            </div>
          )}

          {/* Subcategory — Other Products */}
          {category === "OtherProducts" && (
            <div>
              <Label htmlFor="subcategory">Product Type</Label>
              <Select value={subcategory} onValueChange={setSubcategory} disabled={isSubmitting}>
                <SelectTrigger className="w-full mt-1.5">
                  <SelectValue placeholder="Select product type (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(otherProductsSubcategories).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">Select Supermarket if this is a supermarket product</p>
              <input type="hidden" name="subcategory" value={subcategory} />
            </div>
          )}

          {/* Price */}
          <div>
            <Label htmlFor="price" className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#0097A7]" /> Price <span className="font-normal text-gray-400">(optional)</span>
            </Label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400 pointer-events-none">Frw</span>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={initialData?.price ?? defaultPrice}
                placeholder="0.00"
                className="w-full pl-12"
              />
            </div>
          </div>
        </div>
      </FormSection>

      </div>

      {/* ── Step 2 · Media ───────────────────────────────────────── */}
      <div className={currentStep === 2 ? "" : "hidden"}>
      {/* ── Images ───────────────────────────────────────────────── */}
      <FormSection icon={ImageIcon} title="Product Images" subtitle="Clear photos help your listing sell faster">
        <div className="space-y-4">
          <div
            onClick={() => !isSubmitting && fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
              isDragging
                ? "border-[#0097A7] bg-cyan-50"
                : "border-gray-300 bg-gray-50/60 hover:border-[#0097A7] hover:bg-cyan-50/50"
            } ${isSubmitting ? "opacity-60 pointer-events-none" : ""}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-[#023E4A] to-[#0097A7] flex items-center justify-center mb-3 shadow-sm">
              <Upload className="h-6 w-6 text-white" />
            </div>
            <p className="text-sm font-semibold text-gray-700">
              <span className="text-[#0097A7]">Click to upload</span> or drag &amp; drop
            </p>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF or WebP — up to 5MB each</p>
          </div>

          {/* Image Previews */}
          {previewImages.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {previewImages.map((image, index) => (
                <div key={index} className="relative group">
                  <div className={`relative w-full h-36 rounded-xl overflow-hidden border-2 transition-colors ${
                    mainImageIndex === index ? "border-[#0097A7]" : "border-gray-200"
                  }`}>
                    <img
                      src={image}
                      alt={`Product image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {mainImageIndex === index && (
                      <div className="absolute top-2 left-2 bg-[#0097A7] text-white text-xs font-semibold px-2 py-1 rounded-full shadow">
                        ★ Main
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      disabled={isSubmitting}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
                      title="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <Button
                    type="button"
                    variant={mainImageIndex === index ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAsMainImage(index)}
                    disabled={isSubmitting}
                    className="w-full mt-2"
                  >
                    {mainImageIndex === index ? "Main Image" : "Set as Main"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </FormSection>

      </div>

      {/* ── Step 3 · Location ────────────────────────────────────── */}
      <div className={currentStep === 3 ? "" : "hidden"}>
      {/* ── Location ─────────────────────────────────────────────── */}
      <FormSection icon={MapPin} title="Location" subtitle="Optional — help buyers find your product">
        <div className="space-y-5">
          <div>
            <p className="text-sm text-gray-600 mb-3">
              📍 Click <span className="font-medium">“Use My Location”</span> to pin your product on Google Maps, or enter coordinates manually.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude">🗺️ Latitude</Label>
                <Input
                  id="latitude"
                  name="latitude"
                  type="number"
                  step="any"
                  defaultValue={initialData?.latitude}
                  placeholder="e.g., 40.7128"
                  className="w-full mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="longitude">🗺️ Longitude</Label>
                <Input
                  id="longitude"
                  name="longitude"
                  type="number"
                  step="any"
                  defaultValue={initialData?.longitude}
                  placeholder="e.g., -74.0060"
                  className="w-full mt-1.5"
                />
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleLocationClick}
              className="w-full mt-3 border-[#0097A7]/40 text-[#023E4A] hover:bg-cyan-50"
              disabled={isSubmitting}
            >
              <Navigation className="h-4 w-4 mr-2" />
              Use My Location
            </Button>
          </div>

          <div className="border-t border-gray-200 pt-5">
            <p className="text-sm font-medium text-gray-700 mb-1">Location Details</p>
            <p className="text-sm text-gray-500 mb-4">Enter the administrative location where your product is located</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="province">Province</Label>
                <Input id="province" name="province" type="text" defaultValue={initialData?.province} placeholder="e.g., Kigali City" className="w-full mt-1.5" />
              </div>
              <div>
                <Label htmlFor="district">District</Label>
                <Input id="district" name="district" type="text" defaultValue={initialData?.district} placeholder="e.g., Nyarugenge" className="w-full mt-1.5" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="sector">Sector</Label>
                <Input id="sector" name="sector" type="text" defaultValue={initialData?.sector} placeholder="e.g., Kimihurura" className="w-full mt-1.5" />
              </div>
              <div>
                <Label htmlFor="village">Village</Label>
                <Input id="village" name="village" type="text" defaultValue={initialData?.village} placeholder="e.g., Kacyiru" className="w-full mt-1.5" />
              </div>
              <div>
                <Label htmlFor="zone">Zone/Place</Label>
                <Input id="zone" name="zone" type="text" defaultValue={initialData?.zone} placeholder="e.g., Zone 1 or Specific Place" className="w-full mt-1.5" />
              </div>
            </div>
          </div>
        </div>
      </FormSection>

      </div>

      {/* ── Step 4 · Logistics ───────────────────────────────────── */}
      <div className={currentStep === 4 ? "space-y-5" : "hidden"}>
      {/* ── Availability ─────────────────────────────────────────── */}
      <FormSection icon={PackageCheck} title="Availability" subtitle="Control whether buyers can purchase this now">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label
            htmlFor="available"
            className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
              isAvailable ? "border-green-300 bg-green-50" : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <Checkbox
              id="available"
              checked={isAvailable}
              onCheckedChange={(checked: boolean) => setIsAvailable(checked)}
              disabled={isSubmitting}
            />
            <span className="text-sm font-medium text-gray-700">Available for viewing/purchase</span>
          </label>
          <label
            htmlFor="unavailable"
            className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
              !isAvailable ? "border-red-300 bg-red-50" : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <Checkbox
              id="unavailable"
              checked={!isAvailable}
              onCheckedChange={(checked: boolean) => setIsAvailable(!checked)}
              disabled={isSubmitting}
            />
            <span className="text-sm font-medium text-gray-700">Unavailable/Booked</span>
          </label>
        </div>
        {/* Hidden input for availability */}
        <input type="hidden" name="available" value={isAvailable ? "true" : "false"} />
      </FormSection>

      {/* ── Contact Information ──────────────────────────────────── */}
      <FormSection icon={Phone} title="Contact Information" subtitle="How customers can reach you about this product">
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="contactMethod"
              checked={!!contactNumber || !!whatsappNumber}
              onCheckedChange={(checked) => {
                if (!checked) {
                  setContactNumber("");
                  setWhatsappNumber("");
                }
              }}
              disabled={isSubmitting}
            />
            <Label htmlFor="contactMethod" className="text-sm font-normal">
              Provide contact number for customers to reach you
            </Label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contactNumber">Contact Number</Label>
              <Input
                id="contactNumber"
                name="contactNumber"
                type="tel"
                placeholder="e.g., +250788123456"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full mt-1.5"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
              <Input
                id="whatsappNumber"
                name="whatsappNumber"
                type="tel"
                placeholder="e.g., +250788123456"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="w-full mt-1.5"
                disabled={isSubmitting}
              />
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Provide either a contact number or WhatsApp number (or both) so customers can reach you about this product.
          </p>
        </div>
      </FormSection>

      {/* ── Owner Information (Real Estate & Vehicles) ───────────── */}
      {(category === "RealEstate" || category === "Vehicles") && (
        <section className="rounded-2xl border border-blue-200 bg-gradient-to-b from-blue-50 to-white p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shrink-0 shadow-sm">
              <Building className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900 leading-tight">
                Owner Information (For {category === "Vehicles" ? "Vehicle" : "Lease"} Agreement)
              </h3>
              <p className="text-xs text-blue-600 mt-0.5">
                Shown to clients via “Owner Info” to help them fill the{" "}
                {category === "Vehicles" ? "booking/purchase" : "lease"} contract.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ownerFullName">Owner Full Name</Label>
              <Input id="ownerFullName" name="ownerFullName" value={ownerFullName} onChange={(e) => setOwnerFullName(e.target.value)} placeholder="Full legal name of the owner" className="bg-white" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ownerNationality">Owner Nationality</Label>
              <Input id="ownerNationality" name="ownerNationality" value={ownerNationality} onChange={(e) => setOwnerNationality(e.target.value)} placeholder="e.g., Rwandan" className="bg-white" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ownerID">Owner National ID / Passport No</Label>
              <Input id="ownerID" name="ownerID" value={ownerID} onChange={(e) => setOwnerID(e.target.value)} placeholder="ID number" className="bg-white" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ownerAddress">Owner Current Address</Label>
              <Input id="ownerAddress" name="ownerAddress" value={ownerAddress} onChange={(e) => setOwnerAddress(e.target.value)} placeholder="Owner's current physical address" className="bg-white" />
            </div>
          </div>
        </section>
      )}

      </div>

      {/* ── Step 5 · Review ──────────────────────────────────────── */}
      <div className={currentStep === STEPS.length ? "" : "hidden"}>
        <FormSection icon={ClipboardCheck} title="Review & Submit" subtitle="Double-check everything before publishing">
          <div className="space-y-5">
            {previewImages.length > 0 && (
              <div className="flex items-center gap-4">
                <img
                  src={previewImages[mainImageIndex] || previewImages[0]}
                  alt="Main product"
                  className="w-24 h-24 rounded-xl object-cover border border-gray-200 shrink-0"
                />
                <div className="text-sm text-gray-600 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{snap?.title || "Untitled product"}</p>
                  <p>{previewImages.length} photo{previewImages.length > 1 ? "s" : ""} attached</p>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 px-4">
              <ReviewRow label="Title" value={snap?.title} />
              <ReviewRow label="Description" value={snap?.description} />
              <ReviewRow label="Category" value={CATEGORY_LABELS[category] || category} />
              {subcategory && <ReviewRow label="Subcategory" value={prettify(subcategory)} />}
              {propertyType && <ReviewRow label="Type" value={prettify(propertyType)} />}
              <ReviewRow label="Price" value={snap?.price ? `Frw ${snap.price}` : undefined} />
              <ReviewRow
                label="Location"
                value={[snap?.sector, snap?.district, snap?.province].filter(Boolean).join(", ")}
              />
              <ReviewRow label="Availability" value={isAvailable ? "Available" : "Unavailable / Booked"} />
              <ReviewRow label="Contact" value={contactNumber} />
              <ReviewRow label="WhatsApp" value={whatsappNumber} />
              {(category === "RealEstate" || category === "Vehicles") && (
                <ReviewRow label="Owner" value={ownerFullName} />
              )}
            </div>

            {previewImages.length === 0 && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                No photos added. Listings with photos perform much better — go back to Media to add some.
              </p>
            )}
          </div>
        </FormSection>
      </div>

      {/* Success Message */}
      {success && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 flex items-center">
          <CheckCircle2 className="w-5 h-5 mr-2 shrink-0" />
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
          <X className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Navigation ───────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-1">
        {currentStep > 1 ? (
          <Button
            type="button"
            variant="outline"
            className="px-5 rounded-xl"
            onClick={goBack}
            disabled={isSubmitting}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        ) : (
          isEditMode && (
            <Button
              type="button"
              variant="outline"
              className="px-5 rounded-xl"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )
        )}

        <div className="flex-1" />

        {currentStep < STEPS.length ? (
          <Button
            type="button"
            onClick={goNext}
            disabled={isSubmitting}
            className="px-6 py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-[#023E4A] to-[#0097A7] hover:from-[#012830] hover:to-[#007e8c] shadow-sm hover:shadow-md transition-all"
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={isSubmitting}
            className={`px-8 py-3 rounded-xl text-white font-semibold shadow-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
              isEditMode
                ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                : "bg-gradient-to-r from-[#023E4A] to-[#0097A7] hover:from-[#012830] hover:to-[#007e8c]"
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                {isEditMode ? "Updating..." : "Uploading..."}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                {isEditMode ? <CheckCircle2 className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                {isEditMode ? "Update Product" : "Publish Listing"}
              </span>
            )}
          </Button>
        )}
      </div>
    </form>
  );
}
