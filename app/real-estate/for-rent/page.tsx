"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Phone, Mail, MessageSquare, Home, Building, Briefcase, Image as ImageIcon, Video, Star, Filter, CreditCard, User as UserIcon } from "lucide-react";
import ShoppingCartComponent from "@/components/ShoppingCart";
import LeaseAgreementModal from "@/components/LeaseAgreementModal";
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
};

const getPropertyIcon = (propertyType: string) => {
  switch (propertyType) {
    case 'apartment': return <Building className="w-5 h-5" />;
    case 'home-less-than-3': return <Home className="w-5 h-5" />;
    case 'home-greater-than-3': return <Home className="w-5 h-5" />;
    case 'working-space': return <Briefcase className="w-5 h-5" />;
    default: return <Home className="w-5 h-5" />;
  }
};

const getPropertyLabel = (propertyType: string) => {
  switch (propertyType) {
    case 'apartment': return 'Apartment';
    case 'home-less-than-3': return 'Home (< 3 chambers, especially students)';
    case 'home-greater-than-3': return 'Home (> 3 chambers)';
    case 'working-space': return 'Working Space';
    default: return 'Property';
  }
};

const propertyTypes = [
  { value: 'all', label: 'All Properties', icon: <Home className="w-4 h-4" /> },
  { value: 'apartment', label: 'Apartments', icon: <Building className="w-4 h-4" /> },
  { value: 'home-less-than-3', label: 'Home (< 3 chambers, esp. students)', icon: <Home className="w-4 h-4" /> },
  { value: 'home-greater-than-3', label: 'Home (> 3 chambers)', icon: <Home className="w-4 h-4" /> },
  { value: 'working-space', label: 'Working Spaces', icon: <Briefcase className="w-4 h-4" /> },
];

export default function ForRentPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState<{ [key: string]: number }>({});
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);

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
      console.log('=== FOR RENT PAGE DEBUG ===');
      const response = await fetch('/api/products');

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        console.error('API response not ok:', response.status, response.statusText);
        // Try to get error details
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
        
        // Set minimal fallback data to prevent page breakage
        const emergencyFallback: Product[] = [
          {
            id: "emergency-fallback",
            title: "Property Loading Error",
            description: "Unable to load properties. Please try again later.",
            price: 0,
            category: "RealEstate",
            subcategory: "for-rent",
            propertyType: "apartment",
            latitude: -1.9441,
            longitude: 30.0619,
            province: "Kigali",
            district: "Nyarugenge",
            sector: "Nyarugenge",
            village: "Kigali",
            available: true,
            hidden: false,
            contactNumber: "+250788123456",
            whatsappNumber: "+250788123456",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            user: {
              id: "emergency-user",
              name: "Vertex Consulting",
              email: "vertexconsultancy84@gmail.com"
            },
            media: [{
              id: "emergency-media",
              images: [],
              videos: [],
              mainImage: "",
              mainVideo: ""
            }]
          }
        ];
        
        setProducts(emergencyFallback);
        setLoading(false);
        return;
      }

      const result = await response.json();
      console.log('API response:', result);

      if (result.success) {
        console.log('Total products fetched:', result.data.length);

        if (result.data.length === 0) {
          console.log('No products found, showing empty state');
        }

        setProducts(result.data);

        // Filter for rental properties (RealEstate category and for-rent subcategory)
        const rentalProducts = result.data.filter((product: Product) =>
          product.category === 'RealEstate' &&
          product.subcategory === 'for-rent' &&
          !product.hidden &&
          product.available
        );

        console.log('Filtered rental products:', rentalProducts.length);
      } else {
        console.error('API returned success=false:', result.message);
        // Set emergency fallback if API returns success=false
        const emergencyFallback: Product[] = [
          {
            id: "emergency-fallback-2",
            title: "API Error",
            description: result.message || "Failed to load properties",
            price: 0,
            category: "RealEstate",
            subcategory: "for-rent",
            propertyType: "apartment",
            latitude: -1.9441,
            longitude: 30.0619,
            province: "Kigali",
            district: "Nyarugenge",
            sector: "Nyarugenge",
            village: "Kigali",
            available: true,
            hidden: false,
            contactNumber: "+250788123456",
            whatsappNumber: "+250788123456",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            user: {
              id: "emergency-user",
              name: "Vertex Consulting",
              email: "vertexconsultancy84@gmail.com"
            },
            media: [{
              id: "emergency-media-2",
              images: [],
              videos: [],
              mainImage: "",
              mainVideo: ""
            }]
          }
        ];
        
        setProducts(emergencyFallback);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      
      // Set emergency fallback on network error
      const emergencyFallback: Product[] = [
        {
          id: "emergency-fallback-3",
          title: "Network Error",
          description: "Unable to connect to server. Please check your connection.",
          price: 0,
          category: "RealEstate",
          subcategory: "for-rent",
          propertyType: "apartment",
          latitude: -1.9441,
          longitude: 30.0619,
          province: "Kigali",
          district: "Nyarugenge",
          sector: "Nyarugenge",
          village: "Kigali",
          available: true,
          hidden: false,
          contactNumber: "+250788123456",
          whatsappNumber: "+250788123456",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          user: {
            id: "emergency-user",
            name: "Vertex Consulting",
            email: "vertexconsultancy84@gmail.com"
          },
          media: [{
            id: "emergency-media-3",
            images: [],
            videos: [],
            mainImage: "",
            mainVideo: ""
          }]
        }
      ];
      
      setProducts(emergencyFallback);
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

  const formatPrice = (price: number): string => {
    return `FRW ${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatLocation = (product: Product): string => {
    const parts = [];
    if (product.village) parts.push(product.village);
    if (product.sector) parts.push(product.sector);
    if (product.district) parts.push(product.district);
    if (product.province) parts.push(product.province);
    return parts.join(', ') || 'Location not specified';
  };

  const filteredProducts = selectedFilter === 'all'
    ? products
    : products.filter(product => product.propertyType === selectedFilter);

  const handleAddToCart = (product: Product) => {
    if (product.propertyType === 'apartment') {
      setSelectedProduct(product);
      setIsModalOpen(true);
      return;
    }

    const cartItem = {
      productId: product.id,
      productTitle: product.title,
      productPrice: product.price || 0,
      category: product.category,
      subcategory: product.subcategory,
      image: product.media?.[0]?.mainImage || product.media?.[0]?.images?.[0],
      quantity: 1
    };

    // Dispatch custom event to shopping cart
    window.dispatchEvent(new CustomEvent('addToCart', { detail: cartItem }));
  };

  const handleBookNow = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const getPropertyCounts = () => {
    const counts = {
      all: products.length,
      apartment: products.filter(p => p.propertyType === 'apartment').length,
      'home-less-than-3': products.filter(p => p.propertyType === 'home-less-than-3').length,
      'home-greater-than-3': products.filter(p => p.propertyType === 'home-greater-than-3').length,
      'working-space': products.filter(p => p.propertyType === 'working-space').length,
    };
    return counts;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F17105] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading rental properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold mb-4">Properties for Rent</h1>
            <p className="text-xl opacity-90">Find your perfect rental property - apartments, family homes, and working spaces</p>
          </div>
          <div className="text-center">
            <Link href="/">
              <Button className="bg-white text-orange-600 hover:bg-gray-100 transition-colors">
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
                  <Filter className="w-5 h-5 mr-2 text-orange-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Filter by Property Type</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {propertyTypes.map((type) => (
                    <Button
                      key={type.value}
                      variant={selectedFilter === type.value ? "default" : "outline"}
                      className={`flex items-center justify-center gap-2 ${selectedFilter === type.value
                          ? "bg-orange-600 hover:bg-orange-600/90"
                          : "hover:border-orange-600"
                        }`}
                      onClick={() => setSelectedFilter(type.value)}
                    >
                      {type.icon}
                      <span>{type.label}</span>
                      <Badge variant="secondary" className="ml-1">
                        {type.value === 'all' ? getPropertyCounts().all :
                          type.value === 'apartment' ? getPropertyCounts()['apartment'] :
                            type.value === 'home-less-than-3' ? getPropertyCounts()['home-less-than-3'] :
                              type.value === 'home-greater-than-3' ? getPropertyCounts()['home-greater-than-3'] :
                                getPropertyCounts()['working-space']}
                      </Badge>
                    </Button>
                  ))}
                </div>
                {selectedFilter !== 'all' && (
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Showing {filteredProducts.length} {selectedFilter === 'all' ? 'properties' : getPropertyLabel(selectedFilter).toLowerCase()}
                      {filteredProducts.length !== 1 ? 's' : ''}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFilter('all')}
                      className="text-orange-600 hover:text-orange-600/90"
                    >
                      Show All Properties
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Properties Grid */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-white rounded-lg shadow-sm p-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {selectedFilter === 'all' ? 'No Rental Properties Available' : `No ${getPropertyLabel(selectedFilter)}s Available`}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {selectedFilter === 'all'
                      ? 'There are currently no properties for rent. Please check back later.'
                      : `There are currently no ${getPropertyLabel(selectedFilter).toLowerCase()}s for rent. Try other property types or check back later.`
                    }
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button variant="outline" onClick={() => setSelectedFilter('all')}>
                      View All Properties
                    </Button>
                    <Link href="/contact">
                      <Button className="bg-[#F17105] hover:bg-[#F17105]/90">
                        Contact Us for Listings
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
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
                              <Badge className="bg-[#F17105]">For Rent</Badge>
                              {product.propertyType && (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  {getPropertyIcon(product.propertyType)}
                                  {getPropertyLabel(product.propertyType)}
                                </Badge>
                              )}
                            </div>
                            {images.length > 1 && (
                              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                                {images.map((_, idx) => (
                                  <div
                                    key={idx}
                                    className={`w-2 h-2 rounded-full transition-colors ${idx === currentIdx ? 'bg-white' : 'bg-white/50'
                                      }`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="h-64 bg-gray-200 flex items-center justify-center">
                            <ImageIcon className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                      </CardHeader>

                      <CardContent className="p-6">
                        <div className="mb-4">
                          <CardTitle className="text-xl mb-2 group-hover:text-[#0066FF] transition-colors">
                            {product.title}
                          </CardTitle>
                          <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                            {product.description}
                          </p>
                        </div>

                        {/* Property Details */}
                        <div className="space-y-3 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-2 text-[#F17105]" />
                            <span className="font-medium">{formatLocation(product)}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold text-[#0066FF]">
                              {formatPrice(product.price)}
                              <span className="text-sm text-gray-500 font-normal">/month</span>
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
                            <Button 
                              size="sm" 
                              className="w-full bg-[#F17105] hover:bg-[#F17105]/90 text-white"
                              onClick={() => handleBookNow(product)}
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              {product.propertyType === 'apartment' ? 'Book Apartment' : 'Rent & Agreement'}
                            </Button>
                            
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1 border-blue-600 text-blue-600 hover:bg-blue-50"
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
                                  Full Details
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
      <ShoppingCartComponent />
      <LeaseAgreementModal 
        product={selectedProduct as any} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
      <OwnerDetailsModal 
        product={selectedProduct} 
        isOpen={isOwnerModalOpen} 
        onClose={() => setIsOwnerModalOpen(false)} 
      />
    </div>
  </div>
</div>
);
}
