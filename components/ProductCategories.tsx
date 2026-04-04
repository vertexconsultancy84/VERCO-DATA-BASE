"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, MapPin, Phone, Calendar, Eye } from "lucide-react";

interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  price?: number;
  latitude?: number;
  longitude?: number;
  province?: string;
  district?: string;
  sector?: string;
  village?: string;
  contactNumber?: string;
  whatsappNumber?: string;
  hidden?: boolean;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  media: {
    images: string[];
    videos: string[];
    mainImage?: string | null;
    mainVideo?: string | null;
  }[];
}

const categoryLabels = {
  RealEstate: "Real Estate",
  Food: "Food",
  Rent: "Rent",
  OtherProducts: "Other Products"
};

const categoryColors = {
  RealEstate: "bg-blue-100 text-blue-800",
  Food: "bg-green-100 text-green-800",
  Rent: "bg-purple-100 text-purple-800",
  OtherProducts: "bg-orange-100 text-orange-800"
};

export default function ProductCategories() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      if (data.success) {
        // Only show visible (not hidden) products
        setProducts(data.data.filter((product: Product) => !product.hidden));
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const getProductsByCategory = (category: string) => {
    if (category === "all") return products;
    return products.filter(product => product.category === category);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-RW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const ProductCard = ({ product }: { product: Product }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-4">
        {/* Product Images */}
        <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 mb-4 rounded-lg">
          {!imageError && product.media && product.media.length > 0 && product.media[0]?.images?.length > 0 ? (
            <div className="relative w-full h-full">
              {imageLoading && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                  <div className="text-gray-400">Loading...</div>
                </div>
              )}
              <Image
                src={product.media[0].images[0]}
                alt={product.title}
                width={400}
                height={300}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                unoptimized={true}
                onError={handleImageError}
                onLoad={handleImageLoad}
              />
            </div>
          ) : !imageError && product.media && product.media.length > 0 && product.media[0]?.mainImage ? (
            <div className="relative w-full h-full">
              {imageLoading && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                  <div className="text-gray-400">Loading...</div>
                </div>
              )}
              <Image
                src={product.media[0].mainImage}
                alt={product.title}
                width={400}
                height={300}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                unoptimized={true}
                onError={handleImageError}
                onLoad={handleImageLoad}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-gray-400 text-center p-4">
                <div className="text-3xl mb-2">📦</div>
                <div className="text-sm">No Image Available</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Product Title and Category */}
        <div className="mb-2">
          <h3 className="font-semibold text-lg mb-2">{product.title}</h3>
          <Badge className={`text-xs ${categoryColors[product.category as keyof typeof categoryColors]}`}>
            {categoryLabels[product.category as keyof typeof categoryLabels]}
          </Badge>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>

        {/* Price */}
        {product.price && (
          <p className="text-lg font-bold text-green-600 mb-2">
            ${product.price.toLocaleString()}
          </p>
        )}

        {/* Location */}
        {(product.province || product.district || product.sector || product.village) && (
          <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
            <MapPin className="w-4 h-4" />
            <span>
              {[product.village, product.sector, product.district, product.province]
                .filter(Boolean)
                .join(", ")}
            </span>
          </div>
        )}

        {/* Contact Info */}
        {product.contactNumber && (
          <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
            <Phone className="w-4 h-4" />
            <span>{product.contactNumber}</span>
          </div>
        )}

        {/* Date and User */}
        <div className="flex items-center justify-between text-xs text-gray-400 mt-3">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(product.createdAt)}</span>
          </div>
          <span>Posted by {product.user.name}</span>
        </div>

        {/* View Details Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-3"
          onClick={() => window.location.href = `/product-details?id=${product.id}`}
        >
          <Eye className="w-3 h-3 mr-1" />
          View Details
        </Button>
      </CardContent>
    </Card>
  );
};

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  const categories = ["all", "RealEstate", "Food", "Rent", "OtherProducts"];
  const totalProducts = products.length;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Browse Products by Category</h2>
        <p className="text-gray-600">Discover amazing products from our community</p>
        <p className="text-sm text-gray-500 mt-2">{totalProducts} products available</p>
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-8">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            All ({totalProducts})
          </TabsTrigger>
          <TabsTrigger value="RealEstate" className="flex items-center gap-2">
            Real Estate ({getProductsByCategory("RealEstate").length})
          </TabsTrigger>
          <TabsTrigger value="Food" className="flex items-center gap-2">
            Food ({getProductsByCategory("Food").length})
          </TabsTrigger>
          <TabsTrigger value="Rent" className="flex items-center gap-2">
            Rent ({getProductsByCategory("Rent").length})
          </TabsTrigger>
          <TabsTrigger value="OtherProducts" className="flex items-center gap-2">
            Other ({getProductsByCategory("OtherProducts").length})
          </TabsTrigger>
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category} value={category} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {getProductsByCategory(category).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {getProductsByCategory(category).length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No products found in this category.</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
