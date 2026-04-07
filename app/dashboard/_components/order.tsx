"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Clock, CheckCircle, XCircle, User, Package, Download, Trash2 } from "lucide-react";

interface Order {
  id: string;
  productId: string;
  productTitle: string;
  productPrice: number;
  userId?: string;
  userName: string;
  userEmail: string;
  customerPhone?: string;
  deliveryAddress?: string;
  village?: string;
  deliveryInstructions?: string;
  paymentMethod?: string;
  category: string;
  subcategory?: string;
  status: string;
  createdAt: string;
}

interface OrderComponentProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, newStatus: string) => void;
  onDeleteOrder: (orderId: string) => void;
  onDownloadOrder: (order: Order) => void;
}

export default function OrderComponent({ orders, onUpdateStatus, onDeleteOrder, onDownloadOrder }: OrderComponentProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "confirmed": return "bg-blue-100 text-blue-800";
      case "preparing": return "bg-orange-100 text-orange-800";
      case "out_for_delivery": return "bg-purple-100 text-purple-800";
      case "delivered": return "bg-green-100 text-green-800";
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
      case "out_for_delivery": return <Package className="h-4 w-4" />;
      case "delivered": return <CheckCircle className="h-4 w-4" />;
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
              <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-600">Orders will appear here when customers place them.</p>
            </div>
          ) : (
            <div className="grid gap-6 lg:gap-8">
              {orders.map((order) => (
                <Card key={order.id} className="w-full">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Order Content */}
                      <div className="flex-1 space-y-4">
                        {/* Order Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <h3 className="font-semibold text-gray-900 text-lg">{order.productTitle}</h3>
                          <Badge className={`${getStatusColor(order.status)} self-start sm:self-auto`}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(order.status)}
                              {order.status}
                            </span>
                          </Badge>
                        </div>
                        
                        {/* Order Details */}
                        <div className="space-y-4">
                          {/* Customer Info */}
                          <div className="space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-gray-600">
                              <User className="h-4 w-4 flex-shrink-0" />
                              <span className="font-medium">Customer:</span>
                              <span>{order.userName}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-gray-600 sm:ml-6">
                              <span>{order.userEmail}</span>
                            </div>
                            {order.customerPhone && (
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-gray-600 sm:ml-6">
                                <span className="font-medium">Phone:</span>
                                <span>{order.customerPhone}</span>
                              </div>
                            )}
                            {order.deliveryAddress && (
                              <div className="flex flex-col sm:flex-row sm:items-start gap-2 text-gray-600 sm:ml-6">
                                <span className="font-medium">Delivery:</span>
                                <span className="break-words">{order.deliveryAddress}</span>
                              </div>
                            )}
                            {order.paymentMethod && (
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-gray-600 sm:ml-6">
                                <span className="font-medium">Payment:</span>
                                <span className="capitalize">{order.paymentMethod.replace('_', ' ')}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Product Info */}
                          <div className="space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-gray-600">
                              <Package className="h-4 w-4 flex-shrink-0" />
                              <span className="font-medium">Category:</span>
                              <span>{order.category}</span>
                              {order.subcategory && (
                                <>
                                  <span>·</span>
                                  <span className="text-orange-600">{order.subcategory}</span>
                                </>
                              )}
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-gray-600 sm:ml-6">
                              <span className="font-medium">Price:</span>
                              <span className="text-green-600 font-semibold">{formatPrice(order.productPrice)}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Order Time */}
                        <div className="pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="h-4 w-4 flex-shrink-0" />
                            <span>Ordered: {formatDate(order.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-3 lg:w-64">
                        {/* Status Update Buttons */}
                        <div className="flex flex-wrap gap-2">
                          {order.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => onUpdateStatus(order.id, "confirmed")}
                                className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
                              >
                                Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => onUpdateStatus(order.id, "cancelled")}
                                className="flex-1 sm:flex-none"
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                          
                          {order.status === "confirmed" && (
                            <Button
                              size="sm"
                              onClick={() => onUpdateStatus(order.id, "preparing")}
                              className="bg-yellow-600 hover:bg-yellow-700 flex-1 sm:flex-none"
                            >
                              Start Preparing
                            </Button>
                          )}
                          
                          {order.status === "preparing" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => onUpdateStatus(order.id, "out_for_delivery")}
                                className="bg-purple-600 hover:bg-purple-700 flex-1 sm:flex-none"
                              >
                                Out for Delivery
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => onUpdateStatus(order.id, "ready")}
                                className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
                              >
                                Mark Ready
                              </Button>
                            </>
                          )}
                          
                          {order.status === "out_for_delivery" && (
                            <Button
                              size="sm"
                              onClick={() => onUpdateStatus(order.id, "delivered")}
                              className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
                            >
                              Mark Delivered
                            </Button>
                          )}
                          
                          {order.status === "ready" && (
                            <Button
                              size="sm"
                              onClick={() => onUpdateStatus(order.id, "completed")}
                              className="bg-emerald-600 hover:bg-emerald-700 flex-1 sm:flex-none"
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                        
                        {/* Download and Delete buttons - always visible */}
                        <div className="flex flex-wrap gap-2 border-t pt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onDownloadOrder(order)}
                            className="text-blue-600 hover:text-blue-700 flex-1 sm:flex-none"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onDeleteOrder(order.id)}
                            className="text-red-600 hover:text-red-700 flex-1 sm:flex-none"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
