"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import LeaseAgreementForm from "./LeaseAgreementForm";
import OwnerDetailsModal from "./OwnerDetailsModal";

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

interface LeaseAgreementModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function LeaseAgreementModal({
  product,
  isOpen,
  onClose,
}: LeaseAgreementModalProps) {
  const [isOwnerModalOpen, setIsOwnerModalOpen] = React.useState(false);

  React.useEffect(() => {
    const handleOpenOwnerModal = () => {
      setIsOwnerModalOpen(true);
    };
    window.addEventListener('openOwnerModal', handleOpenOwnerModal);
    return () => window.removeEventListener('openOwnerModal', handleOpenOwnerModal);
  }, []);

  if (!product) return null;

  const handleSuccess = () => {
    alert("Agreement submitted successfully! Vertex Consulting will review and contact you shortly.");
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-[95vw] md:max-w-4xl p-0 overflow-hidden bg-white border-none shadow-2xl rounded-xl">
          <div className="sr-only">
            <DialogTitle>Residential Lease Agreement</DialogTitle>
            <DialogDescription>
              Complete the lease agreement for {product.title}
            </DialogDescription>
          </div>
          <LeaseAgreementForm 
            product={product} 
            onSuccess={handleSuccess} 
            onCancel={onClose} 
          />
        </DialogContent>
      </Dialog>

      <OwnerDetailsModal 
        product={product} 
        isOpen={isOwnerModalOpen} 
        onClose={() => setIsOwnerModalOpen(false)} 
      />
    </>
  );
}
