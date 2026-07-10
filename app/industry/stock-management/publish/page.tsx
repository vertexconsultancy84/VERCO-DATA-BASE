"use client";

import StockManagementShell from "@/components/StockManagementShell";
import MarketPublishForm from "@/components/MarketPublishForm";
import { ShoppingBag } from "lucide-react";

export default function PublishProductPage() {
  return (
    <StockManagementShell
      eyebrow="Item Management"
      title="Publish Product"
      subtitle="Publish products to the marketplace and track their orders"
      icon={ShoppingBag}
    >
      <MarketPublishForm />
    </StockManagementShell>
  );
}
