"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, FileText, User, Calendar, DollarSign } from "lucide-react";

interface Order {
  id: string;
  productTitle: string;
  productPrice: number;
  userName: string;
  userEmail: string;
  customerPhone?: string;
  status: string;
  paymentStatus: string;
  paymentVerifiedBy?: string;
  paymentVerifiedAt?: string;
  contractUploaded: boolean;
  contractFileUrl?: string;
  contractSubmittedAt?: string;
  createdAt: string;
  product?: {
    user: {
      name: string;
      email: string;
    };
  };
}

export default function PaymentVerificationDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'failed'>('all');

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/verify-payment${filter !== 'all' ? `?status=${filter}` : ''}`);
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (orderId: string) => {
    try {
      // Get admin ID from session or current user
      const adminId = 'current-admin-id'; // This should come from auth context
      
      const response = await fetch('/api/admin/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, adminId }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Payment approved successfully! Client can now upload their signed contract.');
        fetchOrders(); // Refresh orders
      } else {
        alert(data.error || 'Failed to approve payment');
      }
    } catch (error) {
      console.error('Error approving payment:', error);
      alert('Failed to approve payment. Please try again.');
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'verified':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Verified</Badge>;
      case 'failed':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredOrders = orders.filter(order => 
    filter === 'all' || order.paymentStatus === filter
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Payment Verification</h2>
        <div className="flex gap-2">
          {(['all', 'pending', 'verified', 'failed'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
              className={filter === status ? 'bg-blue-600 hover:bg-blue-700' : ''}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-gray-500">No orders found</p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{order.productTitle}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Order #{order.id.slice(-8)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getPaymentStatusBadge(order.paymentStatus)}
                    <p className="text-lg font-bold text-blue-600">
                      Frw {order.productPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Customer:</span>
                      <span>{order.userName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Email:</span>
                      <span>{order.userEmail}</span>
                    </div>
                    {order.customerPhone && (
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">Phone:</span>
                        <span>{order.customerPhone}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Order Date:</span>
                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    {order.paymentVerifiedAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="font-medium">Verified:</span>
                        <span>{new Date(order.paymentVerifiedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    {order.contractSubmittedAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">Contract:</span>
                        <span>Submitted {new Date(order.contractSubmittedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Payment:</span>
                      {getPaymentStatusBadge(order.paymentStatus)}
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Contract:</span>
                      <Badge variant={order.contractUploaded ? 'default' : 'secondary'}>
                        {order.contractUploaded ? 'Uploaded' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                  
                  {order.paymentStatus === 'pending' && (
                    <Button
                      onClick={() => handleVerifyPayment(order.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Payment
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
