"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Eye, Edit, Trash2 } from "lucide-react";

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });

// Import Leaflet CSS
import "leaflet/dist/leaflet.css";
import type { MapContainerProps, TileLayerProps, MarkerProps } from "react-leaflet";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  distance?: number;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface EnhancedProductCardProps {
  product: Product;
  currentUser?: any;
  isAdmin?: boolean;
}

export default function EnhancedProductCard({ product, currentUser, isAdmin = false }: EnhancedProductCardProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapReady, setMapReady] = useState(false);

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
        }
      );
    }
    // Set map ready after a delay to ensure Leaflet loads
    const timer = setTimeout(() => setMapReady(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const formatPrice = (price: number) => {
    return `RWF ${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC'
    });
  };

  const truncateDescription = (description: string, maxLength: number = 100) => {
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + "...";
  };

  // Calculate distance if user location is available and product has coordinates
  const distance = userLocation && product.latitude && product.longitude
    ? calculateDistance(userLocation.lat, userLocation.lng, product.latitude, product.longitude)
    : null;

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 hover:border-orange-200">
      <CardContent className="p-0">
        {/* Product Image */}
        <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
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
            <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 flex-1">
              {product.title}
            </h3>
            <Badge variant="secondary" className="text-sm">
              {formatPrice(product.price)}
            </Badge>
          </div>

          <p className="text-gray-600 text-sm mb-3 line-clamp-3 leading-relaxed">
            {truncateDescription(product.description)}
          </p>

          {/* Location & Distance */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <MapPin className="h-4 w-4" />
            <span>
              {distance !== null
                ? `${distance.toFixed(1)} km away`
                : product.latitude && product.longitude
                  ? `${product.latitude.toFixed(4)}, ${product.longitude.toFixed(4)}`
                  : "Location not specified"
              }
            </span>
          </div>

          {/* User Info */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-500">
              Listed by {product.user.name}
            </div>
            <div className="text-sm text-gray-500">
              {formatDate(product.createdAt)}
            </div>
          </div>

          {/* Mini Map */}
          {product.latitude && product.longitude && mapReady && (
            <div className="mb-4">
              <div className="h-32 w-full rounded-lg overflow-hidden border border-gray-200">
                <MapContainer
                  bounds={[
                    [product.latitude! - 0.001, product.longitude! - 0.001],
                    [product.latitude! + 0.001, product.longitude! + 0.001]
                  ] as [[number, number], [number, number]]}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[product.latitude, product.longitude]}>
                    <Popup>
                      <div className="text-center p-2">
                        <strong>{product.title}</strong><br/>
                        {formatPrice(product.price)}<br/>
                        <small>📍 {product.latitude.toFixed(4)}, {product.longitude.toFixed(4)}</small>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Link href={`/product-details?id=${product.id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </Link>

            {/* Edit/Delete buttons for owners or admins */}
            {(currentUser && (product.user.id === currentUser.id || isAdmin)) && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
