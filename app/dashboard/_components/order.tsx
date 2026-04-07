"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Clock, CheckCircle, XCircle, User, Package } from "lucide-react";

interface Order {
  id: string;
  productId: string;
  productTitle: string;
  productPrice: number;
  userId: string;
  userName: string;
  userEmail: string;
  category: string;
  subcategory?: string;
  status: string;
  createdAt: string;
}

interface OrderComponentProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, newStatus: string) => void;
}

export default function OrderComponent({ orders, onUpdateStatus }: OrderComponentProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "confirmed": return "bg-blue-100 text-blue-800";
      case "preparing": return "bg-orange-100 text-orange-800";
      case "ready": return "bg-green-100 text-green-800";
      case "completed": return "bg-emerald-100 text-emerald-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4" />;
      case "confirmed": return <CheckCircle className="h-4 w-4" />;
      case "preparing": return <Package className="h-4 w-4" />;
      case "ready": return <Package className="h-4 w-4" />;
      case "completed": return <CheckCircle className="h-4 w-4" />;
      case "cancelled": return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatPrice = (price: number) => {
    return `RWF ${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ShoppingCart className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                <p className="text-sm text-gray-600">Total Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.filter(o => o.status === "pending").length}
                </p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.filter(o => ["confirmed", "preparing", "ready"].includes(o.status)).length}
                </p>
                <p className="text-sm text-gray-600">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.filter(o => o.status === "completed").length}
                </p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No orders yet</p>
              <p className="text-gray-400 text-sm mt-2">
                When customers add products to cart, orders will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Order Header */}
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="font-semibold text-gray-900 text-lg">{order.productTitle}</h3>
                        <Badge className={getStatusColor(order.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(order.status)}
                            {order.status}
                          </span>
                        </Badge>
                      </div>
                      
                      {/* Order Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {/* Customer Info */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-600">
                            <User className="h-4 w-4" />
                            <span className="font-medium">Customer:</span>
                            <span>{order.userName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 ml-6">
                            <span>{order.userEmail}</span>
                          </div>
                        </div>
                        
                        {/* Product Info */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Package className="h-4 w-4" />
                            <span className="font-medium">Category:</span>
                            <span>{order.category}</span>
                            {order.subcategory && (
                              <>
                                <span>•</span>
                                <span className="text-orange-600">{order.subcategory}</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 ml-6">
                            <span className="font-medium">Price:</span>
                            <span className="text-green-600 font-semibold">{formatPrice(order.productPrice)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Order Time */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span>Ordered: {formatDate(order.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 ml-4">
                      {order.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => onUpdateStatus(order.id, "confirmed")}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onUpdateStatus(order.id, "cancelled")}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                      
                      {order.status === "confirmed" && (
                        <Button
                          size="sm"
                          onClick={() => onUpdateStatus(order.id, "preparing")}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          Start Preparing
                        </Button>
                      )}
                      
                      {order.status === "preparing" && (
                        <Button
                          size="sm"
                          onClick={() => onUpdateStatus(order.id, "ready")}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Mark Ready
                        </Button>
                      )}
                      
                      {order.status === "ready" && (
                        <Button
                          size="sm"
                          onClick={() => onUpdateStatus(order.id, "completed")}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
