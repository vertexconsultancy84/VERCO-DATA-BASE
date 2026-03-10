"use client";

import { useState, useRef } from "react";
import { createProduct } from "@/app/actions/product";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Upload, X, Image as ImageIcon, Video } from "lucide-react";

interface SimpleEnhancedProductUploadFormProps {
  onSuccess?: () => void;
}

export default function SimpleEnhancedProductUploadForm({ onSuccess }: SimpleEnhancedProductUploadFormProps) {
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [mainVideoIndex, setMainVideoIndex] = useState<number | null>(null);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewVideos, setPreviewVideos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isAvailable, setIsAvailable] = useState(true); // Default to available
  const [contactNumber, setContactNumber] = useState(""); // Contact number state
  const [whatsappNumber, setWhatsappNumber] = useState(""); // WhatsApp number state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    Array.from(files).forEach(file => {
      if (allowedTypes.includes(file.type) && file.size <= 5 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          newImages.push(result);
          setPreviewImages(prev => [...prev, ...newImages]);
        };
        reader.readAsDataURL(file);
      } else {
        alert(`Invalid image file or size too large. Please use JPEG, PNG, GIF, or WebP under 5MB.`);
      }
    });
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newVideos: string[] = [];
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    
    Array.from(files).forEach(file => {
      if (allowedTypes.includes(file.type) && file.size <= 10 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          newVideos.push(result);
          setPreviewVideos(prev => [...prev, ...newVideos]);
        };
        reader.readAsDataURL(file);
      } else {
        alert(`Invalid video file or size too large. Please use MP4, WebM, or OGG under 10MB.`);
      }
    });
  };

  const removeImage = (index: number) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
    if (mainImageIndex === index) {
      setMainImageIndex(0);
    }
  };

  const removeVideo = (index: number) => {
    setPreviewVideos(prev => prev.filter((_, i) => i !== index));
    if (mainVideoIndex === index) {
      setMainVideoIndex(null);
    }
  };

  const setAsMainImage = (index: number) => {
    setMainImageIndex(index);
    setMainVideoIndex(null);
  };

  const setAsMainVideo = (index: number) => {
    setMainVideoIndex(index);
    setMainImageIndex(-1);
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
    setIsSubmitting(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    
    // Add all preview images to FormData
    for (let i = 0; i < previewImages.length; i++) {
      const file = await dataUrlToFile(previewImages[i], `image_${i}.jpg`, 'image/jpeg');
      formData.append('image', file);
    }
    
    // Add all preview videos to FormData
    for (let i = 0; i < previewVideos.length; i++) {
      const file = await dataUrlToFile(previewVideos[i], `video_${i}.mp4`, 'video/mp4');
      formData.append('video', file);
    }
    
    // Use the new upload API instead of server action
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        onSuccess?.();
        // Reset form
        setPreviewImages([]);
        setPreviewVideos([]);
        setMainImageIndex(0);
        setMainVideoIndex(null);
        alert("Product uploaded successfully!");
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setError("Failed to upload product. Please try again.");
    }
    
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <Label htmlFor="title">Product Title</Label>
        <Input
          id="title"
          name="title"
          type="text"
          placeholder="Enter product title"
          required
          className="w-full"
        />
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Describe your product..."
          required
          rows={4}
          className="w-full resize-none"
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
          placeholder="Enter product price"
          className="w-full"
        />
      </div>

      {/* Images Upload */}
      <div>
        <Label>Product Images (up to 2)</Label>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 text-[#F17105] hover:text-[#F17105]/90 font-semibold"
              disabled={isSubmitting}
            >
              <Upload className="h-4 w-4" />
              Click to upload images
            </button>
            <p className="text-sm text-gray-500 mt-2">PNG, JPG, GIF up to 5MB each</p>
          </div>

          {/* Image Previews */}
          {previewImages.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {previewImages.map((image, index) => (
                <div key={index} className="relative group">
                  <div className="relative w-full h-32 rounded-lg overflow-hidden border-2 border-gray-200">
                    <img
                      src={image}
                      alt={`Product image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {mainImageIndex === index && (
                      <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        Main
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between mt-2">
                    <Button
                      type="button"
                      variant={mainImageIndex === index ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAsMainImage(index)}
                      disabled={isSubmitting}
                    >
                      {mainImageIndex === index ? "Main Image" : "Set as Main"}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeImage(index)}
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Videos Upload */}
      <div>
        <Label>Product Videos (up to 1)</Label>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              multiple
              onChange={handleVideoUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="flex items-center space-x-2 text-[#F17105] hover:text-[#F17105]/90 font-semibold"
              disabled={isSubmitting}
            >
              <Upload className="h-4 w-4" />
              Click to upload video
            </button>
            <p className="text-sm text-gray-500 mt-2">MP4, WebM up to 10MB</p>
          </div>

          {/* Video Previews */}
          {previewVideos.length > 0 && (
            <div className="space-y-4">
              {previewVideos.map((video, index) => (
                <div key={index} className="relative group">
                  <div className="relative w-full h-32 rounded-lg overflow-hidden border-2 border-gray-200">
                    <video
                      src={video}
                      className="w-full h-full object-cover"
                      controls={false}
                      muted
                    />
                    {mainVideoIndex === index && (
                      <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                        Main Video
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between mt-2">
                    <Button
                      type="button"
                      variant={mainVideoIndex === index ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAsMainVideo(index)}
                      disabled={isSubmitting}
                    >
                      {mainVideoIndex === index ? "Main Video" : "Set as Main"}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeVideo(index)}
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Location */}
      <div>
        <Label>Product Location (Optional), 📍Click On "Use My Location" Button below to locate your product on Google Maps.</Label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="latitude">🗺️</Label>
            <Input
              id="latitude"
              name="latitude"
              type="number"
              step="any"
              placeholder="e.g., 40.7128"
              className="w-full"
            />
          </div>
          <div>
            <Label htmlFor="longitude">🗺️</Label>
            <Input
              id="longitude"
              name="longitude"
              type="number"
              step="any"
              placeholder="e.g., -74.0060"
              className="w-full"
            />
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleLocationClick}
          className="w-full mt-2"
          disabled={isSubmitting}
        >
          <MapPin className="h-4 w-4 mr-2" />
          Use My Location
        </Button>
      </div>

      {/* Location Details Section */}
      <div>
        <Label>Product Location Details (Optional)</Label>
        <p className="text-sm text-gray-600 mb-4">Enter the location details where your product is located</p>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="province">Province</Label>
            <Input
              id="province"
              name="province"
              type="text"
              placeholder="e.g., Kigali City"
              className="w-full"
            />
          </div>
          <div>
            <Label htmlFor="district">District</Label>
            <Input
              id="district"
              name="district"
              type="text"
              placeholder="e.g., Nyarugenge"
              className="w-full"
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
              placeholder="e.g., Kimihurura"
              className="w-full"
            />
          </div>
          <div>
            <Label htmlFor="village">Village</Label>
            <Input
              id="village"
              name="village"
              type="text"
              placeholder="e.g., Kacyiru"
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Availability Section */}
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
        {/* Hidden input for availability */}
        <input
          type="hidden"
          name="available"
          value={isAvailable ? "true" : "false"}
        />
      </div>

      {/* Contact Information Section */}
      <div>
        <Label>Contact Number or WhatsApp Number</Label>
        <div className="space-y-3 mt-2">
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
                placeholder="Enter phone number (e.g., +250788123456)"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
              <Input
                id="whatsappNumber"
                name="whatsappNumber"
                type="tel"
                placeholder="Enter WhatsApp number (e.g., +250788123456)"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="w-full"
                disabled={isSubmitting}
              />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Provide either a contact number or WhatsApp number (or both) so customers can reach you about this product.
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Uploading..." : "Upload Product"}
      </Button>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 text-red-700">
          {error}
        </div>
      )}
    </form>
  );
}
