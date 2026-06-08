"use client";

import React, { useState } from "react";
import {
  Building,
  User,
  MapPin,
  Calendar,
  DollarSign,
  ShieldCheck,
  FileText,
  Clock,
  Wrench,
  AlertTriangle,
  Download,
  Printer,
  Stamp,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

interface LeaseAgreementFormProps {
  product: Product;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function LeaseAgreementForm({ product, onSuccess, onCancel }: LeaseAgreementFormProps) {
  const [formData, setFormData] = useState({
    effectiveDate: "",

    // Landlord
    landlordName: (product as any).ownerFullName || product.user?.name || "",
    landlordNationality: (product as any).ownerNationality || "",
    landlordID: (product as any).ownerID || "",
    landlordAddress: (product as any).ownerAddress || "",
    landlordContact: product.user?.phone || product.user?.email || "",

    // Tenant
    tenantName: "",
    tenantNationality: "",
    tenantID: "",
    tenantAddress: "",
    tenantContact: "",

    // Term
    commencementDate: "",
    termMonths: "12",
    endDate: "",

    // Rent
    monthlyRent: product.price != null ? product.price.toString() : "",
    paymentDueDate: "5",
    paymentMode: "Bank Transfer",
    latePenalty: "5% per month",
    lateGraceDays: "5",

    // Utilities
    utilities: {
      hygiene: false,
      security: false,
      electricity: false,
      water: false,
      internet: false
    },

    // Termination
    noticePeriod: "30",

    // Witnesses
    witness1Name: "",
    witness1ID: "",
    witness2Name: "",
    witness2ID: "",

    // Date of signing
    signingDate: "",

    // Validation
    acceptedTerms: false,
    signedContractFile: null as File | null,
    hasDownloaded: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUtilityChange = (key: keyof typeof formData.utilities) => {
    setFormData(prev => ({
      ...prev,
      utilities: {
        ...prev.utilities,
        [key]: !prev.utilities[key]
      }
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024 && !file.type.startsWith('image/')) {
        alert("The selected file is very large (" + (file.size / 1024 / 1024).toFixed(1) + "MB). If it is a PDF, please try to compress it or take a photo instead, as the limit is 10MB for documents.");
      }
      setFormData(prev => ({ ...prev, signedContractFile: file }));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    let contractFileUrl = null;
    let fileToUpload = formData.signedContractFile;

    if (fileToUpload) {
      // Compress if it's a large image (> 2MB)
      if (fileToUpload.type.startsWith('image/') && fileToUpload.size > 2 * 1024 * 1024) {
        try {
          console.log(`Compressing large image: ${fileToUpload.size / 1024 / 1024}MB`);
          const compressedBlob = await new Promise<Blob>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(fileToUpload!);
            reader.onload = (event) => {
              const img = new Image();
              img.src = event.target?.result as string;
              img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Max dimensions 2500px
                const maxDim = 2500;
                if (width > maxDim || height > maxDim) {
                  if (width > height) {
                    height = Math.round((height * maxDim) / width);
                    width = maxDim;
                  } else {
                    width = Math.round((width * maxDim) / height);
                    height = maxDim;
                  }
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                  if (blob) resolve(blob);
                  else reject(new Error('Canvas to Blob failed'));
                }, 'image/jpeg', 0.7); // 0.7 quality
              };
              img.onerror = reject;
            };
            reader.onerror = reject;
          });
          
          fileToUpload = new File([compressedBlob], fileToUpload.name, { type: 'image/jpeg' });
          console.log(`Compressed to: ${fileToUpload.size / 1024 / 1024}MB`);
        } catch (error) {
          console.error('Compression failed, uploading original:', error);
        }
      }

      try {
        const uploadData = new FormData();
        uploadData.append('file', fileToUpload);
        const uploadResponse = await fetch('/api/upload-contract-file', {
          method: 'POST',
          body: uploadData,
        });
        const uploadResult = await uploadResponse.json();
        if (uploadResult.success && uploadResult.url) {
          contractFileUrl = uploadResult.url;
        } else {
          console.error("Upload failed", uploadResult);
          alert("Contract upload failed: " + (uploadResult.error || "Unknown error"));
        }
      } catch (e) {
        console.error("Error uploading contract:", e);
        alert("Error uploading contract. Please try again.");
      }
    }

    // Submit the contract request
    try {
      const response = await fetch('/api/submit-contract-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          tenantName: formData.tenantName || "Client",
          tenantNationality: formData.tenantNationality,
          tenantID: formData.tenantID,
          tenantAddress: formData.tenantAddress,
          tenantContact: formData.tenantContact || "N/A",
          userName: formData.tenantName || "Client",
          userEmail: formData.tenantContact && formData.tenantContact.includes('@') 
            ? formData.tenantContact 
            : `${(formData.tenantName || "client").replace(/\s+/g, '').toLowerCase()}@example.com`,
          customerPhone: formData.tenantContact || "N/A",
          deliveryAddress: formData.tenantAddress,
          village: product.village,
          productTitle: product.title,
          productPrice: product.price,
          category: product.category,
          subcategory: product.subcategory,
          contractFileUrl: contractFileUrl
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
         console.error('Error submitting contract request:', data.error);
         alert("Error submitting contract request: " + data.error);
      } else {
         alert("Contract successfully submitted! Admin will contact you shortly.");
         if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error('Error submitting contract request:', error);
      alert("Error submitting contract request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById("pdf-content");
    if (!element) return;

    setIsSubmitting(true);
    try {
      // Create a temporary container to render the full content for PDF
      // This ensures we get the full document even if it's scrollable
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Lease_Agreement_${product.title.replace(/\s+/g, '_')}.pdf`);
      setFormData(prev => ({ ...prev, hasDownloaded: true }));
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fullAddress = [
    product.village,
    product.sector,
    product.district,
    product.province
  ].filter(Boolean).join(", ") || product.title;

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-xl overflow-hidden border border-gray-100 flex flex-col h-[85vh]">
      {/* Header / Toolbar */}
      <div className="bg-gray-50 border-b p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-800 uppercase tracking-tight">Residential Lease Agreement</h1>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownloadPDF}
            disabled={isSubmitting}
            className="bg-blue-600 text-white hover:bg-blue-700 border-none"
          >
            <Download className="w-4 h-4 mr-2" /> {isSubmitting ? "Generating..." : "Download PDF"}
          </Button>
        </div>
      </div>

      {/* Contract Content */}
      <div className="flex-1 overflow-y-auto p-8 bg-white document-content">
        {/* Instructions for Client */}
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-4 shadow-sm print:hidden">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Info className="w-5 h-5 text-white" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-blue-900">Important: Landlord Details</h3>
            <p className="text-sm text-blue-700 leading-relaxed">
              Before you start filling this form, please ensure you have the **Landlord's information** (Full Name, ID, Nationality, and Address).
            </p>
            <div className="mt-3 p-3 bg-white/50 rounded-lg border border-blue-100">
              <p className="text-xs font-bold text-blue-800 uppercase mb-2">Process Overview:</p>
              <ul className="text-xs text-blue-700 space-y-1 list-disc ml-4">
                <li>Review the contract details below.</li>
                <li>Download the agreement as a PDF.</li>
                <li>Print the document and fill the remaining details **manually using a pen**.</li>
                <li>Sign the document physically along with any witnesses.</li>
                <li>Scan or take a clear photo and **upload the signed copy** below to submit.</li>
              </ul>
            </div>
            <div className="pt-3">
              <Button
                variant="outline"
                size="sm"
                className="bg-white border-blue-200 text-blue-600 hover:bg-blue-100 shadow-sm"
                onClick={() => (window as any).dispatchEvent(new CustomEvent('openOwnerModal', { detail: { product } }))}
              >
                <User className="w-4 h-4 mr-2" />
                View Landlord Info Now
              </Button>
            </div>
          </div>
        </div>

        <div id="pdf-content" className="contract-document">
          <header className="contract-document-header">
            <p className="contract-document-header-kicker">Vertex Consulting · Official Agreement</p>
            <h1 className="contract-document-header-title">Residential Lease Agreement</h1>
            <div className="contract-document-meta">
              <span>
                Premises: <strong className="text-slate-700">{product.title}</strong>
              </span>
              <span className="hidden sm:inline text-slate-300" aria-hidden>
                |
              </span>
              <span>Effective date as stated in the preamble below</span>
            </div>
          </header>

          <div className="space-y-8 text-[15px] leading-[1.68] text-slate-900">

          {/* Introductory Paragraph */}
          <section className="text-justify leading-relaxed">
            <p>
              This Residential Lease Agreement (“Agreement”) is made and entered into on this
              <span className="inline-block border-b border-black px-2 mx-1 font-medium min-w-[100px]">
                {formData.effectiveDate ? new Date(formData.effectiveDate).toLocaleDateString() : "___ / ___ / 20___"}
              </span>
              (“Effective Date”), by and between:
            </p>
          </section>

          <Separator />

          {/* 1. PARTIES */}
          <section>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 uppercase">
              <User className="w-5 h-5 text-blue-600" /> 1. PARTIES
            </h2>

            <div className="contract-parties-grid">
              {/* Landlord */}
              <div className="space-y-4">
                <h3 className="font-semibold text-blue-900 border-b border-slate-300 pb-1 inline-block font-sans tracking-wide">
                  1.1 Landlord (Lessor)
                </h3>
                <div className="space-y-2">
                  <div className="relative mb-4">
                    <Label className="text-[10px] font-bold text-blue-900 uppercase tracking-wide">Full Name</Label>
                    <Input name="landlordName" value={formData.landlordName} onChange={handleInputChange} className="border-t-0 border-x-0 border-b-2 border-gray-400 rounded-none px-0 focus-visible:ring-0 h-10 bg-transparent text-gray-800" />
                  </div>
                  <div className="relative mb-4">
                    <Label className="text-[10px] font-bold text-blue-900 uppercase tracking-wide">Nationality</Label>
                    <Input name="landlordNationality" value={formData.landlordNationality} onChange={handleInputChange} className="border-t-0 border-x-0 border-b-2 border-gray-400 rounded-none px-0 focus-visible:ring-0 h-10 bg-transparent text-gray-800" />
                  </div>
                  <div className="relative mb-4">
                    <Label className="text-[10px] font-bold text-blue-900 uppercase tracking-wide">National ID / Passport No</Label>
                    <Input name="landlordID" value={formData.landlordID} onChange={handleInputChange} className="border-t-0 border-x-0 border-b-2 border-gray-400 rounded-none px-0 focus-visible:ring-0 h-10 bg-transparent text-gray-800" />
                  </div>
                  <div className="relative mb-4">
                    <Label className="text-[10px] font-bold text-blue-900 uppercase tracking-wide">Current Address</Label>
                    <Input name="landlordAddress" value={formData.landlordAddress} onChange={handleInputChange} className="border-t-0 border-x-0 border-b-2 border-gray-400 rounded-none px-0 focus-visible:ring-0 h-10 bg-transparent text-gray-800" />
                  </div>
                  <div className="relative mb-4">
                    <Label className="text-[10px] font-bold text-blue-900 uppercase tracking-wide">Telephone / Email</Label>
                    <Input name="landlordContact" value={formData.landlordContact} onChange={handleInputChange} className="border-t-0 border-x-0 border-b-2 border-gray-400 rounded-none px-0 focus-visible:ring-0 h-10 bg-transparent text-gray-800" />
                  </div>
                </div>
              </div>

              {/* Tenant */}
              <div className="space-y-4">
                <h3 className="font-semibold text-blue-900 border-b border-slate-300 pb-1 inline-block font-sans tracking-wide">
                  1.2 Tenant (Lessee)
                </h3>
                <div className="space-y-2">
                  <div className="relative mb-4">
                    <Label className="text-[10px] font-bold text-blue-900 uppercase tracking-wide">Full Legal Name</Label>
                    <Input name="tenantName" value={formData.tenantName} onChange={handleInputChange} className="border-t-0 border-x-0 border-b-2 border-blue-400 rounded-none px-0 focus-visible:ring-0 h-10 bg-transparent text-gray-800" />
                  </div>
                  <div className="relative mb-4">
                    <Label className="text-[10px] font-bold text-blue-900 uppercase tracking-wide">Nationality</Label>
                    <Input name="tenantNationality" value={formData.tenantNationality} onChange={handleInputChange} className="border-t-0 border-x-0 border-b-2 border-blue-400 rounded-none px-0 focus-visible:ring-0 h-10 bg-transparent text-gray-800" />
                  </div>
                  <div className="relative mb-4">
                    <Label className="text-[10px] font-bold text-blue-900 uppercase tracking-wide">National ID / Passport No</Label>
                    <Input name="tenantID" value={formData.tenantID} onChange={handleInputChange} className="border-t-0 border-x-0 border-b-2 border-blue-400 rounded-none px-0 focus-visible:ring-0 h-10 bg-transparent text-gray-800" />
                  </div>
                  <div className="relative mb-4">
                    <Label className="text-[10px] font-bold text-blue-900 uppercase tracking-wide">Current Address</Label>
                    <Input name="tenantAddress" value={formData.tenantAddress} onChange={handleInputChange} className="border-t-0 border-x-0 border-b-2 border-blue-400 rounded-none px-0 focus-visible:ring-0 h-10 bg-transparent text-gray-800" />
                  </div>
                  <div className="relative mb-4">
                    <Label className="text-[10px] font-bold text-blue-900 uppercase tracking-wide">Telephone / Email</Label>
                    <Input name="tenantContact" value={formData.tenantContact} onChange={handleInputChange} className="border-t-0 border-x-0 border-b-2 border-blue-400 rounded-none px-0 focus-visible:ring-0 h-10 bg-transparent text-gray-800" />
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm italic mt-4 text-gray-600">The Landlord and Tenant are collectively referred to as the “Parties” and individually as a “Party.”</p>
          </section>

          <Separator />

          {/* 2. PREMISES */}
          <section>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 uppercase">
              <MapPin className="w-5 h-5 text-blue-600" /> 2. PREMISES
            </h2>
            <p className="mb-4">The Landlord hereby leases to the Tenant the residential property located at:</p>
            <div className="contract-callout-box mb-4 font-sans">
              <p className="font-bold text-lg border-b border-slate-300 pb-2 mb-2">{product.title}</p>
              <p className="text-slate-600">{fullAddress}</p>
            </div>
            <p className="text-sm">This includes all buildings, fixtures, fittings, installations, and improvements (the “Premises”).</p>
          </section>

          <Separator />

          {/* 3. TERM OF LEASE */}
          <section>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 uppercase">
              <Calendar className="w-5 h-5 text-blue-600" /> 3. TERM OF LEASE
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div className="relative">
                <Label className="text-xs uppercase text-gray-500">Commencement Date</Label>
                <div className="relative mt-1">
                  <Input name="commencementDate" value={formData.commencementDate} onChange={handleInputChange} className="h-10 border-t-0 border-x-0 border-b-2 border-gray-400 rounded-none px-0 bg-transparent focus-visible:ring-0 w-full" />
                  {!formData.commencementDate && <span className="absolute left-0 bottom-2 text-xs text-gray-400 tracking-[0.3em]">.../.../.....</span>}
                </div>
              </div>
              <div className="relative">
                <Label className="text-xs uppercase text-gray-500">Duration (Months)</Label>
                <Input type="number" name="termMonths" value={formData.termMonths} onChange={handleInputChange} className="h-10 border-t-0 border-x-0 border-b-2 border-gray-400 rounded-none px-0 bg-transparent focus-visible:ring-0 w-full" />
              </div>
              <div className="relative">
                <Label className="text-xs uppercase text-gray-500">End Date</Label>
                <div className="relative mt-1">
                  <Input name="endDate" value={formData.endDate} onChange={handleInputChange} className="h-10 border-t-0 border-x-0 border-b-2 border-gray-400 rounded-none px-0 bg-transparent focus-visible:ring-0 w-full" />
                  {!formData.endDate && <span className="absolute left-0 bottom-2 text-xs text-gray-400 tracking-[0.3em]">.../.../.....</span>}
                </div>
              </div>
            </div>
            <p className="text-sm mt-4 italic text-gray-600">unless terminated earlier in accordance with this Agreement.</p>
          </section>

          <Separator />

          {/* 4. RENT AND PAYMENT TERMS */}
          <section>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 uppercase">
              <DollarSign className="w-5 h-5 text-blue-600" /> 4. RENT AND PAYMENT TERMS
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label>4.1 Monthly Rent</Label>
                  <div className="relative">
                    <span className="absolute left-0 top-2.5 text-xs font-bold text-gray-500">FRW</span>
                    <Input name="monthlyRent" value={formData.monthlyRent} onChange={handleInputChange} className="pl-10 border-t-0 border-x-0 border-b-2 border-gray-300 rounded-none focus-visible:ring-0 h-10" />
                  </div>
                </div>
                <div className="space-y-1 relative">
                  <Label className="text-xs text-gray-500">4.2 Payment Due Date</Label>
                  <div className="flex items-center gap-2">
                    <span>On or before the</span>
                    <Input name="paymentDueDate" value={formData.paymentDueDate} onChange={handleInputChange} className="w-20 h-8 border-t-0 border-x-0 border-b rounded-none px-0 focus-visible:ring-0" />
                    <span>day of each month</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label>4.3 Mode of Payment</Label>
                  <Input name="paymentMode" value={formData.paymentMode} onChange={handleInputChange} className="border-t-0 border-x-0 border-b-2 border-gray-300 rounded-none focus-visible:ring-0 h-10" />
                </div>
                <div className="space-y-1 relative">
                  <Label className="text-xs text-gray-500">4.4 Late Payment Penalty</Label>
                  <div className="flex items-center gap-2">
                    <span>After</span>
                    <Input name="lateGraceDays" value={formData.lateGraceDays} onChange={handleInputChange} className="w-16 h-8 border-t-0 border-x-0 border-b rounded-none px-0 focus-visible:ring-0 text-center" />
                    <span>days:</span>
                    <Input name="latePenalty" value={formData.latePenalty} onChange={handleInputChange} className="flex-1 h-8 border-t-0 border-x-0 border-b rounded-none px-0 focus-visible:ring-0" />
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm font-semibold flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              4.5 Continued failure to pay rent shall constitute a material breach and may result in termination of this Agreement
            </p>
          </section>

          <Separator />

          {/* 5. UTILITIES AND RESPONSIBILITIES */}
          <section>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 uppercase">
              <Wrench className="w-5 h-5 text-blue-600" /> 5. UTILITIES AND RESPONSIBILITIES
            </h2>
            <p className="mb-4 text-sm italic">The Tenant shall be responsible for the payment of the following utilities (indicate Yes/No):</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(formData.utilities).map(([key, value]) => (
                <div
                  key={key}
                  className={`flex flex-col items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${value ? 'bg-blue-50 border-blue-400 shadow-sm' : 'hover:bg-gray-50'}`}
                  onClick={() => handleUtilityChange(key as any)}
                >
                  <span className={`capitalize text-sm font-bold ${value ? 'text-blue-700' : 'text-gray-600'}`}>{key}</span>
                  <Checkbox
                    checked={value}
                    className="pointer-events-none" // Disable pointer events on checkbox to let div handle clicks
                  />
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* 6 - 8 Sections (Text Only) */}
          <div className="grid grid-cols-1 gap-6">
            <section>
              <h2 className="text-lg font-bold mb-2">6. ALTERATIONS AND IMPROVEMENTS</h2>
              <p className="text-justify text-sm">The Tenant shall not make any structural alterations or improvements to the Premises without prior written consent from the Landlord.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">7. ACCESS AND INSPECTION</h2>
              <p className="text-justify text-sm">The Landlord or their authorized agent may enter the Premises with reasonable notice for inspection, repairs, or other lawful purposes. Immediate access is permitted in case of emergencies.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">8. INSURANCE AND LIABILITY</h2>
              <p className="text-sm mb-2">8.1 The Tenant is responsible for insuring their personal property</p>
              <p className="text-sm italic">8.2 The Landlord shall not be liable for loss or damage to the Tenant’s belongings except where caused by proven negligence</p>
            </section>
          </div>

          <Separator />

          {/* 9. TERMINATION */}
          <section>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 uppercase">
              <Clock className="w-5 h-5 text-blue-600" /> 9. TERMINATION
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span>9.1 Either Party may terminate this Agreement by giving</span>
                <Input name="noticePeriod" value={formData.noticePeriod} onChange={handleInputChange} className="w-16 h-8 text-center" />
                <span>days’ written notice</span>
              </div>
              <p className="text-sm">9.2 Immediate termination may occur in the event of a material breach</p>
              <p className="text-sm">9.3 Upon termination, the Tenant shall vacate and return the Premises in good condition</p>
            </div>
          </section>

          <Separator />

          {/* 10 - 13 Sections */}
          <div className="space-y-6">
            <section>
              <h2 className="text-lg font-bold mb-2 uppercase">10. DEFAULT AND REMEDIES</h2>
              <ul className="list-disc pl-5 text-sm space-y-1">
                <li>Legal proceedings</li>
                <li>Eviction in accordance with applicable laws</li>
                <li>Forfeiture of the security deposit</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2 uppercase">11. FORCE MAJEURE</h2>
              <p className="text-sm text-justify italic">Neither Party shall be held liable for failure to perform obligations due to events beyond their control, including natural disasters, war, or government restrictions.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2 uppercase">12. DISPUTE RESOLUTION</h2>
              <p className="text-sm text-justify">Any dispute arising from this Agreement shall first be resolved amicably. If unresolved, the matter shall be referred to the competent courts of Rwanda.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2 uppercase">13. ENTIRE AGREEMENT</h2>
              <p className="text-sm">This Agreement constitutes the entire agreement between the Parties and supersedes all prior agreements or understandings.</p>
            </section>
          </div>

          <Separator />

          {/* 14. ANNEXES */}
          <section>
            <h2 className="text-lg font-bold mb-2 uppercase">14. ANNEXES</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="flex items-center gap-2 text-sm border p-2 rounded bg-gray-50">
                <FileText className="w-4 h-4 text-blue-500" /> Copy of property images
              </div>
              <div className="flex items-center gap-2 text-sm border p-2 rounded bg-gray-50">
                <FileText className="w-4 h-4 text-blue-500" /> Property inspection report
              </div>
              <div className="flex items-center gap-2 text-sm border p-2 rounded bg-gray-50">
                <FileText className="w-4 h-4 text-blue-500" /> Payment receipts
              </div>
            </div>
          </section>

          <Separator />

          {/* 15. VALIDATION CLAUSE */}
          <section className="contract-validation-panel-lease">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-3 uppercase text-blue-900">
              <ShieldCheck className="w-6 h-6 shrink-0" /> 15. VALIDATION CLAUSE
            </h2>
            <div className="text-sm space-y-2 text-blue-900">
              <p>This Agreement shall become legally valid and enforceable only upon:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li className="font-semibold text-blue-950 underline decoration-blue-400">Signature by both the Landlord and the Tenant; and</li>
                <li className="font-semibold text-blue-950 underline decoration-blue-400">Official stamp and endorsement by Vertex Consulting Ltd, represented by its Principal Consultant</li>
              </ul>
              <p className="mt-4 font-bold text-red-700 bg-white p-2 rounded border border-red-100 text-center uppercase tracking-wider">
                Any Agreement not bearing the official stamp and signature shall be considered null and void.
              </p>
            </div>
          </section>

          <Separator />

          {/* 16. SIGNATURES */}
          <section>
            <h2 className="text-lg font-bold mb-6 uppercase border-b pb-2">16. SIGNATURES</h2>
            <div className="contract-parties-grid">
              {/* Landlord Sign */}
              <div className="space-y-6">
                <h3 className="font-bold text-slate-700 uppercase text-sm tracking-widest font-sans border-b border-slate-400 pb-1">
                  Landlord (Lessor)
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs uppercase text-gray-400">Name</Label>
                    <Input name="landlordName" value={formData.landlordName} onChange={handleInputChange} className="border-t-0 border-x-0 border-b-2 border-gray-400 rounded-none px-0 focus-visible:ring-0 font-medium h-10 bg-transparent" />
                  </div>
                  <div className="h-20 border-b-2 border-dashed border-gray-400 flex items-end pb-1 text-gray-500 italic text-sm font-medium">
                    Signature
                  </div>
                  <div className="flex items-center gap-2 relative">
                    <Label className="text-[10px] font-bold text-gray-700 uppercase min-w-12">Date</Label>
                    <div className="flex-1 relative">
                      <Input name="signingDate" value={formData.signingDate} onChange={handleInputChange} className="border-t-0 border-x-0 border-b-2 border-gray-400 rounded-none px-0 focus-visible:ring-0 w-full h-10 bg-transparent" />
                      {!formData.signingDate && <span className="absolute left-0 bottom-2 text-xs text-gray-400 tracking-[0.2em]">...../...../......</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tenant Sign */}
              <div className="space-y-6">
                <h3 className="font-bold text-slate-700 uppercase text-sm tracking-widest font-sans border-b border-slate-400 pb-1">
                  Tenant (Lessee)
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs uppercase text-gray-400">Name</Label>
                    <Input name="tenantName" value={formData.tenantName} onChange={handleInputChange} className="border-t-0 border-x-0 border-b-2 border-blue-400 rounded-none px-0 focus-visible:ring-0 font-medium h-10 bg-transparent" />
                  </div>
                  <div className="h-20 border-b-2 border-dashed border-blue-400 flex items-end pb-1 text-blue-600 italic text-sm font-medium">
                    Signature (Sign manually with a pen)
                  </div>
                  <div className="flex items-center gap-2 relative">
                    <Label className="text-[10px] font-bold text-blue-700 uppercase min-w-12">Date</Label>
                    <div className="flex-1 relative">
                      <Input name="signingDate" value={formData.signingDate} onChange={handleInputChange} className="border-t-0 border-x-0 border-b-2 border-blue-400 rounded-none px-0 focus-visible:ring-0 w-full h-10 bg-transparent" />
                      {!formData.signingDate && <span className="absolute left-0 bottom-2 text-xs text-blue-400 tracking-[0.2em]">...../...../......</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* 17. WITNESSES */}
          <section>
            <h2 className="text-lg font-bold mb-6 uppercase border-b pb-2">17. WITNESSES</h2>
            <div className="contract-parties-grid">
              {/* Witness 1 */}
              <div className="contract-witness-cell relative">
                <h3 className="font-bold text-slate-600 uppercase text-xs font-sans border-b border-slate-400 pb-1 mb-1 inline-block">
                  Witness 1
                </h3>
                <div className="space-y-3">
                  <div className="relative">
                    <Label className="text-[10px] text-gray-400 uppercase">Full Name</Label>
                    <Input name="witness1Name" value={formData.witness1Name} onChange={handleInputChange} className="h-10 text-sm border-t-0 border-x-0 border-b-2 border-gray-400 rounded-none px-0 bg-transparent focus-visible:ring-0" />
                  </div>
                  <div className="relative">
                    <Label className="text-[10px] text-gray-400 uppercase">ID / Passport No</Label>
                    <Input name="witness1ID" value={formData.witness1ID} onChange={handleInputChange} className="h-10 text-sm border-t-0 border-x-0 border-b-2 border-gray-400 rounded-none px-0 bg-transparent focus-visible:ring-0" />
                  </div>
                  <div className="h-12 border-b-2 border-dashed border-gray-400 flex items-end pb-1 text-gray-500 italic text-xs font-medium">Signature</div>
                  <div className="flex items-center gap-2 pt-2 relative">
                    <Label className="text-[10px] text-gray-400 uppercase min-w-10">Date</Label>
                    <div className="flex-1 relative">
                      <Input name="signingDate" value={formData.signingDate} onChange={handleInputChange} className="h-8 text-sm border-t-0 border-x-0 border-b-2 border-gray-300 bg-transparent px-0 focus-visible:ring-0 w-full" />
                      {!formData.signingDate && <span className="absolute left-0 bottom-1 text-[10px] text-gray-400 tracking-[0.3em]">.../.../.....</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Witness 2 */}
              <div className="contract-witness-cell relative">
                <h3 className="font-bold text-slate-600 uppercase text-xs font-sans border-b border-slate-400 pb-1 mb-1 inline-block">
                  Witness 2
                </h3>
                <div className="space-y-3">
                  <div className="relative">
                    <Label className="text-[10px] text-gray-400 uppercase">Full Name</Label>
                    <Input name="witness2Name" value={formData.witness2Name} onChange={handleInputChange} className="h-10 text-sm border-t-0 border-x-0 border-b-2 border-gray-400 rounded-none px-0 bg-transparent focus-visible:ring-0" />
                  </div>
                  <div className="relative">
                    <Label className="text-[10px] text-gray-400 uppercase">ID / Passport No</Label>
                    <Input name="witness2ID" value={formData.witness2ID} onChange={handleInputChange} className="h-10 text-sm border-t-0 border-x-0 border-b-2 border-gray-400 rounded-none px-0 bg-transparent focus-visible:ring-0" />
                  </div>
                  <div className="h-12 border-b-2 border-dashed border-gray-400 flex items-end pb-1 text-gray-500 italic text-xs font-medium">Signature</div>
                  <div className="flex items-center gap-2 pt-2 relative">
                    <Label className="text-[10px] text-gray-400 uppercase min-w-10">Date</Label>
                    <div className="flex-1 relative">
                      <Input name="signingDate" value={formData.signingDate} onChange={handleInputChange} className="h-8 text-sm border-t-0 border-x-0 border-b-2 border-gray-300 bg-transparent px-0 focus-visible:ring-0 w-full" />
                      {!formData.signingDate && <span className="absolute left-0 bottom-1 text-[10px] text-gray-400 tracking-[0.3em]">.../.../.....</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* 18. AUTHORIZED VALIDATION */}
          <section className="relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-10">
              <Stamp className="w-40 h-40 text-blue-900 rotate-12" />
            </div>

            <h2 className="text-lg font-bold mb-6 uppercase border-b pb-2 text-blue-900">18. AUTHORIZED VALIDATION</h2>
            <p className="text-sm font-bold mb-4 text-blue-800">For Vertex Consulting Ltd:</p>

            <div className="max-w-md space-y-6">
              <div className="space-y-1">
                <Label className="text-xs uppercase text-gray-400">Principal Consultant Name</Label>
                <div className="font-bold text-lg border-b border-black pb-1">Vertex Consultant Representative</div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div>
                  <Label className="text-xs uppercase text-gray-400">Signature</Label>
                  <div className="h-16 border-b border-black flex items-center justify-center italic text-gray-300">
                    (Official Signature Area)
                  </div>
                </div>
                <div>
                  <Label className="text-xs uppercase text-gray-400">Official Stamp</Label>
                  <div className="h-16 border border-dashed border-blue-300 rounded flex items-center justify-center text-blue-200">
                    <Stamp className="w-8 h-8" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-xs uppercase text-gray-400 min-w-12">Date</Label>
                <div className="border-b border-black pb-1 w-40 font-medium tracking-[0.2em]">...../...../......</div>
              </div>
            </div>
          </section>

          </div>
        </div>

        <Separator />

        {/* 19. FINAL STEPS & SUBMISSION */}
          <section className="bg-gray-50 p-6 rounded-xl border border-gray-200 print:hidden">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 uppercase text-gray-800">
              <ShieldCheck className="w-6 h-6 text-green-600" /> 19. FINAL STEPS & SUBMISSION
            </h2>

            <div className="space-y-6">
              {/* Terms and Conditions */}
              <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
                <Checkbox
                  id="terms"
                  checked={formData.acceptedTerms}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, acceptedTerms: !!checked }))}
                  className="mt-1"
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="terms" className="text-sm font-bold cursor-pointer">
                    I read and confirm the Terms and Conditions
                  </Label>
                  <p className="text-xs text-gray-500">
                    By checking this box, I acknowledge that I have read the entire agreement and agree to be bound by its terms.
                  </p>
                </div>
              </div>

              {/* Download/Print Step */}
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
                <div className="space-y-1">
                  <p className="text-sm font-bold">Step 1: Download & Sign</p>
                  <p className="text-xs text-gray-500">Download the agreement, print it, and fill/sign it **manually with a pen**.</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={isSubmitting} className="border-blue-600 text-blue-600 hover:bg-blue-50">
                  <Download className="w-4 h-4 mr-2" /> {isSubmitting ? "Generating..." : "Download PDF"}
                </Button>
              </div>

              {/* Upload Step */}
              <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm space-y-3">
                <div className="space-y-1">
                  <p className="text-sm font-bold">Step 2: Upload Signed Copy</p>
                  <p className="text-xs text-gray-500">
                    Upload a clear photo or PDF scan of the signed agreement.
                  </p>
                </div>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Input
                    id="signed-contract"
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="cursor-pointer"
                  />
                  {formData.signedContractFile && (
                    <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> {formData.signedContractFile.name} uploaded successfully
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

      {/* Footer / Action */}
      <div className="bg-gray-50 border-t p-6 flex justify-between items-center print:hidden sticky bottom-0">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <div className="flex gap-3">
          <div className="flex flex-col items-end gap-1">
            <Button
              className={`bg-blue-600 hover:bg-blue-700 text-white shadow-lg px-8 transition-all duration-300 ${formData.signedContractFile ? 'scale-105 shadow-blue-200' : ''}`}
              onClick={handleSubmit}
              disabled={!formData.signedContractFile || isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Submit Contract Now"}
            </Button>
            {!formData.signedContractFile && <p className="text-[10px] text-red-500">Signed contract upload is required</p>}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .document-content, .document-content * {
            visibility: visible;
          }
          .document-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            overflow: visible !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
