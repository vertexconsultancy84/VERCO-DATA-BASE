"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Eye, Edit, Trash2 } from "lucide-react";
import { deleteProduct } from "@/app/actions/product";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number | null | undefined;
  latitude?: number | null;
  longitude?: number | null;
  province?: string | null;
  district?: string | null;
  sector?: string | null;
  village?: string | null;
  createdAt: string | Date;
  distance?: number;
  user: {
    id: string;
    name: string;
    email: string;
  };
  media?: {
    images: string[];
    videos: string[];
    mainImage?: string | null | undefined;
    mainVideo?: string | null | undefined;
  } | null | undefined;
  // Legacy fields for backward compatibility
  image?: string;
  images?: string[];
  mainImage?: string;
  videos?: string[];
  mainVideo?: string;
}

interface SimpleEnhancedProductCardProps {
  product: Product;
  currentUser?: any;
  isAdmin?: boolean;
}

export default function SimpleEnhancedProductCard({ product, currentUser, isAdmin = false }: SimpleEnhancedProductCardProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    setDeleting(productId);
    const result = await deleteProduct(productId);

    if (result.success) {
      window.location.reload();
    } else {
      alert(result.message);
    }
    setDeleting(null);
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log("Geolocation error:", error.code, error.message);
          // Silently handle geolocation errors - don't crash the component
        }
      );
    } else {
      console.log("Geolocation not available in this browser/environment");
    }
  }, []);

  const formatPrice = (price?: number | null) => {
    if (price == null) return "Price not set";
    // Use a simple manual formatter to avoid hydration issues
    return `RWF ${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    // Use consistent date formatting to avoid hydration issues
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  };

  const truncateDescription = (description: string, maxLength: number = 100) =>
    description.length <= maxLength ? description : description.substring(0, maxLength) + "...";

  // Fix for TypeScript: distance is number | undefined
  const distance = userLocation && product.latitude != null && product.longitude != null
    ? calculateDistance(userLocation.lat, userLocation.lng, product.latitude, product.longitude)
    : undefined;

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 hover:border-orange-200">
      <CardContent className="p-0">
        {/* Product Image */}
        <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
          {product.media?.mainImage ? (
            <Image src={product.media.mainImage} alt={product.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : product.media?.images?.length ? (
            <Image src={product.media.images[0]} alt={product.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : product.image || product.mainImage || product.images?.length ? (
            <Image src={product.image ?? product.mainImage ?? product.images![0]!} alt={product.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <div className="text-gray-400 text-center p-4">
                <div className="text-3xl mb-2">📦</div>
                <div className="text-sm">No Image Available</div>
              </div>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 flex-1">{product.title}</h3>
            <Badge variant="secondary" className="text-sm">{formatPrice(product.price)}</Badge>
          </div>

          <p className="text-gray-600 text-sm mb-3 line-clamp-3 leading-relaxed">{truncateDescription(product.description)}</p>

          {/* Location & Distance */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <MapPin className="h-4 w-4" />
            <span>
              {distance !== undefined
                ? `${distance.toFixed(1)} km away`
                : product.latitude != null && product.longitude != null
                  ? `${product.latitude.toFixed(4)}, ${product.longitude.toFixed(4)}`
                  : product.province || product.district || product.sector || product.village
                  ? `${product.province ? product.province + ', ' : ''}${product.district ? product.district + ', ' : ''}${product.sector ? product.sector + ', ' : ''}${product.village || ''}`.replace(/, $/, '')
                  : "Location not specified"
              }
            </span>
          </div>

          {/* Detailed Location */}
          {(product.province || product.district || product.sector || product.village) && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-xs text-green-600 font-medium">Product Location</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {product.province && `${product.province}, `}
                    {product.district && `${product.district}, `}
                    {product.sector && `${product.sector}, `}
                    {product.village && product.village}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Distance */}
          {distance !== undefined && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-xs text-blue-600 font-medium">Distance from you</p>
                  <p className="text-lg font-bold text-blue-900">{distance.toFixed(1)} km</p>
                </div>
              </div>
            </div>
          )}

          {/* User Info */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-500">Listed by {product.user.name}</div>
            <div className="text-sm text-gray-500">{formatDate(product.createdAt)}</div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Link href={`/product-details?id=${product.id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <Eye className="h-4 w-4 mr-2" /> View Details
              </Button>
            </Link>

            {(currentUser && (product.user.id === currentUser.id || isAdmin)) && (
              <div className="flex gap-2">
                <Link href={`/user/edit-product?id=${product.id}`}>
                  <Button variant="outline" size="sm"><Edit className="h-4 w-4 mr-2" /> Edit</Button>
                </Link>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDelete(product.id)}
                  disabled={deleting === product.id}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleting === product.id ? "Deleting..." : "Delete"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}