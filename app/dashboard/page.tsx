"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import LogoutButton from "./_components/logout-button";
import AdminStats from "./_components/admin-stats";
import TeamManagement from "./_components/team-management";
import RecordsTable from "./_components/records-table";
import OrderComponent from "./_components/order";
import ContractsTable from "./_components/contracts-table";
import VisitorsTable from "./_components/visitors-table";
import UsersTable from "./_components/users-table";
import AnnouncementsManager from "./_components/announcements-manager";
import { getAdminStats } from "../actions/admin";
import { getAllTeamMembers } from "../actions/team";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { BarChart3, Users2, FileText, ShoppingCart, Eye, UserCog, Megaphone, LayoutDashboard } from "lucide-react";
import clsx from "clsx";

const NAV_ITEMS = [
  { value: "overview",      label: "Overview",      icon: BarChart3 },
  { value: "records",       label: "All Records",   icon: FileText },
  { value: "contracts",     label: "Contracts",     icon: FileText },
  { value: "orders",        label: "Orders",        icon: ShoppingCart },
  { value: "team",          label: "Team",          icon: Users2 },
  { value: "visitors",      label: "Visitors",      icon: Eye },
  { value: "users",         label: "Users",         icon: UserCog },
  { value: "announcements", label: "Announcements", icon: Megaphone },
] as const;

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);

  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [approvingUserId, setApprovingUserId] = useState<string | null>(null);

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

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success) setUsers(data.users || []);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const handleApproveUser = async (userId: string) => {
    setApprovingUserId(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: true }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, approved: true } : u))
        );
      } else {
        alert(data.message || "Failed to approve user.");
      }
    } catch {
      alert("Failed to approve user.");
    } finally {
      setApprovingUserId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setIsDeletingUser(true);
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      } else {
        alert(data.message || "Failed to delete user.");
      }
    } catch {
      alert("Failed to delete user.");
    } finally {
      setIsDeletingUser(false);
    }
  };

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

  // Opening Orders / Team / Users before stats finishes still kicks those loaders.
  useEffect(() => {
    if (activeTab === "orders") void ensureOrdersLoaded();
    if (activeTab === "team") void ensureTeamLoaded();
    if (activeTab === "users") void loadUsers();
  }, [activeTab, ensureOrdersLoaded, ensureTeamLoaded, loadUsers]);

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

  const activeItem = NAV_ITEMS.find((i) => i.value === activeTab) ?? NAV_ITEMS[0];

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="flex flex-col lg:flex-row gap-6 items-start"
    >
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="w-full lg:w-64 shrink-0">
        <div className="lg:sticky lg:top-28 space-y-4">
          {/* Brand card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#023E4A] to-[#0097A7] p-5 text-white shadow-lg">
            <div className="pointer-events-none absolute -top-10 -right-8 w-28 h-28 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-white/70">Admin</p>
                <h1 className="text-lg font-bold leading-tight">Dashboard</h1>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-1">
            {NAV_ITEMS.map(({ value, label, icon: Icon }) => {
              const active = activeTab === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setActiveTab(value)}
                  className={clsx(
                    "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all",
                    active
                      ? "bg-gradient-to-r from-[#023E4A] to-[#0097A7] text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <Icon className={clsx("w-4 h-4 shrink-0", active ? "text-white" : "text-[#0097A7]")} />
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 w-full space-y-6">
        {/* Content header */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
          <div className="w-11 h-11 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0">
            <activeItem.icon className="w-5 h-5 text-[#023E4A]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight">{activeItem.label}</h2>
            <p className="text-sm text-gray-500">Admin Dashboard</p>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-6 mt-0">
          {statsLoading ? (
            <div className="rounded-lg border border-cyan-100 bg-cyan-50/40 px-6 py-12 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[#023E4A] border-t-transparent" />
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
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#023E4A] border-t-transparent" />
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
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#023E4A] border-t-transparent" />
              Loading team…
            </div>
          ) : (
            <TeamManagement
              initialTeamMembers={teamMembers}
              onUpdate={handleTeamUpdated}
            />
          )}
        </TabsContent>

        <TabsContent value="visitors" className="space-y-6">
          <VisitorsTable />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {usersLoading ? (
            <div className="rounded-lg border px-6 py-10 text-center text-sm text-gray-600">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#023E4A] border-t-transparent" />
              Loading users…
            </div>
          ) : (
            <UsersTable
              users={users}
              onDeleteUser={handleDeleteUser}
              isDeleting={isDeletingUser}
              onApproveUser={handleApproveUser}
              approvingUserId={approvingUserId}
            />
          )}
        </TabsContent>

        <TabsContent value="announcements" className="space-y-6">
          <AnnouncementsManager />
        </TabsContent>
      </div>
    </Tabs>
  );
}
