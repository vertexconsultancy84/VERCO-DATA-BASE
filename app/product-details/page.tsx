"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Mail, Globe, ExternalLink, MessageCircle, Phone, CheckCircle, XCircle, AlertCircle, User as UserIcon, Building } from "lucide-react";
import OwnerDetailsModal from "@/components/OwnerDetailsModal";
import Image from "next/image";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  latitude: number;
  longitude: number;
  createdAt: string;
  available?: boolean; // Add availability field
  contactNumber?: string; // Product-specific contact number
  whatsappNumber?: string; // Product-specific WhatsApp number
  province?: string;
  district?: string;
  sector?: string;
  village?: string;
  zone?: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  media?: {
    images: string[];
    videos: string[];
    mainImage?: string;
    mainVideo?: string;
  };
  ownerFullName?: string;
  ownerNationality?: string;
  ownerID?: string;
  ownerAddress?: string;
}

// Helper functions for media management
const getAllMedia = (product: Product | null): string[] => {
  if (!product) return [];
  
  const allMedia: string[] = [];
  const media = Array.isArray(product.media) && product.media.length > 0 
    ? product.media[0] 
    : product.media;
  
  if (!media) return [];

  // Add images
  if (media.images && media.images.length > 0) {
    allMedia.push(...media.images);
  }
  
  // Add videos
  if (media.videos && media.videos.length > 0) {
    allMedia.push(...media.videos);
  }
  
  return allMedia;
};

const getCurrentMedia = (product: Product | null, currentIndex: number): string | null => {
  const allMedia = getAllMedia(product);
  return allMedia[currentIndex] || null;
};

const getMediaType = (product: Product | null, index: number): 'image' | 'video' => {
  if (!product) return 'image';
  
  const allMedia = getAllMedia(product);
  const mediaFile = allMedia[index];
  
  if (!mediaFile) return 'image';
  
  const media = Array.isArray(product.media) && product.media.length > 0 
    ? product.media[0] 
    : product.media;

  // Check if it's in videos array
  if (media && media.videos && media.videos.includes(mediaFile)) {
    return 'video';
  }
  
  // Check file extension
  const videoExtensions = ['.mp4', '.webm', '.ogg'];
  if (videoExtensions.some(ext => media.toLowerCase().includes(ext))) {
    return 'video';
  }
  
  return 'image';
};

function ProductDetailContent() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("id");
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);

  // Haversine formula to calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  };

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          setError("Unable to get your location");
        }
      );
    } else {
      setError("Geolocation is not supported by your browser");
    }
  }, []);

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${productId}`);
        const data = await response.json();
        
        if (data.success) {
          setProduct(data.product);
          
          const media = Array.isArray(data.product.media) && data.product.media.length > 0 
            ? data.product.media[0] 
            : data.product.media;
            
          // Set initial media type
          if (media && media.images && media.images.length > 0) {
            setMediaType('image');
          } else if (media && media.videos && media.videos.length > 0) {
            setMediaType('video');
          }
          
          // Calculate distance if coordinates are available
          if (userLocation && data.product.latitude && data.product.longitude) {
            const dist = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              data.product.latitude,
              data.product.longitude
            );
            setDistance(Math.round(dist * 10) / 10); // Round to 1 decimal place
          }
        } else {
          setError(data.message || "Failed to load product");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        setError("Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) {
      return "Price not specified";
    }
    return `RWF ${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Extract coordinates from description if they're embedded there
  const extractCoordinatesFromDescription = (description: string) => {
    const match = description.match(/📍 Location: (-?\d+\.\d+), (-?\d+\.\d+)/);
    if (match) {
      return {
        latitude: parseFloat(match[1]),
        longitude: parseFloat(match[2])
      };
    }
    return null;
  };

  // Get coordinates either from direct fields or from description
  const getCoordinates = () => {
    if (product && product.latitude && product.longitude) {
      return { latitude: product.latitude, longitude: product.longitude };
    }
    if (product) {
      return extractCoordinatesFromDescription(product.description);
    }
    return null;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-6">
            {error || "The product you're looking for doesn't exist or couldn't be loaded."}
          </p>
          <Button onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const coordinates = getCoordinates();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              onClick={() => window.history.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back to Products
            </Button>
          </div>
        </div>
      </div>

      {/* Product Details */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Product Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">{product.title}</CardTitle>
                  {/* Availability Badge */}
                  <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                    product.available !== false 
                      ? 'bg-green-500 text-white shadow-lg' 
                      : 'bg-red-500 text-white shadow-lg'
                  }`}>
                    {product.available !== false ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Available
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        Not Available
                      </div>
                    )}
                  </div>
                </div>
                <CardDescription>
                  Listed by {product.user.name} on {formatDate(product.createdAt)}
                </CardDescription>
                
                {/* Availability Status Message */}
                <div className={`mt-4 p-4 rounded-lg ${
                  product.available !== false 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {product.available !== false ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <p className="text-green-800 font-medium">
                          This product is currently available for viewing and purchase. You can contact the seller for more information.
                        </p>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-red-600" />
                        <p className="text-red-800 font-medium">
                          This product is currently unavailable or booked. Please check back later or contact the seller for future availability.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Product Media Gallery */}
                <div className="space-y-4">
                  {/* Main Media Display */}
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 shadow-inner">
                    {getCurrentMedia(product, currentMediaIndex) ? (
                      mediaType === 'image' ? (
                        <Image
                          src={getCurrentMedia(product, currentMediaIndex)!}
                          alt={product.title}
                          fill
                          className="object-cover transition-all duration-500"
                        />
                      ) : (
                        <video
                          src={getCurrentMedia(product, currentMediaIndex)!}
                          controls
                          className="w-full h-full object-cover"
                          muted
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <div className="text-gray-400 text-center p-4">
                          <div className="text-6xl mb-2">📦</div>
                          <div className="text-sm font-medium">No Media Available</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Media Thumbnails */}
                  {getAllMedia(product).length > 1 && (
                    <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                      {getAllMedia(product).map((media: string, index: number) => (
                        <button
                          key={index}
                          onClick={() => {
                            setCurrentMediaIndex(index);
                            setMediaType(getMediaType(product, index));
                          }}
                          className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all duration-200 ${
                            currentMediaIndex === index ? 'border-orange-500 scale-105 shadow-md' : 'border-gray-200 opacity-70 hover:opacity-100'
                          }`}
                        >
                          {getMediaType(product, index) === 'image' ? (
                            <Image
                              src={media}
                              alt={`${product.title} ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <video
                              src={media}
                              className="w-full h-full object-cover"
                              muted
                            />
                          )}
                          {getMediaType(product, index) === 'video' && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <div className="text-white text-xs bg-orange-500 p-1 rounded-full">▶</div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Description */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                      <div className="w-1 h-6 bg-orange-500 rounded-full mr-2"></div>
                      Description
                    </h3>
                    <p className="text-gray-600 leading-relaxed bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                      {product.description}
                    </p>
                  </div>

                  {/* Location */}
                  {(product.province || product.district || product.sector || product.village || product.zone) && (
                    <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-5 shadow-sm">
                      <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                        <MapPin className="w-5 h-5 mr-2 text-orange-600" />
                        Detailed Location
                      </h3>
                      <p className="text-gray-700 font-medium">
                        {[product.province, product.district, product.sector, product.village, product.zone]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  )}

                  {/* Price & Distance */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-100 p-5 rounded-xl shadow-sm">
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Price</h3>
                      <p className="text-3xl font-black text-orange-600">
                        {formatPrice(product.price)}
                      </p>
                    </div>

                    {distance !== null && (
                      <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl shadow-sm">
                        <div className="flex items-center space-x-2 mb-2">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider">Proximity</h3>
                        </div>
                        <p className="text-3xl font-black text-blue-900">
                          {distance} <span className="text-lg font-normal">km away</span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Contact Section */}
                  <div className="pt-6 border-t border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Seller</h3>
                    
                    {/* Availability Banner */}
                    <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
                      product.available !== false 
                        ? 'bg-green-50 border border-green-100' 
                        : 'bg-amber-50 border border-amber-100'
                    }`}>
                      {product.available !== false ? (
                        <>
                          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                          <div>
                            <p className="font-bold text-green-900">Available Now</p>
                            <p className="text-sm text-green-700">This product is ready for viewing and purchase.</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                          <div>
                            <p className="font-bold text-amber-900">Limited Availability</p>
                            <p className="text-sm text-amber-700">Currently unavailable, but you can still inquire for future updates.</p>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {/* Contact Owner Button (Landlord Details) */}
                      <Button
                        className="w-full justify-start h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all group"
                        onClick={() => setIsOwnerModalOpen(true)}
                      >
                        <div className="bg-white/20 p-2 rounded-lg mr-4 group-hover:bg-white/30 transition-colors">
                          <UserIcon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-xs text-blue-100 font-normal">Legal Owner</span>
                          <span>View Owner Details</span>
                        </div>
                      </Button>

                      {/* Email Button */}
                      <Button
                        variant="outline"
                        className="w-full justify-start h-14 text-lg font-semibold hover:bg-orange-50 hover:border-orange-200 transition-all group"
                        onClick={() => window.open(`mailto:${product.user.email}`, '_blank')}
                      >
                        <div className="bg-gray-100 p-2 rounded-lg mr-4 group-hover:bg-orange-100 transition-colors">
                          <Mail className="h-5 w-5 text-gray-600 group-hover:text-orange-600" />
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-xs text-gray-500 font-normal">Email Address</span>
                          <span>{product.user.email}</span>
                        </div>
                      </Button>
                      
                      {/* Phone Button */}
                      {product.contactNumber && (
                        <Button
                          variant="outline"
                          className="w-full justify-start h-14 text-lg font-semibold hover:bg-blue-50 hover:border-blue-200 transition-all group"
                          onClick={() => window.open(`tel:${product.contactNumber}`, '_blank')}
                        >
                          <div className="bg-gray-100 p-2 rounded-lg mr-4 group-hover:bg-blue-100 transition-colors">
                            <Phone className="h-5 w-5 text-gray-600 group-hover:text-blue-600" />
                          </div>
                          <div className="flex flex-col items-start">
                            <span className="text-xs text-gray-500 font-normal">Call Directly</span>
                            <span>{product.contactNumber}</span>
                          </div>
                        </Button>
                      )}
                      
                      {/* WhatsApp Button */}
                      {product.whatsappNumber && (
                        <Button
                          variant="outline"
                          className="w-full justify-start h-14 text-lg font-semibold hover:bg-green-50 hover:border-green-200 transition-all group"
                          onClick={() => window.open(`https://wa.me/${(product.whatsappNumber || '').replace(/[^\d]/g, '')}`, '_blank')}
                        >
                          <div className="bg-gray-100 p-2 rounded-lg mr-4 group-hover:bg-green-100 transition-colors">
                            <MessageCircle className="h-5 w-5 text-gray-600 group-hover:text-green-600" />
                          </div>
                          <div className="flex flex-col items-start">
                            <span className="text-xs text-gray-500 font-normal">Chat on WhatsApp</span>
                            <span>{product.whatsappNumber}</span>
                          </div>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Map */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  Product Location
                </CardTitle>
                <CardDescription>
                  {coordinates 
                    ? `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`
                    : "Location not specified"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* OpenStreetMap Integration */}
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  {coordinates ? (
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${coordinates.longitude - 0.01},${coordinates.latitude - 0.01},${coordinates.longitude + 0.01},${coordinates.latitude + 0.01}&layer=mapnik&marker=${coordinates.latitude},${coordinates.longitude}`}
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <div className="text-gray-400 text-center p-4">
                        <MapPin className="h-12 w-12 mb-2" />
                        <div className="text-sm"></div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Location Details */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Latitude:</span>
                    <span className="font-mono font-medium">
                      {coordinates ? coordinates.latitude.toFixed(6) : "Not specified"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Longitude:</span>
                    <span className="font-mono font-medium">
                      {coordinates ? coordinates.longitude.toFixed(6) : "Not specified"}
                    </span>
                  </div>
                  {userLocation && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Your Location:</span>
                      <span className="font-mono font-medium">
                        {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-6 space-y-3">
                  <Button 
                    className="w-full" 
                    size="lg"
                    disabled={!coordinates}
                    onClick={() => {
                      if (coordinates) {
                        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${coordinates.latitude},${coordinates.longitude}`;
                        window.open(mapsUrl, '_blank');
                      }
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Get Directions
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    disabled={!coordinates}
                    onClick={() => {
                      if (coordinates) {
                        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${coordinates.latitude},${coordinates.longitude}`;
                        window.open(mapsUrl, '_blank');
                      }
                    }}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Open in Google Maps
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <OwnerDetailsModal 
        product={product} 
        isOpen={isOwnerModalOpen} 
        onClose={() => setIsOwnerModalOpen(false)} 
      />
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductDetailContent />
    </Suspense>
  );
}
