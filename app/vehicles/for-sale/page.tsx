"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Phone, Mail, MessageSquare, Image as ImageIcon, Video, Star, Filter, CreditCard, User as UserIcon, Car, Truck } from "lucide-react";
import Header from "@/components/Header";
import ShoppingCartComponent from "@/components/ShoppingCart";
import SalesAgreementModal from "@/components/SalesAgreementModal";
import OwnerDetailsModal from "@/components/OwnerDetailsModal";
import Link from "next/link";
import Image from "next/image";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  subcategory: string;
  propertyType: string;
  latitude: number;
  longitude: number;
  province: string;
  district: string;
  sector: string;
  village: string;
  zone: string;
  available: boolean;
  hidden: boolean;
  contactNumber: string;
  whatsappNumber: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  media: {
    id: string;
    images: string[];
    videos: string[];
    mainImage: string;
    mainVideo: string;
  }[];
}

const getVehicleIcon = (vehicleType: string) => {
  switch (vehicleType) {
    case 'truck': return <Truck className="w-5 h-5" />;
    default: return <Car className="w-5 h-5" />;
  }
};

const getVehicleLabel = (vehicleType: string) => {
  switch (vehicleType) {
    case 'taxi': return 'Taxi';
    case 'truck': return 'Truck / Pickup';
    case 'van': return 'Van / Minibus';
    case 'bus': return 'Bus / Coach';
    case 'motorcycle': return 'Motorcycle';
    default: return 'Vehicle';
  }
};

const vehicleTypes = [
  { value: 'all', label: 'All Vehicles', icon: <Car className="w-4 h-4" /> },
  { value: 'taxi', label: 'Taxi', icon: <Car className="w-4 h-4" /> },
  { value: 'truck', label: 'Truck / Pickup', icon: <Truck className="w-4 h-4" /> },
  { value: 'van', label: 'Van / Minibus', icon: <Car className="w-4 h-4" /> },
  { value: 'bus', label: 'Bus / Coach', icon: <Car className="w-4 h-4" /> },
  { value: 'motorcycle', label: 'Motorcycle', icon: <Car className="w-4 h-4" /> },
];

export default function VehiclesForSalePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState<{ [key: string]: number }>({});
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const handleOpenOwnerModal = (event: any) => {
      setSelectedProduct(event.detail.product);
      setIsOwnerModalOpen(true);
    };

    window.addEventListener('openOwnerModal', handleOpenOwnerModal);
    return () => window.removeEventListener('openOwnerModal', handleOpenOwnerModal);
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');

      if (!response.ok) {
        setLoading(false);
        return;
      }

      const result = await response.json();

      if (result.success) {
        const vehicleSales = result.data.filter((product: Product) =>
          product.category === 'Vehicles' &&
          product.subcategory === 'for-sale' &&
          !product.hidden &&
          product.available
        );

        setProducts(vehicleSales);

        const initialIndices: { [key: string]: number } = {};
        vehicleSales.forEach((product: Product) => {
          initialIndices[product.id] = 0;
        });
        setCurrentImageIndex(initialIndices);
      }
    } catch (error) {
      console.error('Error fetching vehicles for sale:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextImage = (productId: string, totalImages: number) => {
    setCurrentImageIndex(prev => ({
      ...prev,
      [productId]: (prev[productId] + 1) % totalImages
    }));
  };

  const prevImage = (productId: string, totalImages: number) => {
    setCurrentImageIndex(prev => ({
      ...prev,
      [productId]: prev[productId] === 0 ? totalImages - 1 : prev[productId] - 1
    }));
  };

  const getAllImages = (product: Product): string[] => {
    const images: string[] = [];
    if (product.media && product.media.length > 0) {
      const media = product.media[0];
      if (media.mainImage) images.push(media.mainImage);
      if (media.images && media.images.length > 0) {
        images.push(...media.images);
      }
    }
    return images;
  };

  const getAllVideos = (product: Product): string[] => {
    const videos: string[] = [];
    if (product.media && product.media.length > 0) {
      const media = product.media[0];
      if (media.mainVideo) videos.push(media.mainVideo);
      if (media.videos && media.videos.length > 0) {
        videos.push(...media.videos);
      }
    }
    return videos;
  };

  const formatPrice = (price: number | null | undefined): string => {
    if (price == null) return "Price not set";
    return `FRW ${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatLocation = (product: Product): string => {
    const parts = [];
    if (product.zone) parts.push(product.zone);
    if (product.village) parts.push(product.village);
    if (product.sector) parts.push(product.sector);
    if (product.district) parts.push(product.district);
    if (product.province) parts.push(product.province);
    return parts.join(', ') || 'Location not specified';
  };

  const filteredProducts = selectedFilter === 'all'
    ? products
    : products.filter(product => product.propertyType === selectedFilter);

  const handleBuyNow = (product: Product) => {
    setSelectedProduct(product);
    setIsSalesModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading vehicles for sale...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-cyan-50/30">
      <Header />
      {/* Header */}
      <div className="bg-gradient-to-r from-[#023E4A] to-[#0097A7] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold mb-4">Vehicles for Sale</h1>
            <p className="text-xl opacity-90">Buy your next vehicle - sedans, SUVs, trucks, vans, buses and motorcycles</p>
          </div>
          <div className="text-center">
            <Link href="/">
              <Button className="bg-white text-sky-600 hover:bg-gray-100 transition-colors">
                ← Back Home
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full">
          {/* Filter Section */}
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <Filter className="w-5 h-5 mr-2 text-sky-600" />
                <h2 className="text-lg font-semibold text-gray-900">Filter by Vehicle Type</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {vehicleTypes.map((type) => (
                  <Button
                    key={type.value}
                    variant={selectedFilter === type.value ? "default" : "outline"}
                    className={`flex items-center justify-center gap-2 ${selectedFilter === type.value
                      ? "bg-sky-600 hover:bg-sky-600/90"
                      : "hover:border-sky-600"
                    }`}
                    onClick={() => setSelectedFilter(type.value)}
                  >
                    {type.icon}
                    <span>{type.label}</span>
                    <Badge variant="secondary" className="ml-1">
                      {type.value === 'all'
                        ? products.length
                        : products.filter(p => p.propertyType === type.value).length}
                    </Badge>
                  </Button>
                ))}
              </div>
              {selectedFilter !== 'all' && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing {filteredProducts.length} {getVehicleLabel(selectedFilter).toLowerCase()}
                    {filteredProducts.length !== 1 ? 's' : ''}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFilter('all')}
                    className="text-sky-600 hover:text-sky-600/90"
                  >
                    Show All Vehicles
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Vehicles Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {selectedFilter === 'all' ? 'No Vehicles for Sale Available' : `No ${getVehicleLabel(selectedFilter)}s Available for Sale`}
                </h3>
                <p className="text-gray-600 mb-6">
                  {selectedFilter === 'all'
                    ? 'There are currently no vehicles for sale. Please check back later.'
                    : `There are currently no ${getVehicleLabel(selectedFilter).toLowerCase()}s for sale. Try other vehicle types or check back later.`
                  }
                </p>
                <div className="flex gap-4 justify-center">
                  <Button variant="outline" onClick={() => setSelectedFilter('all')}>
                    View All Vehicles
                  </Button>
                  <Link href="/contact">
                    <Button className="bg-sky-600 hover:bg-sky-600/90">
                      Contact Us for Listings
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredProducts.map((product) => {
                const images = getAllImages(product);
                const videos = getAllVideos(product);
                const currentIdx = currentImageIndex[product.id] || 0;
                const currentImage = images[currentIdx];

                return (
                  <Card key={product.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
                    {/* Image Gallery */}
                    <CardHeader className="p-0 relative">
                      {images.length > 0 ? (
                        <div className="relative h-64">
                          <Image
                            src={currentImage}
                            alt={product.title}
                            fill
                            className="object-cover"
                          />
                          {images.length > 1 && (
                            <>
                              <button
                                onClick={() => prevImage(product.id, images.length)}
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => nextImage(product.id, images.length)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </>
                          )}
                          <div className="absolute top-2 right-2 flex gap-2">
                            <Badge className="bg-sky-600">For Sale</Badge>
                            {product.propertyType && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                {getVehicleIcon(product.propertyType)}
                                {getVehicleLabel(product.propertyType)}
                              </Badge>
                            )}
                          </div>
                          {images.length > 1 && (
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                              {images.map((_, idx) => (
                                <div
                                  key={idx}
                                  className={`w-2 h-2 rounded-full transition-colors ${idx === currentIdx ? 'bg-white' : 'bg-white/50'}`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="h-64 bg-gray-200 flex items-center justify-center">
                          <Car className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </CardHeader>

                    <CardContent className="p-6">
                      <div className="mb-4">
                        <CardTitle className="text-xl mb-2 group-hover:text-sky-600 transition-colors">
                          {product.title}
                        </CardTitle>
                        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                          {product.description}
                        </p>
                      </div>

                      {/* Vehicle Details */}
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2 text-sky-600" />
                          <span className="font-medium">{formatLocation(product)}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-2xl font-bold text-sky-600">
                            {formatPrice(product.price)}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(product.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {/* Media Information */}
                      {(images.length > 0 || videos.length > 0) && (
                        <div className="border-t pt-3 mb-4">
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            {images.length > 0 && (
                              <div className="flex items-center gap-1">
                                <ImageIcon className="w-4 h-4" />
                                <span>{images.length} {images.length === 1 ? 'Image' : 'Images'}</span>
                              </div>
                            )}
                            {videos.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Video className="w-4 h-4" />
                                <span>{videos.length} {videos.length === 1 ? 'Video' : 'Videos'}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Owner Information */}
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{product.user.name}</p>
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <Mail className="w-3 h-3 mr-1" />
                              {product.user.email}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm text-gray-600">Verified</span>
                          </div>
                        </div>

                        {/* Contact Information */}
                        <div className="space-y-2 mb-4">
                          {product.contactNumber && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="w-4 h-4 mr-2 text-green-600" />
                              <span>{product.contactNumber}</span>
                            </div>
                          )}
                          {product.whatsappNumber && (
                            <div className="flex items-center text-sm text-gray-600">
                              <MessageSquare className="w-4 h-4 mr-2 text-green-600" />
                              <span>{product.whatsappNumber}</span>
                            </div>
                          )}
                          {product.user.phone && !product.contactNumber && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="w-4 h-4 mr-2 text-green-600" />
                              <span>{product.user.phone}</span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 border-sky-600 text-sky-600 hover:bg-sky-50"
                              onClick={() => {
                                setSelectedProduct(product);
                                setIsOwnerModalOpen(true);
                              }}
                            >
                              <UserIcon className="w-4 h-4 mr-1" />
                              Owner Info
                            </Button>
                            <Link href={`/product-details?id=${product.id}`} className="flex-1">
                              <Button size="sm" variant="outline" className="w-full">
                                View Details
                              </Button>
                            </Link>
                          </div>
                          <Button
                            size="sm"
                            className="w-full bg-sky-600 hover:bg-sky-700 text-white"
                            onClick={() => handleBuyNow(product)}
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Buy & Agreement
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
          <ShoppingCartComponent />
          <OwnerDetailsModal
            product={selectedProduct as any}
            isOpen={isOwnerModalOpen}
            onClose={() => setIsOwnerModalOpen(false)}
          />
          <SalesAgreementModal
            product={selectedProduct as any}
            isOpen={isSalesModalOpen}
            onClose={() => setIsSalesModalOpen(false)}
          />
        </div>
      </div>
    </div>
  );
}
