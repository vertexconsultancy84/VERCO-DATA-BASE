"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, MapPin, Home, CreditCard, Package, Store, Truck, ShoppingBag, MessageCircle, Landmark } from "lucide-react";

export interface CartItem {
  id: string;
  productId: string;
  productTitle: string;
  productPrice: number;
  quantity: number;
  category: string;
  subcategory?: string;
  image?: string;
}

export interface CustomerDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  nationalId: string;
  fulfillmentMethod: "pickup" | "delivery";
  deliveryPersonName: string;
  address: string;
  landmark: string;
  province: string;
  district: string;
  sector: string;
  village?: string;
  deliveryInstructions?: string;
  paymentMethod: "cash" | "mobile_money" | "card";
}

interface CustomerDetailsFormProps {
  onSubmit: (details: CustomerDetails) => void;
  onCancel: () => void;
  loading?: boolean;
  cartItems?: CartItem[];
  totalPrice?: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  RealEstate: "Real Estate",
  Food: "Food",
  Vehicles: "Vehicles",
  Industry: "Industry",
  OtherProducts: "Other Products",
  Rent: "Rent",
};

export default function CustomerDetailsForm({
  onSubmit,
  onCancel,
  loading = false,
  cartItems = [],
  totalPrice = 0,
}: CustomerDetailsFormProps) {
  const [formData, setFormData] = useState<CustomerDetails>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    whatsappNumber: "",
    nationalId: "",
    fulfillmentMethod: "delivery",
    deliveryPersonName: "",
    address: "",
    landmark: "",
    province: "",
    district: "",
    sector: "",
    village: "",
    deliveryInstructions: "",
    paymentMethod: "cash",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CustomerDetails, string>>>({});

  const isDelivery = formData.fulfillmentMethod === "delivery";

  const formatPrice = (price: number) =>
    `RWF ${price.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CustomerDetails, string>> = {};

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    const phoneRegex = /^(\+250|0)?[7-9]\d{8}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone = "Please enter a valid Rwandan phone number (e.g. 07XXXXXXXX)";
    }
    if (formData.whatsappNumber && !phoneRegex.test(formData.whatsappNumber)) {
      newErrors.whatsappNumber = "Please enter a valid Rwandan WhatsApp number";
    }

    if (isDelivery) {
      if (!formData.deliveryPersonName.trim()) newErrors.deliveryPersonName = "Delivery person name is required";
      if (!formData.address.trim()) newErrors.address = "Street address is required";
      if (!formData.province.trim()) newErrors.province = "Province is required";
      if (!formData.district.trim()) newErrors.district = "District is required";
      if (!formData.sector.trim()) newErrors.sector = "Sector is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof CustomerDetails, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-xl">
          <ShoppingBag className="h-5 w-5 text-orange-600" />
          Checkout
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* ── Order Summary ──────────────────────────────────── */}
          {cartItems.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Package className="h-4 w-4 text-orange-600" />
                Order Summary
              </h3>
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3">
                      {item.image ? (
                        <img src={item.image} alt={item.productTitle} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{item.productTitle}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            {CATEGORY_LABELS[item.category] ?? item.category}
                          </Badge>
                          {item.subcategory && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0">{item.subcategory}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-500">× {item.quantity}</p>
                        <p className="font-semibold text-green-700 text-sm">
                          {formatPrice(item.productPrice * item.quantity)}
                        </p>
                        <p className="text-xs text-gray-400">{formatPrice(item.productPrice)} each</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center bg-orange-50 px-4 py-3 border-t border-orange-100">
                  <span className="font-semibold text-gray-800">Total ({cartItems.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span className="text-lg font-bold text-orange-700">{formatPrice(totalPrice)}</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Fulfillment Method ──────────────────────────────── */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Truck className="h-4 w-4 text-orange-600" />
              How would you like to receive your order?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.fulfillmentMethod === "pickup"
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200 bg-white hover:border-orange-300"
                }`}
              >
                <input
                  type="radio"
                  name="fulfillmentMethod"
                  value="pickup"
                  checked={formData.fulfillmentMethod === "pickup"}
                  onChange={(e) => handleInputChange("fulfillmentMethod", e.target.value)}
                  className="accent-orange-600"
                />
                <Store className={`h-5 w-5 flex-shrink-0 ${formData.fulfillmentMethod === "pickup" ? "text-orange-600" : "text-gray-400"}`} />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Pick up from shop</p>
                  <p className="text-xs text-gray-500">I will come to collect the order myself</p>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.fulfillmentMethod === "delivery"
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200 bg-white hover:border-orange-300"
                }`}
              >
                <input
                  type="radio"
                  name="fulfillmentMethod"
                  value="delivery"
                  checked={formData.fulfillmentMethod === "delivery"}
                  onChange={(e) => handleInputChange("fulfillmentMethod", e.target.value)}
                  className="accent-orange-600"
                />
                <Truck className={`h-5 w-5 flex-shrink-0 ${formData.fulfillmentMethod === "delivery" ? "text-orange-600" : "text-gray-400"}`} />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Delivery / Transport</p>
                  <p className="text-xs text-gray-500">Send the product to my address</p>
                </div>
              </label>
            </div>
          </div>

          {/* ── Personal Information ──────────────────────────── */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-orange-600" />
              Personal Information
            </h3>

            {/* Name row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  placeholder="Enter your first name"
                  className={errors.firstName ? "border-red-500" : ""}
                />
                {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  placeholder="Enter your last name"
                  className={errors.lastName ? "border-red-500" : ""}
                />
                {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
              </div>
            </div>

            {/* National ID */}
            <div className="space-y-2">
              <Label htmlFor="nationalId">National ID / Passport Number (Optional)</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="nationalId"
                  value={formData.nationalId}
                  onChange={(e) => handleInputChange("nationalId", e.target.value)}
                  placeholder="1 XXXX X XXXXXXX X XX"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="your.email@example.com"
                  className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                />
              </div>
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>

            {/* Phone row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+250 7XX XXX XXX"
                    className={`pl-10 ${errors.phone ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsappNumber">WhatsApp Number (Optional)</Label>
                <div className="relative">
                  <MessageCircle className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="whatsappNumber"
                    value={formData.whatsappNumber}
                    onChange={(e) => handleInputChange("whatsappNumber", e.target.value)}
                    placeholder="+250 7XX XXX XXX"
                    className={`pl-10 ${errors.whatsappNumber ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.whatsappNumber && <p className="text-sm text-red-500">{errors.whatsappNumber}</p>}
              </div>
            </div>
          </div>

          {/* ── Delivery fields ─────────────────────────────────── */}
          {isDelivery && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-orange-600" />
                Delivery Information
              </h3>

              {/* Delivery person name */}
              <div className="space-y-2">
                <Label htmlFor="deliveryPersonName">Name of Delivery Person *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="deliveryPersonName"
                    value={formData.deliveryPersonName}
                    onChange={(e) => handleInputChange("deliveryPersonName", e.target.value)}
                    placeholder="Full name of the person who will deliver the product"
                    className={`pl-10 ${errors.deliveryPersonName ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.deliveryPersonName && (
                  <p className="text-sm text-red-500">{errors.deliveryPersonName}</p>
                )}
              </div>

              {/* Street address */}
              <div className="space-y-2">
                <Label htmlFor="address">Street Address / Avenue *</Label>
                <div className="relative">
                  <Home className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="Street name, avenue, or road"
                    className={`pl-10 ${errors.address ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
              </div>

              {/* Nearest landmark */}
              <div className="space-y-2">
                <Label htmlFor="landmark">Nearest Landmark (Optional)</Label>
                <div className="relative">
                  <Landmark className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="landmark"
                    value={formData.landmark}
                    onChange={(e) => handleInputChange("landmark", e.target.value)}
                    placeholder="e.g., Near Kigali Convention Centre, opposite Total petrol station"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Province / District / Sector / Village */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="province">Province *</Label>
                  <Input
                    id="province"
                    value={formData.province}
                    onChange={(e) => handleInputChange("province", e.target.value)}
                    placeholder="e.g., Kigali"
                    className={errors.province ? "border-red-500" : ""}
                  />
                  {errors.province && <p className="text-sm text-red-500">{errors.province}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">District *</Label>
                  <Input
                    id="district"
                    value={formData.district}
                    onChange={(e) => handleInputChange("district", e.target.value)}
                    placeholder="e.g., Nyarugenge"
                    className={errors.district ? "border-red-500" : ""}
                  />
                  {errors.district && <p className="text-sm text-red-500">{errors.district}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sector">Sector *</Label>
                  <Input
                    id="sector"
                    value={formData.sector}
                    onChange={(e) => handleInputChange("sector", e.target.value)}
                    placeholder="e.g., Kimihurura"
                    className={errors.sector ? "border-red-500" : ""}
                  />
                  {errors.sector && <p className="text-sm text-red-500">{errors.sector}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="village">Village (Optional)</Label>
                  <Input
                    id="village"
                    value={formData.village}
                    onChange={(e) => handleInputChange("village", e.target.value)}
                    placeholder="e.g., Kinyinya"
                  />
                </div>
              </div>

              {/* Delivery instructions */}
              <div className="space-y-2">
                <Label htmlFor="deliveryInstructions">Additional Delivery Instructions (Optional)</Label>
                <Textarea
                  id="deliveryInstructions"
                  value={formData.deliveryInstructions}
                  onChange={(e) => handleInputChange("deliveryInstructions", e.target.value)}
                  placeholder="Any extra details to help locate you — gate colour, floor number, guard name, preferred delivery time, etc."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Pickup note */}
          {!isDelivery && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
              <p className="font-semibold mb-1">Pickup selected</p>
              <p>Once your order is confirmed, the seller will contact you at the phone number above with the shop address and available pickup times.</p>
            </div>
          )}

          {/* ── Payment Method ────────────────────────────────── */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-orange-600" />
              Payment Method
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { value: "cash", label: "Cash on Delivery", desc: "Pay when you receive" },
                { value: "mobile_money", label: "Mobile Money", desc: "MTN / Airtel Money" },
                { value: "card", label: "Card Payment", desc: "Visa / Mastercard" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex flex-col gap-1 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.paymentMethod === opt.value
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 hover:border-orange-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={opt.value}
                      checked={formData.paymentMethod === opt.value}
                      onChange={(e) => handleInputChange("paymentMethod", e.target.value)}
                      className="accent-orange-600"
                    />
                    <span className="text-sm font-semibold text-gray-800">{opt.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 pl-5">{opt.desc}</p>
                </label>
              ))}
            </div>
          </div>

          {/* ── Order Total reminder ───────────────────────────── */}
          {cartItems.length > 0 && (
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">You are ordering {cartItems.reduce((s, i) => s + i.quantity, 0)} item(s)</p>
                <p className="text-xs text-gray-400">Payment method: <span className="font-medium capitalize">{formData.paymentMethod.replace("_", " ")}</span></p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-0.5">Total amount</p>
                <p className="text-xl font-bold text-orange-700">{formatPrice(totalPrice)}</p>
              </div>
            </div>
          )}

          {/* ── Action Buttons ────────────────────────────────── */}
          <div className="flex justify-between pt-4 border-t gap-3">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button type="submit" className="bg-orange-600 hover:bg-orange-700 flex-1 sm:flex-none" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Place Order — {formatPrice(totalPrice)}
                </span>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
