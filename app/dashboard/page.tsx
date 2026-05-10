"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import LogoutButton from "./_components/logout-button";
import AdminStats from "./_components/admin-stats";
import TeamManagement from "./_components/team-management";
import RecordsTable from "./_components/records-table";
import OrderComponent from "./_components/order";
import ContractsTable from "./_components/contracts-table";
import { getAdminStats } from "../actions/admin";
import { getAllTeamMembers } from "../actions/team";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Users2, FileText, ShoppingCart } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("overview");

  const ordersLoadRef = useRef<Promise<void> | null>(null);
  const teamLoadRef = useRef<Promise<void> | null>(null);

  const fetchOrdersJson = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/orders");
      const result = await response.json();
      if (result.success) {
        setOrders(result.orders || []);
        return true;
      }
      setOrders([]);
      return false;
    } catch (error) {
      console.error("Fetch orders error:", error);
      setOrders([]);
      return false;
    }
  }, []);

  /** Deduped: orders fetch shared by prefetch + Orders tab */
  const ensureOrdersLoaded = useCallback(async () => {
    if (ordersLoadRef.current) return ordersLoadRef.current;
    ordersLoadRef.current = (async () => {
      setOrdersLoading(true);
      try {
        await fetchOrdersJson();
      } finally {
        setOrdersLoading(false);
        ordersLoadRef.current = null;
      }
    })();
    return ordersLoadRef.current;
  }, [fetchOrdersJson]);

  const ensureTeamLoaded = useCallback(async () => {
    if (teamLoadRef.current) return teamLoadRef.current;
    teamLoadRef.current = (async () => {
      setTeamLoading(true);
      try {
        const teamRes = await getAllTeamMembers();
        if (teamRes.success) {
          setTeamMembers(teamRes.data || []);
        }
      } finally {
        setTeamLoading(false);
        teamLoadRef.current = null;
      }
    })();
    return teamLoadRef.current;
  }, []);

  // Stats first (overview paints immediately); then orders + team load without delaying timers.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatsLoading(true);
      try {
        const statsRes = await getAdminStats();
        if (!cancelled && statsRes.success) {
          setStats(statsRes.data);
        }
      } catch (e) {
        console.error("Dashboard stats error:", e);
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
      if (!cancelled) {
        void ensureOrdersLoaded();
        void ensureTeamLoaded();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ensureOrdersLoaded, ensureTeamLoaded]);

  // Opening Orders / Team before stats finishes still kicks those loaders with dedupe.
  useEffect(() => {
    if (activeTab === "orders") void ensureOrdersLoaded();
    if (activeTab === "team") void ensureTeamLoaded();
  }, [activeTab, ensureOrdersLoaded, ensureTeamLoaded]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchOrdersJson();
      } else {
        alert(result.message || "Failed to update order status");
      }
    } catch (error) {
      console.error("Update order error:", error);
      alert("Failed to update order status");
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this order? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const result = await response.json();

      if (result.success) {
        alert("Order deleted successfully");
        await fetchOrdersJson();
      } else {
        alert(result.message || "Failed to delete order");
      }
    } catch (error) {
      console.error("Delete order error:", error);
      alert("Failed to delete order");
    }
  };

  const downloadOrder = (order: any) => {
    import("@/utils/orderDownload").then(
      ({ downloadOrderAsPDF }) => {
        downloadOrderAsPDF(order);
      }
    );
  };

  const handleTeamUpdated = useCallback(async () => {
    await ensureTeamLoaded();
  }, [ensureTeamLoaded]);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Admin Dashboard
        </h1>
        <LogoutButton />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
          <TabsTrigger
            value="overview"
            className="flex items-center gap-2 text-xs sm:text-sm"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
            <span className="sm:hidden">Overview</span>
          </TabsTrigger>
          <TabsTrigger
            value="records"
            className="flex items-center gap-2 text-xs sm:text-sm"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">All Records</span>
            <span className="sm:hidden">Records</span>
          </TabsTrigger>
          <TabsTrigger
            value="contracts"
            className="flex items-center gap-2 text-xs sm:text-sm"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">Contracts</span>
            <span className="sm:hidden">Contracts</span>
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            className="flex items-center gap-2 text-xs sm:text-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Orders</span>
            <span className="sm:hidden">Orders</span>
          </TabsTrigger>
          <TabsTrigger
            value="team"
            className="flex items-center gap-2 text-xs sm:text-sm"
          >
            <Users2 className="w-4 h-4" />
            <span className="hidden sm:inline">Team</span>
            <span className="sm:hidden">Team</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {statsLoading ? (
            <div className="rounded-lg border border-orange-100 bg-orange-50/40 px-6 py-12 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />
              <p className="mt-4 text-sm text-gray-600">Loading overview…</p>
            </div>
          ) : stats ? (
            <AdminStats
              totalUsers={stats.totalUsers}
              totalProducts={stats.totalProducts}
              recentUsers={stats.recentUsers}
              recentProducts={stats.recentProducts}
            />
          ) : (
            <p className="text-sm text-red-600">Could not load statistics.</p>
          )}
        </TabsContent>

        <TabsContent value="records" className="space-y-6">
          <RecordsTable />
        </TabsContent>

        <TabsContent value="contracts" className="space-y-6">
          <ContractsTable />
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          {ordersLoading ? (
            <div className="rounded-lg border px-6 py-10 text-center text-sm text-gray-600">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />
              Loading orders…
            </div>
          ) : (
            <OrderComponent
              orders={orders}
              onUpdateStatus={updateOrderStatus}
              onDeleteOrder={deleteOrder}
              onDownloadOrder={downloadOrder}
            />
          )}
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          {teamLoading ? (
            <div className="rounded-lg border px-6 py-10 text-center text-sm text-gray-600">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />
              Loading team…
            </div>
          ) : (
            <TeamManagement
              initialTeamMembers={teamMembers}
              onUpdate={handleTeamUpdated}
            />
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
