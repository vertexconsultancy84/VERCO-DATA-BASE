"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Mail, Globe, ExternalLink, MessageCircle, Phone, CheckCircle, XCircle, AlertCircle } from "lucide-react";
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
}

// Helper functions for media management
const getAllMedia = (product: Product | null): string[] => {
  if (!product) return [];
  
  const media: string[] = [];
  
  // Add images from media object
  if (product.media && product.media.images && product.media.images.length > 0) {
    media.push(...product.media.images);
  }
  
  // Add videos from media object
  if (product.media && product.media.videos && product.media.videos.length > 0) {
    media.push(...product.media.videos);
  }
  
  return media;
};

const getCurrentMedia = (product: Product | null, currentIndex: number): string | null => {
  const allMedia = getAllMedia(product);
  return allMedia[currentIndex] || null;
};

const getMediaType = (product: Product | null, index: number): 'image' | 'video' => {
  if (!product) return 'image';
  
  const allMedia = getAllMedia(product);
  const media = allMedia[index];
  
  if (!media) return 'image';
  
  // Check if it's in videos array
  if (product.media && product.media.videos && product.media.videos.includes(media)) {
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
          
          // Set initial media type
          if (data.product.media && data.product.media.images && data.product.media.images.length > 0) {
            setMediaType('image');
          } else if (data.product.media && data.product.media.videos && data.product.media.videos.length > 0) {
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
              <CardContent className="space-y-4">
                {/* Product Media Gallery */}
                <div className="space-y-4">
                  {/* Main Media Display */}
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                    {getCurrentMedia(product, currentMediaIndex) ? (
                      mediaType === 'image' ? (
                        <Image
                          src={getCurrentMedia(product, currentMediaIndex)!}
                          alt={product.title}
                          fill
                          className="object-cover"
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
                          <div className="text-sm">No Media Available</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Media Thumbnails */}
                  {getAllMedia(product).length > 1 && (
                    <div className="flex space-x-2 overflow-x-auto pb-2">
                      {getAllMedia(product).map((media: string, index: number) => (
                        <button
                          key={index}
                          onClick={() => {
                            setCurrentMediaIndex(index);
                            setMediaType(getMediaType(product, index));
                          }}
                          className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                            currentMediaIndex === index ? 'border-orange-500' : 'border-gray-200'
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
                            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                              <div className="text-white text-xs">▶</div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-600 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Price</h3>
                      <Badge variant="secondary" className="text-2xl font-bold">
                        {formatPrice(product.price)}
                      </Badge>
                    </div>
                  </div>

                  {/* Distance */}
                  {distance !== null && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-blue-600 font-medium">
                            Distance from your location
                          </p>
                          <p className="text-2xl font-bold text-blue-900">
                            {distance} km
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contact */}
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Seller</h3>
                    
                    {/* Availability-based contact message */}
                    <div className={`mb-4 p-3 rounded-lg ${
                      product.available !== false 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-yellow-50 border border-yellow-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        {product.available !== false ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <p className="text-sm text-green-800">
                              This product is available. Contact the seller to inquire about purchase.
                            </p>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-yellow-600" />
                            <p className="text-sm text-yellow-800">
                              This product is currently unavailable. You can still contact the seller to inquire about future availability.
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span>{product.user.email}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`mailto:${product.user.email}`, '_blank')}
                          className="ml-2"
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Send Email
                        </Button>
                      </div>
                      
                      {/* WhatsApp contact placeholder - will be enabled after database migration */}
                      {product.contactNumber ? (
                        <div className="flex items-center space-x-3 text-gray-600">
                          <Phone className="h-4 w-4" />
                          <span>{product.contactNumber}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`tel:${product.contactNumber}`, '_blank')}
                            className="ml-2"
                          >
                            Call Now
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-3 text-gray-400">
                          <Phone className="h-4 w-4" />
                          <span className="text-sm">Contact number not provided</span>
                        </div>
                      )}
                      
                      {product.whatsappNumber ? (
                        <div className="flex items-center space-x-3 text-gray-600">
                          <MessageCircle className="h-4 w-4 text-green-600" />
                          <span>{product.whatsappNumber}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`https://wa.me/${(product.whatsappNumber || '').replace(/[^\d]/g, '')}`, '_blank')}
                            className="ml-2"
                          >
                            WhatsApp
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-3 text-gray-400">
                          <MessageCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">WhatsApp number not provided</span>
                        </div>
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
