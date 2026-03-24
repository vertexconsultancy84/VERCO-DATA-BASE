"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Eye, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string; // Changed from imageUrl to match database
  latitude: number;
  longitude: number;
  createdAt: string;
  available?: boolean; // Add availability field
  distance?: number;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface ProductsGridProps {
  products: Product[];
  currentUser?: any;
  isAdmin?: boolean;
}

export default function ProductsGrid({ products, currentUser, isAdmin = false }: ProductsGridProps) {
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

  // Separate products by availability
  const availableProducts = products.filter(product => product.available !== false);
  const unavailableProducts = products.filter(product => product.available === false);

  return (
    <div className="space-y-8">
      {/* Available Products - Top Section */}
      {availableProducts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            Available Products ({availableProducts.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableProducts.map((product) => (
              <Card key={product.id} className="group hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                <CardContent className="p-0">
                  {/* Product Image */}
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                    {/* Availability Badge */}
                    <div className="absolute top-2 right-2 z-10 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold opacity-90">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Available
                      </div>
                    </div>
                    
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
                          <div className="text-6xl mb-2">📦</div>
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
                        {product.distance !== undefined
                          ? `${product.distance} km away`
                          : `${product.latitude.toFixed(4)}, ${product.longitude.toFixed(4)}`
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

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Link href={`/product-details?id=${product.id}`}>
                        <Button variant="outline" size="sm" className="flex-1">
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
            ))}
          </div>
        </div>
      )}

      {/* Unavailable Products - Bottom Section */}
      {unavailableProducts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <XCircle className="w-6 h-6 text-red-600" />
            Unavailable/Booked Products ({unavailableProducts.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
            {unavailableProducts.map((product) => (
              <Card key={product.id} className="group hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                <CardContent className="p-0">
                  {/* Product Image */}
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                    {/* Availability Badge */}
                    <div className="absolute top-2 right-2 z-10 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold opacity-90">
                      <div className="flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        Not Available
                      </div>
                    </div>
                    
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
                          <div className="text-6xl mb-2">📦</div>
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
                        {product.distance !== undefined
                          ? `${product.distance} km away`
                          : `${product.latitude.toFixed(4)}, ${product.longitude.toFixed(4)}`
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

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Link href={`/product-details?id=${product.id}`}>
                        <Button variant="outline" size="sm" className="flex-1">
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
