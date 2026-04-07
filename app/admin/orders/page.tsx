"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import OrderComponent from "../../dashboard/_components/order";

export default function AdminOrdersDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      const result = await response.json();
      
      if (result.success) {
        setOrders(result.orders);
      } else {
        setError(result.message || "Failed to fetch orders");
      }
    } catch (error) {
      console.error("Fetch orders error:", error);
      setError("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        fetchOrders(); // Refresh orders
      } else {
        alert(result.message || "Failed to update order status");
      }
    } catch (error) {
      console.error("Update order error:", error);
      alert("Failed to update order status");
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch('/api/orders', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Order deleted successfully');
        fetchOrders(); // Refresh orders
      } else {
        alert(result.message || "Failed to delete order");
      }
    } catch (error) {
      console.error("Delete order error:", error);
      alert("Failed to delete order");
    }
  };

  const downloadOrder = (order: any) => {
    // Import download functions
    import('@/utils/orderDownload').then(({ downloadOrderAsCSV, downloadOrderAsJSON, downloadOrderAsPDF }) => {
      // Default to PDF for professional format
      downloadOrderAsPDF(order);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-700">{error}</p>
            <Button onClick={fetchOrders} className="mt-4">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Orders Dashboard</h1>
          <p className="text-gray-600">Manage customer orders and track their status</p>
        </div>

        {/* Order Component */}
        <OrderComponent 
          orders={orders} 
          onUpdateStatus={updateOrderStatus}
          onDeleteOrder={deleteOrder}
          onDownloadOrder={downloadOrder}
        />
      </div>
    </div>
  );
}
