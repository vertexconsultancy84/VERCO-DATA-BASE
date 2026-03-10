"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Loader2, ArrowLeft } from "lucide-react";
import { updateProduct } from "@/app/actions/product";

interface Product {
  id: string;
  title: string;
  description: string;
  price?: number;
  latitude?: number;
  longitude?: number;
  province?: string;
  district?: string;
  sector?: string;
  village?: string;
  available?: boolean;
  media?: {
    images: string[];
    videos: string[];
    mainImage?: string;
    mainVideo?: string;
  };
}

function EditProductContent() {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [success, setSuccess] = useState("");
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get("id");

  useEffect(() => {
    if (!productId) {
      setError("Product ID is required");
      setLoading(false);
      return;
    }

    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${productId}`);
      const data = await response.json();

      if (data.success) {
        setProduct(data.product);
        setIsAvailable(data.product.available !== false);
      } else {
        setError(data.message || "Failed to fetch product");
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      setError("Failed to fetch product");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    const formData = new FormData(e.currentTarget);
    formData.append("available", isAvailable ? "true" : "false");

    // Debug logging
    console.log("=== EDIT FORM SUBMISSION DEBUG ===");
    console.log("Product ID:", productId);
    console.log("FormData contents:");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }
    console.log("=====================================");

    try {
      const result = await updateProduct(productId!, formData);
      
      if (result.success) {
        setSuccess("Product updated successfully!");
        setTimeout(() => {
          router.push("/user/dashboard");
        }, 2000);
      } else {
        setError(result.message || "Failed to update product");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      setError("Failed to update product");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error || "Product not found"}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-gray-600 mt-2">Update your product information</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 flex items-center space-x-2 p-4 rounded-lg bg-green-50 text-green-700 border border-green-200">
            <CheckCircle className="w-4 h-4" />
            <span>{success}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 flex items-center space-x-2 p-4 rounded-lg bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <Label htmlFor="title">Product Title</Label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  defaultValue={product.title}
                  placeholder="Enter product title"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Product Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={product.description}
                  placeholder="Enter product description"
                  required
                  disabled={isSubmitting}
                  className="min-h-24"
                />
              </div>

              {/* Price */}
              <div>
                <Label htmlFor="price">Price (Optional)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={product.price || ""}
                  placeholder="Enter product price"
                  disabled={isSubmitting}
                />
              </div>

              {/* Location */}
              <div>
                <Label>Product Location (Optional)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      name="latitude"
                      type="number"
                      step="any"
                      defaultValue={product.latitude || ""}
                      placeholder="e.g., 40.7128"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      name="longitude"
                      type="number"
                      step="any"
                      defaultValue={product.longitude || ""}
                      placeholder="e.g., -74.0060"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="province">Province</Label>
                    <Input
                      id="province"
                      name="province"
                      type="text"
                      defaultValue={product.province || ""}
                      placeholder="e.g., Kigali City"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="district">District</Label>
                    <Input
                      id="district"
                      name="district"
                      type="text"
                      defaultValue={product.district || ""}
                      placeholder="e.g., Nyarugenge"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="sector">Sector</Label>
                    <Input
                      id="sector"
                      name="sector"
                      type="text"
                      defaultValue={product.sector || ""}
                      placeholder="e.g., Kimihurura"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="village">Village</Label>
                    <Input
                      id="village"
                      name="village"
                      type="text"
                      defaultValue={product.village || ""}
                      placeholder="e.g., Kacyiru"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div>
                <Label>Product Availability</Label>
                <div className="space-y-3 mt-2">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="available"
                      checked={isAvailable}
                      onCheckedChange={(checked: boolean) => setIsAvailable(checked)}
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="unavailable" className="text-sm font-normal">
                      Unavailable/Booked
                    </Label>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Select whether this product should be available for visitors to view and purchase, or marked as unavailable/booked.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Product"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function EditProductPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditProductContent />
    </Suspense>
  );
}
