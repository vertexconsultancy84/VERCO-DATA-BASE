"use client";

import { useState, useRef } from "react";
import { createProduct } from "@/app/actions/product";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Upload, X, Image as ImageIcon, Video, Building } from "lucide-react";

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

interface SimpleEnhancedProductUploadFormProps {
  onSuccess?: () => void;
  initialData?: any;
  onCancel?: () => void;
}

export default function SimpleEnhancedProductUploadForm({ onSuccess, initialData, onCancel }: SimpleEnhancedProductUploadFormProps) {
  const isEditMode = !!initialData;
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [mainVideoIndex, setMainVideoIndex] = useState<number | null>(null);
  const [previewImages, setPreviewImages] = useState<string[]>(initialData?.media?.images || []);
  const [previewVideos, setPreviewVideos] = useState<string[]>(initialData?.media?.videos || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isAvailable, setIsAvailable] = useState(initialData?.available !== false); 
  const [contactNumber, setContactNumber] = useState(initialData?.contactNumber || ""); 
  const [whatsappNumber, setWhatsappNumber] = useState(initialData?.whatsappNumber || ""); 
  const [category, setCategory] = useState(initialData?.category || "OtherProducts");
  const [subcategory, setSubcategory] = useState(initialData?.subcategory || "");
  const [propertyType, setPropertyType] = useState(initialData?.propertyType || "");
  const [ownerFullName, setOwnerFullName] = useState(initialData?.ownerFullName || "");
  const [ownerNationality, setOwnerNationality] = useState(initialData?.ownerNationality || "");
  const [ownerID, setOwnerID] = useState(initialData?.ownerID || "");
  const [ownerAddress, setOwnerAddress] = useState(initialData?.ownerAddress || "");
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
    
    try {
      let result;
      
      if (isEditMode) {
        // Use server action for update as we don't have an update API route yet
        const { updateProduct } = await import("@/app/actions/product");
        
        // Prepare the data object for update
        const updateData: any = {
          title: formData.get('title') as string,
          description: formData.get('description') as string,
          category: category,
          subcategory: subcategory,
          propertyType: propertyType,
          price: formData.get('price') ? parseFloat(formData.get('price') as string) : null,
          latitude: formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : null,
          longitude: formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : null,
          province: formData.get('province') as string,
          district: formData.get('district') as string,
          sector: formData.get('sector') as string,
          village: formData.get('village') as string,
          zone: formData.get('zone') as string,
          available: isAvailable,
          contactNumber,
          whatsappNumber,
          ownerFullName,
          ownerNationality,
          ownerID,
          ownerAddress,
          images: previewImages, // Assuming these are URLs or base64
          videos: previewVideos
        };

        result = await updateProduct(initialData.id, updateData);
      } else {
        // Upload flow
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        result = await response.json();
      }
      
      if (result.success) {
        onSuccess?.();
        if (!isEditMode) {
          // Reset form only in create mode
          setPreviewImages([]);
          setPreviewVideos([]);
          setMainImageIndex(0);
          setMainVideoIndex(null);
        }
        
        setSuccess(isEditMode ? "Product updated successfully!" : "Product uploaded successfully!");
        setError("");
        
        window.dispatchEvent(new CustomEvent('productUpdated', { 
          detail: { 
            action: isEditMode ? 'updated' : 'created',
            productId: isEditMode ? initialData.id : result.productId
          }
        }));
        
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setError(result.message || "Something went wrong");
        setSuccess("");
      }
    } catch (error) {
      console.error("Operation error:", error);
      setError(`Failed to ${isEditMode ? 'update' : 'upload'} product. Please try again.`);
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
          defaultValue={initialData?.title}
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
          defaultValue={initialData?.description}
          required
          rows={4}
          className="w-full resize-none"
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
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="RealEstate">🏠 Real Estate</SelectItem>
            <SelectItem value="Food">🍽️ Food</SelectItem>
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
            <SelectTrigger className="w-full">
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
            <SelectTrigger className="w-full">
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
            <SelectTrigger className="w-full">
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

      {/* Subcategory — Food */}
      {category === "Food" && (
        <div>
          <Label htmlFor="subcategory">Food Type</Label>
          <Select value={subcategory} onValueChange={setSubcategory} disabled={isSubmitting}>
            <SelectTrigger className="w-full">
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

      {/* Price */}
      <div>
        <Label htmlFor="price">Price (Optional)</Label>
        <Input
          id="price"
          name="price"
          type="number"
          step="0.01"
          min="0"
          defaultValue={initialData?.price}
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
              defaultValue={initialData?.latitude}
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
              defaultValue={initialData?.longitude}
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
              defaultValue={initialData?.province}
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
              defaultValue={initialData?.district}
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
              defaultValue={initialData?.sector}
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
              defaultValue={initialData?.village}
              placeholder="e.g., Kacyiru"
              className="w-full"
            />
          </div>
          <div>
            <Label htmlFor="zone">Zone/Place</Label>
            <Input
              id="zone"
              name="zone"
              type="text"
              defaultValue={initialData?.zone}
              placeholder="e.g., Zone 1 or Specific Place"
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

      {/* Owner Information Section (For Real Estate) */}
      {category === "RealEstate" && (
        <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 space-y-4">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" />
            <Label className="text-lg font-bold text-blue-800">Owner Information (For Lease Agreement)</Label>
          </div>
          <p className="text-sm text-blue-600">This information will be shown to clients when they click "Contact Owner" to help them fill the lease contract.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ownerFullName">Owner Full Name</Label>
              <Input
                id="ownerFullName"
                name="ownerFullName"
                value={ownerFullName}
                onChange={(e) => setOwnerFullName(e.target.value)}
                placeholder="Full legal name of the owner"
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerNationality">Owner Nationality</Label>
              <Input
                id="ownerNationality"
                name="ownerNationality"
                value={ownerNationality}
                onChange={(e) => setOwnerNationality(e.target.value)}
                placeholder="e.g., Rwandan"
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerID">Owner National ID / Passport No</Label>
              <Input
                id="ownerID"
                name="ownerID"
                value={ownerID}
                onChange={(e) => setOwnerID(e.target.value)}
                placeholder="ID number"
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerAddress">Owner Current Address</Label>
              <Input
                id="ownerAddress"
                name="ownerAddress"
                value={ownerAddress}
                onChange={(e) => setOwnerAddress(e.target.value)}
                placeholder="Owner's current physical address"
                className="bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex gap-4">
        <Button
          type="submit"
          className={`flex-1 ${isEditMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'} text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          disabled={isSubmitting}
        >
          {isSubmitting ? (isEditMode ? "Updating..." : "Uploading...") : (isEditMode ? "Update Product" : "Upload Product")}
        </Button>
        {isEditMode && (
          <Button
            type="button"
            variant="outline"
            className="px-6"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
      </div>

      {/* Success Message */}
      {success && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 text-red-700">
          {error}
        </div>
      )}
    </form>
  );
}
