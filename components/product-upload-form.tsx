"use client";

import { useActionState, useRef, useState } from "react";
import { createProduct } from "@/app/actions/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle, Loader2, MapPin } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function ProductUploadForm() {
  const initialState = { success: false, message: "" };
  const [state, formAction, isPending] = useActionState(createProduct, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState("");
  const [isAvailable, setIsAvailable] = useState(true); // Default to available

  // Get user's current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationError("");
          
          // Auto-fill the form fields
          const latInput = document.getElementById('latitude') as HTMLInputElement;
          const lngInput = document.getElementById('longitude') as HTMLInputElement;
          if (latInput && lngInput) {
            latInput.value = position.coords.latitude.toString();
            lngInput.value = position.coords.longitude.toString();
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationError("Unable to get your location. Please enter coordinates manually.");
        }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser. Please enter coordinates manually.");
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(e.currentTarget);
    formAction(formData);
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleFormSubmit}
      className="bg-white p-6 rounded-lg shadow border border-gray-200"
    >
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Upload a Product</h2>

      {state.message && (
        <div
          className={`flex items-center space-x-2 p-3 rounded-lg text-sm mb-6 ${
            state.success
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {state.success ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{state.message}</span>
        </div>
      )}

      <div className="space-y-5">
        <div>
          <Label htmlFor="title">Product Title</Label>
          <Input
            id="title"
            name="title"
            type="text"
            placeholder="Enter product title"
            required
            disabled={isPending}
            className="w-full h-11 px-4 border text-base border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F17105] focus:border-transparent"
          />
        </div>

        <div>
          <Label htmlFor="description">Product Description</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Enter product description"
            required
            disabled={isPending}
            className="w-full px-4 py-2 border text-base border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F17105] focus:border-transparent resize-none min-h-24"
          />
        </div>

        <div>
          <Label htmlFor="image">Product Image</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#F17105] transition">
            <input
              ref={fileInputRef}
              id="image"
              name="image"
              type="file"
              accept="image/*"
              required
              disabled={isPending}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
              className="text-[#F17105] hover:text-[#F17105]/90 font-semibold disabled:opacity-50"
            >
              Click to upload image or drag and drop
            </button>
            <p className="text-sm text-gray-500 mt-2">PNG, JPG, GIF up to 5MB</p>
            {fileInputRef.current?.files?.[0] && (
              <p className="text-sm text-green-600 mt-2">✓ {fileInputRef.current.files[0].name}</p>
            )}
          </div>
        </div>

        {/* Location Details Section */}
        <div className="border-t pt-5">
          <Label className="text-base font-semibold mb-3 block">Product Location Details</Label>
          <p className="text-sm text-gray-600 mb-4">Enter the location details where your product is located</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="province">Province (Optional)</Label>
              <Input
                id="province"
                name="province"
                type="text"
                placeholder="e.g., Kigali City"
                disabled={isPending}
                className="w-full h-11 px-4 border text-base border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F17105] focus:border-transparent"
              />
            </div>
            <div>
              <Label htmlFor="district">District (Optional)</Label>
              <Input
                id="district"
                name="district"
                type="text"
                placeholder="e.g., Nyarugenge"
                disabled={isPending}
                className="w-full h-11 px-4 border text-base border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F17105] focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <Label htmlFor="sector">Sector (Optional)</Label>
              <Input
                id="sector"
                name="sector"
                type="text"
                placeholder="e.g., Kimihurura"
                disabled={isPending}
                className="w-full h-11 px-4 border text-base border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F17105] focus:border-transparent"
              />
            </div>
            <div>
              <Label htmlFor="village">Village (Optional)</Label>
              <Input
                id="village"
                name="village"
                type="text"
                placeholder="e.g., Kacyiru"
                disabled={isPending}
                className="w-full h-11 px-4 border text-base border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F17105] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Location Section */}
        <div className="border-t pt-5">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-base font-semibold">Click the button below to locate your products on Google Maps.</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={getCurrentLocation}
              disabled={isPending}
              className="flex items-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              Google Map Location
            </Button>
          </div>
          
          {locationError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
              <p className="text-sm text-yellow-700">{locationError}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude">Latitude (Optional)</Label>
              <Input
                id="latitude"
                name="latitude"
                type="number"
                step="any"
                placeholder="e.g., 40.7128"
                disabled={isPending}
                className="w-full h-11 px-4 border text-base border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F17105] focus:border-transparent"
              />
            </div>
            <div>
              <Label htmlFor="longitude">Longitude (Optional)</Label>
              <Input
                id="longitude"
                name="longitude"
                type="number"
                step="any"
                placeholder="e.g., -74.0060"
                disabled={isPending}
                className="w-full h-11 px-4 border text-base border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F17105] focus:border-transparent"
              />
            </div>
          </div>
          
          {userLocation && (
            <div className="mt-3 text-sm text-gray-600">
              <p>✓ Your location detected: {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}</p>
            </div>
          )}
        </div>

        {/* Availability Section */}
        <div className="border-t pt-5">
          <Label className="text-base font-semibold mb-3">Product Availability</Label>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="available"
                checked={isAvailable}
                onCheckedChange={(checked: boolean) => setIsAvailable(checked)}
                disabled={isPending}
              />
              <Label htmlFor="available" className="text-sm font-normal">
                Available for viewing/purchase
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <Checkbox
                id="unavailable"
                checked={!isAvailable}
                onCheckedChange={(checked: boolean) => setIsAvailable(!checked)}
                disabled={isPending}
              />
              <Label htmlFor="unavailable" className="text-sm font-normal">
                Unavailable/Booked
              </Label>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Select whether this product should be available for visitors to view and purchase, or marked as unavailable/booked.
          </p>
          {/* Hidden input for availability */}
          <input
            type="hidden"
            name="available"
            value={isAvailable ? "true" : "false"}
          />
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-[#F17105] hover:bg-[#F17105]/90 text-white font-semibold rounded-lg py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Uploading...</span>
            </div>
          ) : (
            "Upload Product"
          )}
        </Button>
      </div>
    </form>
  );
}
