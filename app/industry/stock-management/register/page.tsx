"use client";

import StockManagementShell from "@/components/StockManagementShell";
import ItemNameManager from "@/components/ItemNameManager";
import { Tag } from "lucide-react";

export default function RegisterItemNamePage() {
  return (
    <StockManagementShell
      eyebrow="Item Management"
      title="Register Item Names"
      subtitle="Register product names and photos used across the price calculator and stock"
      icon={Tag}
    >
      <ItemNameManager />
    </StockManagementShell>
  );
}
