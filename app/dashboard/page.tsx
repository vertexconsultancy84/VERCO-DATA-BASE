"use client";

import { useState, useEffect } from "react";
import { requireAdminAuth } from "@/app/actions/auth";
import LogoutButton from "./_components/logout-button";
import AdminStats from "./_components/admin-stats";
import TeamManagement from "./_components/team-management";
import RecordsTable from "./_components/records-table";
import OrderComponent from "./_components/order";
import { getRegistrations } from "../actions/register";
import { getAllProductsForAdmin, getAdminStats, deleteProductByAdmin } from "../actions/admin";
import { getAllTeamMembers } from "../actions/team";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Users2, FileText, ShoppingCart } from "lucide-react";

const allServices = [
  "Management Consultancy",
  "Business Strategy Development",
  "Chemical Manufacturing",
  "Fertilizers & Nitrogen Compounds",
  "Pesticides & Agrochemicals",
  "Paints & Coatings",
  "Soap & Detergents",
  "Global Trading Services",
  "Wholesale Trade",
  "Airtime Service Retail",
  "Cargo Handling",
  "Food Delivery",
  "House & Apartment Rentals",
  "Real Estate Services",
  "Property Management",
  "Construction Services",
  "Interior Design",
  "Landscaping Services",
  "Cleaning Services",
  "Security Services",
  "Transportation Services",
  "Event Planning",
  "Photography & Videography",
  "Web Development",
  "Digital Marketing",
  "IT Support Services",
  "Legal Services",
  "Accounting Services",
  "Consulting Services",
  "Training & Education",
  "Healthcare Services",
  "Fitness & Wellness",
  "Beauty & Salon Services",
  "Automotive Services",
  "Repair & Maintenance",
  "Logistics & Supply Chain",
  "Import & Export Services",
  "Insurance Services",
  "Banking & Financial Services",
  "Telecommunications",
  "Hospitality Services",
  "Tourism Services",
  "Entertainment Services",
  "Other Services"
];

export default function DashboardPage() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      const result = await response.json();
      
      if (result.success) {
        return { success: true, orders: result.orders };
      } else {
        return { success: false, orders: [] };
      }
    } catch (error) {
      console.error("Fetch orders error:", error);
      return { success: false, orders: [] };
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [registrationsRes, productsRes, statsRes, teamRes, ordersRes] = await Promise.all([
        getRegistrations(),
        getAllProductsForAdmin(),
        getAdminStats(),
        getAllTeamMembers(),
        fetchOrders(),
      ]);

      if (registrationsRes.success) {
        setRegistrations(registrationsRes.data || []);
      }

      if (productsRes.success) {
        setProducts(productsRes.data || []);
      }

      if (statsRes.success) {
        setStats(statsRes.data);
      }

      if (teamRes.success) {
        setTeamMembers(teamRes.data || []);
      }

      if (ordersRes.success) {
        setOrders(ordersRes.orders || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Set empty arrays to prevent undefined errors
      setRegistrations([]);
      setProducts([]);
      setTeamMembers([]);
      setOrders([]);
      setStats(null);
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
        // Refresh orders
        const ordersRes = await fetchOrders();
        if (ordersRes.success) {
          setOrders(ordersRes.orders);
        }
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
        // Refresh orders
        const ordersRes = await fetchOrders();
        if (ordersRes.success) {
          setOrders(ordersRes.orders);
        }
      } else {
        alert(result.message || "Failed to delete order");
      }
    } catch (error) {
      console.error("Delete order error:", error);
      alert("Failed to delete order");
    }
  };

  const downloadOrder = (order: any) => {
    // Import the download functions
    import('@/utils/orderDownload').then(({ downloadOrderAsCSV, downloadOrderAsJSON, downloadOrderAsPDF }) => {
      // Default to PDF for professional format
      downloadOrderAsPDF(order);
    });
  };

  const handleDeleteProduct = async (productId: string) => {
    setIsDeleting(true);
    try {
      const result = await deleteProductByAdmin(productId);
      if (result.success) {
        // Refresh data
        await fetchData();
        alert(result.message);
      } else {
        alert(result.message || "Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("An error occurred while deleting the product");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col">
        <div className="flex-grow container mx-auto px-4 py-12 mt-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-grow container mx-auto px-4 py-12 mt-24">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Admin Dashboard
          </h1>
          <LogoutButton />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2 text-xs sm:text-sm">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
            <span className="sm:hidden">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="records" className="flex items-center gap-2 text-xs sm:text-sm">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">All Records</span>
            <span className="sm:hidden">Records</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2 text-xs sm:text-sm">
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Orders</span>
            <span className="sm:hidden">Orders</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2 text-xs sm:text-sm">
            <Users2 className="w-4 h-4" />
            <span className="hidden sm:inline">Team</span>
            <span className="sm:hidden">Team</span>
          </TabsTrigger>
        </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {stats && (
              <AdminStats
                totalUsers={stats.totalUsers}
                totalProducts={stats.totalProducts}
                recentUsers={stats.recentUsers}
                recentProducts={stats.recentProducts}
              />
            )}
          </TabsContent>

          <TabsContent value="records" className="space-y-6">
            <RecordsTable />
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <OrderComponent 
              orders={orders}
              onUpdateStatus={updateOrderStatus}
              onDeleteOrder={deleteOrder}
              onDownloadOrder={downloadOrder}
            />
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <TeamManagement 
              initialTeamMembers={teamMembers}
              onUpdate={fetchData}
            />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
