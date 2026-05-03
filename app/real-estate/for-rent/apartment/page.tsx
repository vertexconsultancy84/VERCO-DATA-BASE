"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Home,
  Building,
  Warehouse,
  Store,
  MapPin,
  Key,
  Tag,
  ShoppingCart,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ShoppingCartComponent from "@/components/ShoppingCart";
import LeaseAgreementModal from "@/components/LeaseAgreementModal";
import OwnerDetailsModal from "@/components/OwnerDetailsModal";
import SalesAgreementModal from "@/components/SalesAgreementModal";
import Link from "next/link";
import { getUserSession } from "@/app/actions/auth";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  subcategory: string;
  propertyType?: string;
  available: boolean;
  hidden: boolean;
  media: {
    images: string[];
    videos: string[];
    mainImage: string;
  }[];
}

// Category icons
const categoryIcons: Record<string, JSX.Element> = {
  RealEstate: <Building className="w-5 h-5 text-blue-600" />,
  Apartment: <Home className="w-5 h-5 text-green-600" />,
  House: <Home className="w-5 h-5 text-emerald-600" />,
  Warehouse: <Warehouse className="w-5 h-5 text-gray-600" />,
  Shop: <Store className="w-5 h-5 text-orange-600" />,
};

// Rent / Sale icons
const statusIcons = {
  rent: {
    icon: <Key className="w-4 h-4 text-blue-600" />,
    label: "For Rent",
    color: "text-blue-600 bg-blue-50",
  },
  sale: {
    icon: <Tag className="w-4 h-4 text-green-600" />,
    label: "For Sale",
    color: "text-green-600 bg-green-50",
  },
};

export default function ApartmentPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/products")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.text();
      })
      .then((text) => {
        try {
          const data = JSON.parse(text);

          if (data.success) {
            const filtered = data.data.filter((p: Product) => {
              return (
                p.category === "RealEstate" &&
                p.available === true &&
                p.hidden === false
              );
            });

            setProducts(filtered);
          }
        } catch (err) {
          console.error("JSON parsing error:", err);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleOpenOwnerModal = (event: any) => {
      setSelectedProduct(event.detail.product);
      setIsOwnerModalOpen(true);
    };

    window.addEventListener('openOwnerModal', handleOpenOwnerModal);
    return () => window.removeEventListener('openOwnerModal', handleOpenOwnerModal);
  }, []);

  const handleBookNow = async (product: Product) => {
    try {
      const session = await getUserSession();
      if (!session) {
        alert("You must log in to proceed with booking or buying and securely track its status. Redirecting to login...");
        router.push("/login?redirect=/real-estate/for-rent/apartment");
        return;
      }
      setSelectedProduct(product);
      if (product.subcategory?.toLowerCase().includes("sale") || product.subcategory?.toLowerCase().includes("land")) {
        setIsSalesModalOpen(true);
      } else {
        setIsModalOpen(true);
      }
    } catch (e) {
      console.error(e);
      alert("Error checking authentication.");
    }
  };

  const handleAddToCart = (product: Product) => {
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
    
    // Show success feedback
    alert(`${product.title} added to cart!`);
  };

  if (loading) {
    return <p className="p-6">Loading...</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Apartments for Rent & Sale
      </h1>

      {products.length === 0 ? (
        <p>No apartments found</p>
      ) : (
        <div className="grid gap-4">
          {products.map((p) => {
            const type = p.subcategory?.toLowerCase().includes("rent")
              ? "rent"
              : "sale";

            const status = statusIcons[type];

            return (
              <div key={p.id} className="border p-4 rounded shadow-sm">
                
                {/* Title + Category icon */}
                <div className="flex items-center gap-2 mb-1">
                  {categoryIcons[p.propertyType || p.category] || (
                    <MapPin className="w-5 h-5 text-gray-500" />
                  )}
                  <h2 className="font-bold">{p.title}</h2>
                </div>

                {/* Description */}
                <p className="text-gray-600">{p.description}</p>

                {/* Price */}
                <p className="text-blue-600 font-bold mt-2">
                  FRW {p.price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>

                {/* Rent Now Button */}
                <div className="mt-4 flex gap-2">
                  <Button 
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => handleBookNow(p)}
                  >
                    <Key className="w-4 h-4 mr-2" />
                    {p.subcategory?.toLowerCase().includes("sale") ? 'Buy & Agreement' : 'Book Apartment'}
                  </Button>
                </div>
                <div className="mt-2 flex gap-2">
                  <Button 
                    variant="outline"
                    className="flex-1 border-blue-600 text-blue-600 hover:bg-blue-50"
                    onClick={() => {
                      setSelectedProduct(p);
                      setIsOwnerModalOpen(true);
                    }}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Contact Owner
                  </Button>
                  <Link href={`/product-details?id=${p.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
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
      <SalesAgreementModal
        product={selectedProduct as any}
        isOpen={isSalesModalOpen}
        onClose={() => setIsSalesModalOpen(false)}
      />
    </div>
  );
}