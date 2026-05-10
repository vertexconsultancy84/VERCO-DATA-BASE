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
  AlertTriangle,
  Download,
  Printer,
  Stamp,
  Info,
  CreditCard,
  Briefcase
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

interface SalesAgreementFormProps {
  product: Product;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function SalesAgreementForm({ product, onSuccess, onCancel }: SalesAgreementFormProps) {
  const [formData, setFormData] = useState({
    agreementDate: "",

    // Seller
    sellerName: (product as any).ownerFullName || product.user?.name || "",
    sellerNationality: (product as any).ownerNationality || "",
    sellerID: (product as any).ownerID || "",
    sellerAddress: (product as any).ownerAddress || "",
    sellerContact: product.user?.phone || product.user?.email || "",

    // Buyer
    buyerName: "",
    buyerNationality: "",
    buyerID: "",
    buyerAddress: "",
    buyerContact: "",

    // Financials
    purchasePrice: product.price.toString(),
    depositAmount: (product.price * 0.1).toString(), // Default 10%
    balanceAmount: (product.price * 0.9).toString(),
    paymentDeadline: "",
    paymentMethod: "Bank Transfer",

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
    setFormData(prev => {
      const newData = { ...prev, [name]: value };

      // Auto-calculate balance if price or deposit changes
      if (name === "purchasePrice" || name === "depositAmount") {
        const price = parseFloat(newData.purchasePrice) || 0;
        const deposit = parseFloat(newData.depositAmount) || 0;
        newData.balanceAmount = (price - deposit).toString();
      }

      return newData;
    });
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

  const handleDownloadPDF = async () => {
    const element = document.getElementById("pdf-content");
    if (!element) return;

    setIsSubmitting(true);
    try {
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

      pdf.save(`Sales_Agreement_${product.title.replace(/\s+/g, '_')}.pdf`);
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

        try {
          const response = await fetch('/api/submit-contract-request', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              productId: product.id,
              tenantName: formData.buyerName || "Buyer", // Mapping buyer to tenantName for reuse
              tenantNationality: formData.buyerNationality,
              tenantID: formData.buyerID,
              tenantAddress: formData.buyerAddress,
              tenantContact: formData.buyerContact || "N/A",
              userName: formData.buyerName || "Buyer",
              userEmail: formData.buyerContact && formData.buyerContact.includes('@') 
                ? formData.buyerContact 
                : `${(formData.buyerName || "buyer").replace(/\s+/g, '').toLowerCase()}@example.com`,
              customerPhone: formData.buyerContact || "N/A",
              deliveryAddress: formData.buyerAddress,
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
            if (onSuccess) onSuccess();
          }
        } catch (error) {
          console.error('Error submitting contract request:', error);
          alert("Error submitting contract request.");
        } finally {
          setIsSubmitting(false);
        }
      };

      return (
        <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-xl overflow-hidden border border-gray-100 flex flex-col h-[85vh]">
      {/* Header / Toolbar */}
      <div className="bg-gray-50 border-b p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-emerald-600" />
          <h1 className="text-xl font-bold text-gray-800 uppercase tracking-tight">Sales and Purchase Agreement</h1>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownloadPDF}
            disabled={isSubmitting}
            className="bg-emerald-600 text-white hover:bg-emerald-700 border-none"
          >
            <Download className="w-4 h-4 mr-2" /> {isSubmitting ? "Generating..." : "Download PDF"}
          </Button>
        </div>
      </div>

      {/* Contract Content */}
      <div className="flex-1 overflow-y-auto p-8 bg-white document-content">
        {/* Instructions for Client */}
        <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-4 shadow-sm print:hidden">
          <div className="bg-emerald-600 p-2 rounded-lg">
            <Info className="w-5 h-5 text-white" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-emerald-900">Important: Seller Details</h3>
            <p className="text-sm text-emerald-700 leading-relaxed">
              Before you start filling this form, please ensure you have the **Seller's information** (Full Name, ID, Nationality, and Address).
            </p>
            <div className="mt-3 p-3 bg-white/50 rounded-lg border border-emerald-100">
              <p className="text-xs font-bold text-emerald-800 uppercase mb-2">Process Overview:</p>
              <ul className="text-xs text-emerald-700 space-y-1 list-disc ml-4">
                <li>Review the property and agreement details.</li>
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
                className="bg-white border-emerald-200 text-emerald-600 hover:bg-emerald-100 shadow-sm"
                onClick={() => (window as any).dispatchEvent(new CustomEvent('openOwnerModal', { detail: { product } }))}
              >
                <User className="w-4 h-4 mr-2" />
                View Seller Info Now
              </Button>
            </div>
          </div>
        </div>

        <div id="pdf-content" className="contract-document">
          <header className="contract-document-header">
            <p className="contract-document-header-kicker">Vertex Consulting · Official Agreement</p>
            <h1 className="contract-document-header-title">Sales and Purchase Agreement</h1>
            <div className="contract-document-meta">
              <span>
                Listing: <strong className="text-slate-700">{product.title}</strong>
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
              This Sales and Purchase Agreement (“Agreement”) is made and entered into on this
              <span className="inline-block border-b border-black px-2 mx-1 font-medium min-w-[100px]">
                {formData.agreementDate ? new Date(formData.agreementDate).toLocaleDateString() : "___ / ___ / 20___"}
              </span>
              (“Effective Date”), by and between:
            </p>
          </section>

          <Separator />

          {/* 1. PARTIES */}
          <section>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 uppercase">
              <User className="w-5 h-5 text-emerald-600" /> 1. PARTIES
            </h2>

            <div className="contract-parties-grid">
              {/* Seller */}
              <div className="space-y-4">
                <h3 className="font-semibold text-emerald-800 border-b border-slate-300 pb-1 inline-block font-sans tracking-wide">
                  1.1 Seller (Vendor)
                </h3>
                <div className="space-y-2">
                  <div className="relative mb-4">
                    <Label className="text-[10px] font-bold text-emerald-900 uppercase tracking-wide">Full Name</Label>
                    <Input name="sellerName" value={formData.sellerName} onChange={handleInputChange} className="border-t-0 border-x-0 border-b-2 border-gray-400 rounded-none px-0 focus-visible:ring-0 h-10 bg-transparent text-gray-800" />
                    {!formData.sellerName && <span className="absolute right-0 bottom-2 text-[10px] text-gray-400 italic font-medium">(Write Full Name)</span>}
                  </div>
                  <div className="relative mb-4">
                    <Label className="text-[10px] font-bold text-emerald-900 uppercase tracking-wide">Nationality</Label>
                    <Input name="sellerNationality" value={formData.sellerNationality} onChange={handleInputChange} className="border-t-0 border-x-0 border-b-2 border-gray-400 rounded-none px-0 focus-visible:ring-0 h-10 bg-transparent text-gray-800" />
                    {!formData.sellerNationality && <span className="absolute right-0 bottom-2 text-[10px] text-gray-400 italic font-medium">(Nationality)</span>}
                  </div>
                  <div className="relative mb-4">
                    <Label className="text-[10px] font-bold text-emerald-900 uppercase tracking-wide">National ID / Passport No</Label>
                    <Input name="sellerID" value={formData.sellerID} onChange={handleInputChange} className="border-t-0 border-x-0 border-b-2 border-gray-400 rounded-none px-0 focus-visible:ring-0 h-10 bg-transparent text-gray-800" />
                    {!formData.sellerID && <span className="absolute right-0 bottom-2 text-[10px] text-gray-400 italic font-medium">(ID Number)</span>}
                  </div>
                  <div className="relative mb-4">
                    <Label className="text-[10px] font-bold text-emerald-900 uppercase tracking-wide">Current Address</Label>
                    <Input name="sellerAddress" value={formData.sellerAddress} onChange={handleInputChange} className="border-t-0 border-x-0 border-b-2 border-gray-400 rounded-none px-0 focus-visible:ring-0 h-10 bg-transparent text-gray-800" />
                    {!formData.sellerAddress && <span className="absolute right-0 bottom-2 text-[10px] text-gray-400 italic font-medium">(Full Address)</span>}
                  </div>
                  <div className="relative mb-4">
                    <Label className="text-[10px] font-bold text-emerald-900 uppercase tracking-wide">Telephone / Email</Label>
                    <Input name="sellerContact" value={formData.sellerContact} onChange={handleInputChange} className="border-t-0 border-x-0 border-b-2 border-gray-400 rounded-none px-0 focus-visible:ring-0 h-10 bg-transparent text-gray-800" />
                    {!formData.sellerContact && <span className="absolute right-0 bottom-2 text-[10px] text-gray-400 italic font-medium">(Phone/Email)</span>}
                  </div>
                </div>
              </div>

              {/* Buyer */}
              <div className="space-y-4">
                <h3 className="font-semibold text-emerald-800 border-b border-slate-300 pb-1 inline-block font-sans tracking-wide">
                  1.2 Buyer (Purchaser)
                </h3>
                <div className="space-y-2">
                  <div className="relative mb-4">
                    <Label className="text-[10px] font-bold text-emerald-900 uppercase tracking-wide">Full Legal Name</Label>
                    <Input name="buyerName" value={formData.buyerName} onChange={handleInputChange} className="border-t-0 border-x-0 border-b-2 border-emerald-400 rounded-none px-0 focus-visible:ring-0 h-10 bg-transparent text-gray-800" />
                  </div>
                  <div className="relative mb-4">
                    <Label className="text-[10px] font-bold text-emerald-900 uppercase tracking-wide">Nationality</Label>
                    <Input name="buyerNationality" value={formData.buyerNationality} onChange={handleInputChange} className="border-t-0 border-x-0 border-b-2 border-emerald-400 rounded-none px-0 focus-visible:ring-0 h-10 bg-transparent text-gray-800" />
                    {!formData.buyerNationality && <span className="absolute right-0 bottom-2 text-[10px] text-emerald-400 italic font-medium">(Nationality)</span>}
                  </div>
                  <div className="relative mb-4">
                    <Label className="text-[10px] font-bold text-emerald-900 uppercase tracking-wide">National ID / Passport No</Label>
                    <Input name="buyerID" value={formData.buyerID} onChange={handleInputChange} className="border-t-0 border-x-0 border-b-2 border-emerald-400 rounded-none px-0 focus-visible:ring-0 h-10 bg-transparent text-gray-800" />
                    {!formData.buyerID && <span className="absolute right-0 bottom-2 text-[10px] text-emerald-400 italic font-medium">(ID Number)</span>}
                  </div>
                  <div className="relative mb-4">
                    <Label className="text-[10px] font-bold text-emerald-900 uppercase tracking-wide">Current Address</Label>
                    <Input name="buyerAddress" value={formData.buyerAddress} onChange={handleInputChange} className="border-t-0 border-x-0 border-b-2 border-emerald-400 rounded-none px-0 focus-visible:ring-0 h-10 bg-transparent text-gray-800" />
                    {!formData.buyerAddress && <span className="absolute right-0 bottom-2 text-[10px] text-emerald-400 italic font-medium">(Full Address)</span>}
                  </div>
                  <div className="relative mb-4">
                    <Label className="text-[10px] font-bold text-emerald-900 uppercase tracking-wide">Telephone / Email</Label>
                    <Input name="buyerContact" value={formData.buyerContact} onChange={handleInputChange} className="border-t-0 border-x-0 border-b-2 border-emerald-400 rounded-none px-0 focus-visible:ring-0 h-10 bg-transparent text-gray-800" />
                    {!formData.buyerContact && <span className="absolute right-0 bottom-2 text-[10px] text-emerald-400 italic font-medium">(Phone/Email)</span>}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* 2. PROPERTY DESCRIPTION */}
          <section>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 uppercase">
              <MapPin className="w-5 h-5 text-emerald-600" /> 2. PROPERTY DESCRIPTION
            </h2>
            <p className="mb-4 text-sm">The Seller hereby agrees to sell and the Buyer hereby agrees to purchase the property located at:</p>
            <div className="contract-callout-box mb-4 font-sans">
              <p className="font-bold text-lg border-b border-slate-300 pb-2 mb-2">{product.title}</p>
              <p className="text-slate-600">{fullAddress}</p>
              <p className="text-xs text-emerald-700 mt-3 font-semibold uppercase tracking-wide border-t border-slate-200 pt-2">
                Property type: {product.propertyType === 'house-for-sale' ? 'House' : 'Land (IBIBANZA)'}
              </p>
            </div>
            <p className="text-sm text-justify leading-relaxed">The Property includes all rights, privileges, and appurtenances belonging to it, including all buildings and fixtures as seen by the Buyer.</p>
          </section>

          <Separator />

          {/* 3. PURCHASE PRICE AND PAYMENT TERMS */}
          <section>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 uppercase">
              <DollarSign className="w-5 h-5 text-emerald-600" /> 3. PURCHASE PRICE AND PAYMENT TERMS
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label>3.1 Total Purchase Price</Label>
                  <div className="relative">
                    <span className="absolute left-0 top-2.5 text-gray-500 font-bold">FRW</span>
                    <Input name="purchasePrice" value={formData.purchasePrice} onChange={handleInputChange} className="pl-10 font-bold text-emerald-700 border-t-0 border-x-0 border-b-2 border-gray-300 rounded-none focus-visible:ring-0 h-10" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>3.2 Deposit (Paid upon signing)</Label>
                  <div className="relative">
                    <span className="absolute left-0 top-2.5 text-gray-500 font-bold">FRW</span>
                    <Input name="depositAmount" value={formData.depositAmount} onChange={handleInputChange} className="pl-10 border-t-0 border-x-0 border-b-2 border-gray-300 rounded-none focus-visible:ring-0 h-10" />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label>3.3 Balance to be Paid</Label>
                  <div className="relative">
                    <span className="absolute left-0 top-2.5 text-gray-500 font-bold">FRW</span>
                    <Input name="balanceAmount" value={formData.balanceAmount} className="pl-10 bg-gray-50 border-t-0 border-x-0 border-b-2 border-gray-300 rounded-none focus-visible:ring-0 h-10" readOnly />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs uppercase text-gray-500">3.4 Payment Deadline</Label>
                  <div className="relative">
                    <Input name="paymentDeadline" value={formData.paymentDeadline} onChange={handleInputChange} className="border-t-0 border-x-0 border-b-2 border-gray-400 rounded-none px-0 bg-transparent focus-visible:ring-0 h-10 w-full" />
                    {!formData.paymentDeadline && <span className="absolute left-0 bottom-2 text-xs text-gray-400 tracking-[0.3em]">.../.../.....</span>}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm mt-4 text-justify italic text-gray-600">The Buyer shall pay the Balance of the Purchase Price to the Seller on or before the Completion Date.</p>
          </section>

          <Separator />

          {/* 4. COMPLETION AND TRANSFER OF TITLE */}
          <section>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 uppercase text-gray-800">
              <Clock className="w-5 h-5 text-emerald-600" /> 4. COMPLETION AND TRANSFER OF TITLE
            </h2>
            <div className="space-y-3 text-sm text-justify leading-relaxed">
              <p>4.1 Completion shall take place upon full payment of the Purchase Price.</p>
              <p>4.2 The Seller shall, upon completion, provide the Buyer with all necessary documents for the transfer of the property title, including the Original Title Deed, tax clearances, and signed transfer forms.</p>
              <p>4.3 All costs associated with the transfer of title (registration fees, notary fees, etc.) shall be borne by the <strong>Buyer</strong> unless otherwise agreed in writing.</p>
            </div>
          </section>

          <Separator />

          {/* 5 - 7 General Sections */}
          <div className="space-y-6">
            <section>
              <h2 className="text-lg font-bold mb-2 uppercase">5. REPRESENTATIONS AND WARRANTIES</h2>
              <p className="text-sm text-justify leading-relaxed italic">The Seller warrants that they are the legal owner of the Property, has the full right to sell it, and that the Property is free from any liens, encumbrances, or legal disputes.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2 uppercase">6. POSSESSION</h2>
              <p className="text-sm text-justify leading-relaxed">The Buyer shall be entitled to vacant possession of the Property on the date of full payment of the Purchase Price.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2 uppercase">7. DEFAULT</h2>
              <p className="text-sm text-justify leading-relaxed">If the Buyer fails to pay the balance within the agreed timeframe, the Seller may retain the deposit as liquidated damages. If the Seller fails to complete the sale, the Buyer shall be entitled to a full refund of the deposit plus any legal costs incurred.</p>
            </section>
          </div>

          <Separator />

          {/* 8. VALIDATION CLAUSE */}
          <section className="contract-validation-panel-sales">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-3 uppercase text-emerald-900">
              <ShieldCheck className="w-6 h-6 shrink-0" /> 8. VALIDATION CLAUSE
            </h2>
            <div className="text-sm space-y-2 text-emerald-900">
              <p>This Agreement shall become legally valid and enforceable only upon:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li className="font-semibold text-emerald-950 underline decoration-emerald-400">Signature by both the Seller and the Buyer; and</li>
                <li className="font-semibold text-emerald-950 underline decoration-emerald-400">Official stamp and endorsement by Vertex Consulting Ltd, represented by its Principal Consultant</li>
              </ul>
              <p className="mt-4 font-bold text-red-700 bg-white p-2 rounded border border-red-100 text-center uppercase tracking-wider">
                Any Agreement not bearing the official stamp and signature shall be considered null and void.
              </p>
            </div>
          </section>

          <Separator />

          {/* 9. SIGNATURES */}
          <section>
            <h2 className="text-lg font-bold mb-6 uppercase border-b pb-2">9. SIGNATURES</h2>
            <div className="contract-parties-grid">
              {/* Seller Sign */}
              <div className="space-y-6">
                <h3 className="font-bold text-slate-700 uppercase text-sm tracking-widest font-sans border-b border-slate-400 pb-1">
                  Seller (Vendor)
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs uppercase text-gray-400">Name</Label>
                    <Input name="sellerName" value={formData.sellerName} onChange={handleInputChange} className="border-t-0 border-x-0 border-b-2 border-gray-400 rounded-none px-0 focus-visible:ring-0 font-medium h-10 bg-transparent" />
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

              {/* Buyer Sign */}
              <div className="space-y-6">
                <h3 className="font-bold text-slate-700 uppercase text-sm tracking-widest font-sans border-b border-slate-400 pb-1">
                  Buyer (Purchaser)
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs uppercase text-gray-400">Name</Label>
                    <Input name="buyerName" value={formData.buyerName} onChange={handleInputChange} className="border-t-0 border-x-0 border-b-2 border-emerald-400 rounded-none px-0 focus-visible:ring-0 font-medium h-10 bg-transparent" />
                  </div>
                  <div className="h-20 border-b-2 border-dashed border-emerald-400 flex items-end pb-1 text-emerald-600 italic text-sm font-medium">
                    Signature (Sign manually with a pen)
                  </div>
                  <div className="flex items-center gap-2 relative">
                    <Label className="text-[10px] font-bold text-emerald-700 uppercase min-w-12">Date</Label>
                    <div className="flex-1 relative">
                      <Input name="signingDate" value={formData.signingDate} onChange={handleInputChange} className="border-t-0 border-x-0 border-b-2 border-emerald-400 rounded-none px-0 focus-visible:ring-0 w-full h-10 bg-transparent" />
                      {!formData.signingDate && <span className="absolute left-0 bottom-2 text-xs text-emerald-400 tracking-[0.2em]">...../...../......</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* 10. WITNESSES */}
          <section>
            <h2 className="text-lg font-bold mb-6 uppercase border-b pb-2">10. WITNESSES</h2>
            <div className="contract-parties-grid">
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

          {/* 11. AUTHORIZED VALIDATION */}
          <section className="relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-10">
              <Stamp className="w-40 h-40 text-emerald-900 rotate-12" />
            </div>

            <h2 className="text-lg font-bold mb-6 uppercase border-b pb-2 text-emerald-900">11. AUTHORIZED VALIDATION</h2>
            <p className="text-sm font-bold mb-4 text-emerald-800">For Vertex Consulting Ltd:</p>

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
                  <div className="h-16 border border-dashed border-emerald-300 rounded flex items-center justify-center text-emerald-200">
                    <Stamp className="w-8 h-8" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-6">
                <Label className="text-xs uppercase text-gray-400 min-w-12">Date</Label>
                <div className="border-b border-black pb-1 w-40 font-medium tracking-[0.3em]">.../.../.....</div>
              </div>
            </div>
          </section>

          </div>
        </div>

        <Separator />

        {/* 12. FINAL STEPS & SUBMISSION */}
          <section className="bg-gray-50 p-6 rounded-xl border border-gray-200 print:hidden">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 uppercase text-gray-800">
              <ShieldCheck className="w-6 h-6 text-emerald-600" /> 12. FINAL STEPS & SUBMISSION
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
                  <p className="text-xs text-gray-500 text-justify">
                    I understand that this is a legally binding contract. I confirm that I have inspected the property and agree to purchase it "as-is" under the terms stated above.
                  </p>
                </div>
              </div>

              {/* Download/Print Step */}
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
                <div className="space-y-1">
                  <p className="text-sm font-bold">Step 1: Download & Sign</p>
                  <p className="text-xs text-gray-500">Download the agreement, print it, and fill/sign it **manually with a pen**.</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={isSubmitting} className="border-emerald-600 text-emerald-600 hover:bg-emerald-50">
                  <Download className="w-4 h-4 mr-2" /> {isSubmitting ? "Generating..." : "Download PDF"}
                </Button>
              </div>

              {/* Upload Step */}
              <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm space-y-3">
                <div className="space-y-1">
                  <p className="text-sm font-bold">Step 2: Upload Signed Copy</p>
                  <p className="text-xs text-gray-500">Upload a clear photo or PDF scan of the signed agreement.</p>
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
                    <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
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
              className={`bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg px-8 transition-all duration-300 ${formData.signedContractFile ? 'scale-105 shadow-emerald-200' : ''}`}
              onClick={handleSubmit}
              disabled={!formData.signedContractFile || isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Submit Agreement Now"}
            </Button>
            {!formData.signedContractFile && <p className="text-[10px] text-red-500">Signed agreement upload required</p>}
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
