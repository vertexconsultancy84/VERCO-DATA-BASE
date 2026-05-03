"use client";

import React from "react";
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  CreditCard,
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface OwnerDetailsModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function OwnerDetailsModal({ product, isOpen, onClose }: OwnerDetailsModalProps) {
  if (!product) return null;

  const ownerInfo = [
    { label: "Full Name", value: product.ownerFullName || product.user?.name || "Not provided", icon: User },
    { label: "Telephone", value: product.contactNumber || product.whatsappNumber || "Not provided", icon: Phone },
    { label: "Email", value: product.user?.email || "Not provided", icon: Mail },
    { label: "Current Address", value: product.ownerAddress || "Not provided", icon: MapPin },
    { label: "Nationality", value: product.ownerNationality || "Not provided", icon: Globe },
    { label: "National ID / Passport", value: product.ownerID || "Not provided", icon: CreditCard },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white rounded-2xl shadow-2xl border-0 overflow-hidden p-0">
        <DialogHeader className="bg-blue-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <User className="w-6 h-6" /> Owner Information
            </DialogTitle>
          </div>
          <DialogDescription className="text-blue-100 mt-2">
            Use these details to fill out the Landlord section of your Lease Agreement.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {ownerInfo.map((info, index) => (
              <div key={index} className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="bg-blue-50 p-2 rounded-lg">
                  <info.icon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{info.label}</p>
                  <p className="text-gray-800 font-medium">{info.value}</p>
                </div>
              </div>
            ))}
          </div>

          <Separator className="bg-gray-100" />

          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <p className="text-xs text-blue-700 font-medium leading-relaxed">
              <strong>Note:</strong> This information is provided by the property owner for the purpose of legal documentation. Please handle it with confidentiality.
            </p>
          </div>

          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
            onClick={onClose}
          >
            Got it, thanks!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
