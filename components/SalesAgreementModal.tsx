"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SalesAgreementForm from "./SalesAgreementForm";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  subcategory: string;
  propertyType?: string | null;
  province?: string | null;
  district?: string | null;
  sector?: string | null;
  village?: string | null;
  user?: {
    name: string;
    email: string;
    phone?: string;
  };
}

interface SalesAgreementModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function SalesAgreementModal({ product, isOpen, onClose }: SalesAgreementModalProps) {
  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden border-none bg-transparent">
        <DialogHeader className="sr-only">
          <DialogTitle>Sales and Purchase Agreement</DialogTitle>
        </DialogHeader>
        <SalesAgreementForm 
          product={product} 
          onSuccess={() => {
            alert("Sales Agreement submitted successfully! Our team will review it and contact you for the next steps.");
            onClose();
          }}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
