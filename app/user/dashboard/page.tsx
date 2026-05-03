"use client";

import { useState, useEffect } from "react";
import { getUserSession } from "@/app/actions/auth";
import { getUserProducts, deleteProduct } from "@/app/actions/product";
import { getUserPlacedOrders } from "@/app/actions/order";
import { redirect } from "next/navigation";
import SimpleEnhancedProductUploadForm from "@/components/SimpleEnhancedProductUploadForm";
import SimpleEnhancedProductCard from "@/components/SimpleEnhancedProductCard";
import { Package, Upload, TrendingUp, Users, ArrowRight, Home, Edit, Trash2, Eye, CheckCircle } from "lucide-react";
import Link from "next/link";

interface Product {
  id: string;
  title: string;
  description: string;
  price?: number | null;
  category: string;
  subcategory?: string | null;
  propertyType?: string | null;
  images?: string[];
  videos?: string[];
  mainImage?: string | null;
  mainVideo?: string | null;
  available: boolean;
  contactNumber?: string | null;
  whatsappNumber?: string | null;
  village?: string | null;
  zone?: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  media?: {
    images: string[];
    videos: string[];
    mainImage?: string | null;
    mainVideo?: string | null;
  } | null;
  user?: {
    name: string;
    id: string;
    email: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
}

export default function UserDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const session = await getUserSession();
        setUser(session);
        
        if (session) {
          const userProducts = await getUserProducts();
          const userOrders = await getUserPlacedOrders();
          setProducts(userProducts || [] as Product[]);
          setOrders(userOrders || []);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const handleProductUpdate = () => {
      if (user) {
        getUserProducts().then((products) => {
          if (products) {
            setProducts(products as Product[]);
          }
        });
      }
    };

    window.addEventListener('productUpdated', handleProductUpdate);
    window.addEventListener('productDeleted', handleProductUpdate);

    return () => {
      window.removeEventListener('productUpdated', handleProductUpdate);
      window.removeEventListener('productDeleted', handleProductUpdate);
    };
  }, [user]);

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(productId);
        setProducts(products.filter(p => p.id !== productId));
        window.dispatchEvent(new CustomEvent('productDeleted'));
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-600">Please log in to view your dashboard.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 to-orange-500 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Welcome back, {user.name}!
            </h1>
            <p className="mt-6 text-xl text-orange-100 max-w-3xl mx-auto">
              Manage your products and grow your business
            </p>
          </div>
        </div>
      </div>

      {/* Notifications & Contracts Section */}
      {orders.filter(o => o.status === "contract_approved").length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pt-8 sm:px-6 lg:px-8">
          <div className="bg-indigo-50 border-l-4 border-indigo-600 p-6 rounded-r-lg shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <h3 className="text-lg font-bold text-indigo-900">Contract Approvals & Notifications</h3>
                <div className="mt-4 space-y-4">
                  {orders.filter(o => o.status === "contract_approved").map((order) => (
                    <div key={order.id} className="bg-white p-4 rounded shadow-sm border border-indigo-100">
                      <p className="text-gray-800 text-sm sm:text-base">
                        Your contract for <strong>{order.productTitle}</strong> has been successfully <span className="text-indigo-600 font-semibold">approved</span> by Vertex Consulting! Please proceed with the next steps or await further contact.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <Package className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900">{products.length}</h3>
            <p className="text-gray-600">Total Products</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <Upload className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900">Active</h3>
            <p className="text-gray-600">Upload Status</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <TrendingUp className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900">Growing</h3>
            <p className="text-gray-600">Business Status</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Upload/Edit Form */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-6">
              {editingProduct ? (
                <>
                  <Edit className="h-6 w-6 text-blue-600 mr-2" />
                  <h2 className="text-xl font-bold text-gray-900">Edit Product</h2>
                </>
              ) : (
                <>
                  <Upload className="h-6 w-6 text-orange-600 mr-2" />
                  <h2 className="text-xl font-bold text-gray-900">Upload New Product</h2>
                </>
              )}
            </div>
            
            {editingProduct ? (
              <SimpleEnhancedProductUploadForm 
                initialData={products.find(p => p.id === editingProduct)} 
                onSuccess={() => setEditingProduct(null)}
                onCancel={() => setEditingProduct(null)}
              />
            ) : (
              <SimpleEnhancedProductUploadForm />
            )}
          </div>

          {/* Your Products */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Package className="h-6 w-6 text-orange-600 mr-2" />
                <h2 className="text-xl font-bold text-gray-900">Your Products</h2>
              </div>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {products.length} items
              </span>
            </div>
            
            {products.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-orange-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <Package className="h-10 w-10 text-orange-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Products Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Start by uploading your first product using the form
                </p>
                <div className="inline-flex items-center text-orange-600 hover:text-orange-700">
                  <span className="text-sm font-medium">Get started</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {products.map((product) => (
                  <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.title}</h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="font-medium">Category:</span>
                          <span>{product.category}</span>
                          {product.subcategory && (
                            <><span className="mx-2">â¢</span>
                              <span>{product.subcategory}</span>
                            </>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                          <div className="flex items-center">
                            <span className="font-medium mr-1">Price:</span>
                            <span>${product.price?.toFixed(2)}</span>
                          </div>
                          {product.zone && (
                            <div className="flex items-center">
                              <span className="font-medium mr-1">Zone:</span>
                              <span>{product.zone}</span>
                            </div>
                          )}
                          {product.village && (
                            <div className="flex items-center">
                              <span className="font-medium mr-1">Village:</span>
                              <span>{product.village}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="font-medium">Status:</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            product.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {product.available ? 'Available' : 'Not Available'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Link
                          href={`/product-details?id=${product.id}`}
                          className="inline-flex items-center px-3 py-2 border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        
                        <button
                          onClick={() => setEditingProduct(product.id)}
                          className="inline-flex items-center px-3 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="inline-flex items-center px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              href="/view-products"
              className="flex items-center justify-center px-6 py-3 border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
            >
              <Package className="h-5 w-5 mr-2" />
              Browse Products
            </Link>
            <Link 
              href="/contact"
              className="flex items-center justify-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Users className="h-5 w-5 mr-2" />
              Contact Support
            </Link>
            <Link 
              href="/"
              className="flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Home className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
