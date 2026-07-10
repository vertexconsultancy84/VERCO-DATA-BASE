"use client";

import StockManagementShell from "@/components/StockManagementShell";
import StockInventoryDashboard from "@/components/StockInventoryDashboard";
import { Boxes } from "lucide-react";

export default function StockManagementPage() {
  return (
    <StockManagementShell
      eyebrow="Item Management Overview"
      title="Item Management"
      subtitle="Monitor stock levels, alerts, reservations and inventory value at a glance"
      icon={Boxes}
    >
      <StockInventoryDashboard />
    </StockManagementShell>
  );
}
