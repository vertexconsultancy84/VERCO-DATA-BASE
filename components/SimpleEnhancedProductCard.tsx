"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Eye, Edit, Trash2, ShoppingCart, CreditCard, Key } from "lucide-react";
import { deleteProduct } from "@/app/actions/product";
import LeaseAgreementModal from "./LeaseAgreementModal";
import OwnerDetailsModal from "./OwnerDetailsModal";

interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string | null;
  propertyType?: string | null; // Added propertyType
  price: number | null | undefined;
  latitude?: number | null;
  longitude?: number | null;
  province?: string | null;
  district?: string | null;
  sector?: string | null;
  village?: string | null;
  zone?: string | null;
  available: boolean;
  hidden?: boolean;
  contactNumber?: string | null;
  whatsappNumber?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  media?: {
    images: string[];
    videos: string[];
    mainImage: string | null;
    mainVideo: string | null;
  } | null;
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
  showAddToCart?: boolean; // Control Add to Cart button visibility
}

export default function SimpleEnhancedProductCard({ product, currentUser, isAdmin = false, showAddToCart = false }: SimpleEnhancedProductCardProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isLeaseModalOpen, setIsLeaseModalOpen] = useState(false);
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);

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
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('productDeleted', { detail: { productId } }));
      window.location.reload();
    } else {
      alert(result.message);
    }
    setDeleting(null);
  };

  const handleAddToCart = async (product: Product) => {
    if (product.propertyType === 'apartment') {
      setIsLeaseModalOpen(true);
      return;
    }

    try {
      // Add to shopping cart via custom event
      const cartItem = {
        productId: product.id,
        productTitle: product.title,
        productPrice: product.price || 0,
        category: product.category,
        subcategory: product.subcategory,
        image: product.media?.mainImage || product.media?.images?.[0],
        quantity: 1
      };

      // Dispatch custom event to shopping cart
      window.dispatchEvent(new CustomEvent('addToCart', { detail: cartItem }));
      
      // Show success feedback
      alert(`${product.title} added to cart!`);
      
    } catch (error) {
      console.error("Add to cart error:", error);
      alert("Failed to add item to cart. Please try again.");
    }
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
          {(() => {
            // Try to get the main image from different sources
            let imageUrl = null;
            // Normalize media data if it's an array
            const media = Array.isArray(product.media) && product.media.length > 0 
              ? product.media[0] 
              : product.media;
            
            if (media?.mainImage) {
              imageUrl = media.mainImage;
            } else if (media?.images && media.images.length > 0) {
              imageUrl = media.images[0];
            } else if (product.image) {
              imageUrl = product.image;
            } else if (product.mainImage) {
              imageUrl = product.mainImage;
            } else if (product.images && product.images.length > 0) {
              imageUrl = product.images[0];
            }
            
            // Fix double extensions in URLs
            if (imageUrl) {
              if (imageUrl.includes('.jpg.jpg')) {
                imageUrl = imageUrl.replace('.jpg.jpg', '.jpg');
                console.log('Fixed double extension:', imageUrl);
              }
              if (imageUrl.includes('.mp4.mp4')) {
                imageUrl = imageUrl.replace('.mp4.mp4', '.mp4');
                console.log('Fixed double extension:', imageUrl);
              }
            }
            
            if (imageUrl) {
              return (
                <Image 
                  src={imageUrl} 
                  alt={product.title} 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-300" 
                  onError={(e) => {
                    console.log('Image failed to load:', imageUrl);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              );
            } else {
              return (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <div className="text-gray-400 text-center p-4">
                    <div className="text-3xl mb-2">📦</div>
                    <div className="text-sm">No Image Available</div>
                  </div>
                </div>
              );
            }
          })()}
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
                  : product.province || product.district || product.sector || product.village || product.zone
                  ? [product.province, product.district, product.sector, product.village, product.zone].filter(Boolean).join(", ")
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
                    {[product.province, product.district, product.sector, product.village, product.zone]
                      .filter(Boolean)
                      .join(", ")}
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
            <div className="text-sm text-gray-500">Listed by {product.user?.name || 'Unknown'}</div>
            <div className="text-sm text-gray-500">{formatDate(product.createdAt)}</div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="flex-1 text-xs h-8 border-blue-600 text-blue-600 hover:bg-blue-50"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOwnerModalOpen(true);
              }}
            >
              Owner Info
            </Button>
            <Link href={`/product-details?id=${product.id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full h-8">
                <Eye className="h-4 w-4 mr-1" /> Details
              </Button>
            </Link>

            {/* Specialized Action Buttons based on category/propertyType */}
            {showAddToCart && (
              <>
                {/* Buy Now button for Sale Real Estate */}
                {product.category === "RealEstate" && 
                 (product.propertyType === "house-for-sale" || product.propertyType === "land-for-building") && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-8"
                    onClick={() => handleAddToCart(product)}
                  >
                    <CreditCard className="h-4 w-4 mr-2" /> Buy Now
                  </Button>
                )}

                {/* Rent Now button for Rent Real Estate */}
                {product.category === "RealEstate" && 
                 (product.propertyType === "apartment" || 
                  product.propertyType === "working-space" || 
                  product.propertyType === "home-less-than-3" || 
                  product.propertyType === "home-greater-than-3") && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="w-full bg-blue-600 hover:bg-blue-700 h-8"
                    onClick={() => handleAddToCart(product)}
                  >
                    <Key className="h-4 w-4 mr-2" />
                    {product.propertyType === 'apartment' ? 'Book' : 'Rent'}
                  </Button>
                )}

                {/* Add to Cart button for Food category */}
                {product.category === "Food" && (
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700"
                    onClick={() => handleAddToCart(product)}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
                  </Button>
                )}

                {/* Add to Cart button for Industry category */}
                {product.category === "Industry" && (
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700 h-8"
                    onClick={() => handleAddToCart(product)}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
                  </Button>
                )}

                {/* Add to Cart button for OtherProducts category */}
                {product.category === "OtherProducts" && (
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700 h-8"
                    onClick={() => handleAddToCart(product)}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
                  </Button>
                )}
              </>
            )}

            {(currentUser && product.user && (product.user.id === currentUser.id || isAdmin)) && (
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
      <LeaseAgreementModal 
        product={product as any} 
        isOpen={isLeaseModalOpen} 
        onClose={() => setIsLeaseModalOpen(false)} 
      />
      <OwnerDetailsModal 
        product={product} 
        isOpen={isOwnerModalOpen} 
        onClose={() => setIsOwnerModalOpen(false)} 
      />
    </Card>
  );
}