"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Edit, Calendar, User, Package, MapPin, Mail, Eye, EyeOff } from "lucide-react";
import { hideProductByAdmin, unhideProductByAdmin } from "../../actions/admin";

interface Registration {
  id: string;
  companyName: string;
  email: string;
  tinNumber: string;
  phoneNumber: string;
  location: string;
  selectedServices: string[];
  createdAt: string;
  updatedAt: string;
}

interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  price?: number;
  latitude?: number;
  longitude?: number;
  hidden?: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  media: {
    images: string[];
    videos: string[];
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

export default function RecordsTable() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"registrations" | "products">("registrations");

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      
      // Fetch registrations
      console.log('Fetching registrations...');
      const regResponse = await fetch('/api/registrations');
      const regData = await regResponse.json();
      console.log('Registrations response:', regData);
      setRegistrations(regData.data || []);
      
      // Fetch products
      console.log('Fetching products...');
      const prodResponse = await fetch('/api/products');
      const prodData = await prodResponse.json();
      console.log('Products response:', prodData);
      setProducts(prodData.data || []);
      
    } catch (error: any) {
      console.error('Error fetching records:', error);
      console.error('Full error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRegistration = async (id: string) => {
    if (confirm('Are you sure you want to delete this registration?')) {
      try {
        await fetch(`/api/registrations/${id}`, { method: 'DELETE' });
        setRegistrations(registrations.filter(reg => reg.id !== id));
      } catch (error: any) {
        console.error('Error deleting registration:', error);
      }
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await fetch(`/api/products/${id}`, { method: 'DELETE' });
        setProducts(products.filter(prod => prod.id !== id));
      } catch (error: any) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleHideProduct = async (id: string) => {
    console.log('Attempting to hide product:', id);
    if (confirm('Are you sure you want to hide this product from public view?')) {
      try {
        const result = await hideProductByAdmin(id);
        console.log('Hide product result:', result);
        if (result.success) {
          alert(result.message);
          // Refresh the products list
          fetchRecords();
        } else {
          alert(result.message || "Failed to hide product");
        }
      } catch (error: any) {
        console.error("Error hiding product:", error);
        alert("An error occurred while hiding the product");
      }
    }
  };

  const handleUnhideProduct = async (id: string) => {
    console.log('Attempting to unhide product:', id);
    if (confirm('Are you sure you want to make this product visible to public?')) {
      try {
        const result = await unhideProductByAdmin(id);
        console.log('Unhide product result:', result);
        if (result.success) {
          alert(result.message);
          // Refresh the products list
          fetchRecords();
        } else {
          alert(result.message || "Failed to unhide product");
        }
      } catch (error: any) {
        console.error("Error unhiding product:", error);
        alert("An error occurred while unhiding the product");
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-RW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Database Records</h1>
        <p className="text-gray-600">View all registrations and products with management options</p>
      </div>

      <div className="mb-6">
        <div className="flex space-x-4">
          <Button
            variant={activeTab === "registrations" ? "default" : "outline"}
            onClick={() => setActiveTab("registrations")}
            className="flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Registrations ({registrations.length})
          </Button>
          <Button
            variant={activeTab === "products" ? "default" : "outline"}
            onClick={() => setActiveTab("products")}
            className="flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            Products ({products.length})
          </Button>
        </div>
      </div>

      {activeTab === "registrations" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Registration Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>TIN Number</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Services</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map((registration) => (
                    <TableRow key={registration.id}>
                      <TableCell className="font-medium">{registration.companyName}</TableCell>
                      <TableCell>{registration.email}</TableCell>
                      <TableCell>{registration.tinNumber}</TableCell>
                      <TableCell>{registration.phoneNumber}</TableCell>
                      <TableCell>{registration.location}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {registration.selectedServices.map((service, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(registration.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => console.log('Edit registration:', registration.id)}
                            className="flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteRegistration(registration.id)}
                            className="flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "products" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Product Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>User Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Images</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="font-medium">{product.title}</div>
                          <div className="text-sm text-gray-600 line-clamp-2">
                            {product.description}
                          </div>
                          {product.hidden && (
                            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                              Hidden
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${categoryColors[product.category as keyof typeof categoryColors]}`}>
                          {categoryLabels[product.category as keyof typeof categoryLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {product.user?.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.price ? `$${product.price}` : 'Not specified'}
                      </TableCell>
                      <TableCell>
                        {product.latitude && product.longitude ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">
                              {product.latitude.toFixed(4)}, {product.longitude.toFixed(4)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">Not specified</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {product.media && product.media.length > 0 && (
                            <div className="flex gap-1">
                              {product.media[0]?.images?.slice(0, 2).map((image, index) => (
                                <img
                                  key={index}
                                  src={image}
                                  alt={`Product image ${index + 1}`}
                                  className="w-16 h-16 object-cover rounded"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(product.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => console.log('Edit product:', product.id)}
                            className="flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </Button>
                          {/* Admin Hide/Unhide buttons - show based on hidden status */}
                          {!product.hidden ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleHideProduct(product.id)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              Hide
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnhideProduct(product.id)}
                              className="flex items-center gap-1"
                            >
                              <EyeOff className="w-3 h-3" />
                              Unhide
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
