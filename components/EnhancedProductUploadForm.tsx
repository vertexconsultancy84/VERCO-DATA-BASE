"use client";

import { useState, useRef } from "react";
import { useFormState } from "react-dom";
import { createProduct } from "@/app/actions/product";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MapPin, Upload, X } from "lucide-react";

export default function EnhancedProductUploadForm() {
  const [state, formAction] = useFormState(createProduct, { success: false, message: "" });

  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewVideos, setPreviewVideos] = useState<string[]>([]);

  const [category, setCategory] = useState("OtherProducts");
  const [subcategory, setSubcategory] = useState("");
  const [propertyType, setPropertyType] = useState("");

  const [contactNumber, setContactNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // ================= IMAGE =================
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPreviewImages(prev => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });
  };

  // ================= VIDEO =================
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPreviewVideos(prev => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <form action={formAction} className="space-y-6">

      {/* ================= BASIC INFO ================= */}
      <div>
        <Label>Title</Label>
        <Input name="title" required />
      </div>

      <div>
        <Label>Description</Label>
        <Textarea name="description" required rows={4} />
      </div>

      <div>
        <Label>Price (optional)</Label>
        <Input name="price" type="number" />
      </div>

      {/* ================= CATEGORY ================= */}
      <div>
        <Label>Category</Label>
        <select
          className="w-full border p-2 rounded"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="RealEstate">Real Estate</option>
          <option value="Food">Food</option>
          <option value="OtherProducts">Other Products</option>
        </select>
      </div>

      <input type="hidden" name="category" value={category} />

      {/* ================= REAL ESTATE ================= */}
      {category === "RealEstate" && (
        <div className="space-y-4">

          <div>
            <Label>For Rent / For Sale</Label>
            <select
              className="w-full border p-2 rounded"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
            >
              <option value="for-rent">For Rent</option>
              <option value="for-sale">For Sale</option>
            </select>
          </div>

          <div>
            <Label>Property Type</Label>
            <select
              className="w-full border p-2 rounded"
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
            >
              <option value="apartment">Apartment</option>
              <option value="working-space">Working Space</option>
              <option value="home-less-than-3">Home (&lt; 3 chambers, especially students)</option>
              <option value="home-greater-than-3">Home (&gt; 3 chambers)</option>
              <option value="house-for-sale">House for Sale</option>
              <option value="land-for-building">Land for Building</option>
            </select>
          </div>

        </div>
      )}

      <input type="hidden" name="subcategory" value={subcategory} />
      <input type="hidden" name="propertyType" value={propertyType} />

      {/* ================= CONTACT ================= */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          placeholder="Contact Number"
          value={contactNumber}
          onChange={(e) => setContactNumber(e.target.value)}
        />
        <Input
          placeholder="WhatsApp Number"
          value={whatsappNumber}
          onChange={(e) => setWhatsappNumber(e.target.value)}
        />
      </div>

      <input type="hidden" name="contactNumber" value={contactNumber} />
      <input type="hidden" name="whatsappNumber" value={whatsappNumber} />

      {/* ================= AVAILABILITY ================= */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={isAvailable}
          onChange={() => setIsAvailable(!isAvailable)}
        />
        <Label>Available</Label>
      </div>

      <input type="hidden" name="available" value={isAvailable ? "true" : "false"} />

      {/* ================= IMAGES ================= */}
      <div>
        <Label>Images</Label>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        <button type="button" onClick={() => fileInputRef.current?.click()}>
          Upload Images
        </button>

        <div className="grid grid-cols-2 gap-2 mt-2">
          {previewImages.map((img, i) => (
            <img key={i} src={img} className="h-24 object-cover rounded" />
          ))}
        </div>
      </div>

      {/* ================= VIDEOS ================= */}
      <div>
        <Label>Videos</Label>
        <input
          ref={videoInputRef}
          type="file"
          multiple
          accept="video/*"
          onChange={handleVideoUpload}
          className="hidden"
        />

        <button type="button" onClick={() => videoInputRef.current?.click()}>
          Upload Video
        </button>

        <div className="mt-2">
          {previewVideos.map((vid, i) => (
            <video key={i} src={vid} className="h-32 w-full" controls />
          ))}
        </div>
      </div>

      {/* ================= LOCATION ================= */}
      <div className="grid grid-cols-2 gap-4">
        <Input name="latitude" placeholder="Latitude" />
        <Input name="longitude" placeholder="Longitude" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input name="province" placeholder="Province" />
        <Input name="district" placeholder="District" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input name="sector" placeholder="Sector" />
        <Input name="village" placeholder="Village" />
      </div>

      <div>
        <Input name="zone" placeholder="Zone / Place" />
      </div>

      {/* ================= SUBMIT ================= */}
      <Button type="submit" className="w-full">
        Upload Product
      </Button>

      {/* ================= MESSAGE ================= */}
      {state?.message && (
        <div className={state.success ? "text-green-600" : "text-red-600"}>
          {state.message}
        </div>
      )}
    </form>
  );
}