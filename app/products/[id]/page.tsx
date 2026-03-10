"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Mail, Globe, ExternalLink } from "lucide-react";
import Image from "next/image";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | undefined>(undefined);

  // Haversine distance formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => setError("Unable to get your location")
      );
    }
  }, []);

  // Fetch product
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${productId}`);
        const data = await response.json();

        if (data.success) {
          setProduct(data.product);

          if (userLocation) {
            const dist = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              data.product.latitude,
              data.product.longitude
            );
            setDistance(Math.round(dist * 10) / 10);
          }
        } else {
          setError("Failed to load product");
        }
      } catch {
        setError("Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, userLocation]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("rw-RW", {
      style: "currency",
      currency: "RWF",
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Product Not Found</h1>
          <p className="text-gray-600 mt-2">{error}</p>
          <Button className="mt-4" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Button variant="ghost" onClick={() => window.history.back()}>
            ← Back to Products
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-2 gap-8">

        {/* Product info */}
        <Card>
          <CardHeader>
            <CardTitle>{product.title}</CardTitle>
            <CardDescription>
              Listed by {product.user.name} on {formatDate(product.createdAt)}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">

            {/* Image */}
            <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <span className="text-gray-400">No Image</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold">Description</h3>
              <p className="text-gray-600">{product.description}</p>
            </div>

            {/* Price */}
            <Badge className="text-xl">{formatPrice(product.price)}</Badge>

            {/* Distance */}
            {distance && (
              <p className="text-blue-600">
                Distance: {distance} km
              </p>
            )}

            {/* Contact */}
            <div className="flex items-center gap-2">
              <Mail size={16} />
              {product.user.email}
            </div>

          </CardContent>
        </Card>

        {/* Map */}
        <Card>
          <CardHeader>
            <CardTitle className="flex gap-2 items-center">
              <MapPin size={18} /> Product Location
            </CardTitle>
          </CardHeader>

          <CardContent>

            <iframe
              width="100%"
              height="400"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${product.longitude - 0.01},${product.latitude - 0.01},${product.longitude + 0.01},${product.latitude + 0.01}&layer=mapnik&marker=${product.latitude},${product.longitude}`}
            />

            <div className="mt-4 space-y-2">

              <Button
                className="w-full"
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${product.latitude},${product.longitude}`
                  )
                }
              >
                <ExternalLink className="mr-2" size={16} />
                Get Directions
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps?q=${product.latitude},${product.longitude}`
                  )
                }
              >
                <Globe className="mr-2" size={16} />
                Open in Google Maps
              </Button>

            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
}