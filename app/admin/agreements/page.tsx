"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Eye, Mail, Phone, MapPin, Calendar, FileText, CheckCircle, Clock, XCircle } from "lucide-react";
import Link from "next/link";

interface Contract {
  id: string;
  productId: string;
  productTitle: string;
  productPrice: number;
  tenantName: string;
  tenantNationality?: string;
  tenantID?: string;
  tenantAddress?: string;
  tenantContact?: string;
  userName: string;
  userEmail: string;
  customerPhone?: string;
  deliveryAddress?: string;
  village?: string;
  category: string;
  subcategory?: string;
  contractFileUrl?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminAgreementsDashboard() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all');

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const response = await fetch('/api/contracts');
      const result = await response.json();

      if (result.success) {
        setContracts(result.contracts);
      } else {
        setError(result.message || "Failed to fetch contracts");
      }
    } catch (error) {
      console.error("Fetch contracts error:", error);
      setError("Failed to fetch contracts");
    } finally {
      setLoading(false);
    }
  };

  const updateContractStatus = async (contractId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/contracts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contractId, status: newStatus }),
      });

      const result = await response.json();

      if (result.success) {
        fetchContracts(); // Refresh contracts
      } else {
        alert(result.message || "Failed to update contract status");
      }
    } catch (error) {
      console.error("Update contract error:", error);
      alert("Failed to update contract status");
    }
  };

  const downloadContract = (contractId: string, orderTitle: string) => {
    const link = document.createElement('a');
    link.href = `/api/contracts/${contractId}/view?download=1`;
    link.download = `contract-${orderTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <Eye className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredContracts = filter === 'all' 
    ? contracts 
    : contracts.filter(contract => contract.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading contract agreements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-700">{error}</p>
            <Button onClick={fetchContracts} className="mt-4">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Contract Agreements</h1>
          <p className="text-gray-600">Manage submitted contract requests and agreements</p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex space-x-2">
            {[
              { key: 'all', label: 'All Contracts', count: contracts.length },
              { key: 'pending', label: 'Pending', count: contracts.filter(c => c.status === 'pending').length },
              { key: 'confirmed', label: 'Confirmed', count: contracts.filter(c => c.status === 'confirmed').length },
              { key: 'completed', label: 'Completed', count: contracts.filter(c => c.status === 'completed').length },
            ].map((tab) => (
              <Button
                key={tab.key}
                variant={filter === tab.key ? "default" : "outline"}
                onClick={() => setFilter(tab.key as any)}
                className="flex items-center gap-2"
              >
                {tab.label}
                <Badge variant="secondary" className="ml-1">
                  {tab.count}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        {/* Contracts List */}
        {filteredContracts.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {filter === 'all' ? 'No Contract Agreements Found' : `No ${filter} Contracts`}
              </h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? 'No contract agreements have been submitted yet.'
                  : `No ${filter} contract agreements found.`
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredContracts.map((contract) => (
              <Card key={contract.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{contract.productTitle}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Submitted: {new Date(contract.submittedAt || contract.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {contract.village || 'No location'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(contract.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(contract.status)}
                          {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                        </div>
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Customer Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Customer Information
                      </h4>
                      <div className="space-y-1 text-sm">
                        <p><strong>Name:</strong> {contract.tenantName || contract.userName}</p>
                        <p><strong>Email:</strong> {contract.userEmail}</p>
                        {contract.customerPhone && <p><strong>Phone:</strong> {contract.customerPhone}</p>}
                        {contract.deliveryAddress && <p><strong>Delivery Address:</strong> {contract.deliveryAddress}</p>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900">Order Details</h4>
                      <div className="space-y-1 text-sm">
                        <p><strong>Category:</strong> {contract.category}</p>
                        {contract.subcategory && <p><strong>Subcategory:</strong> {contract.subcategory}</p>}
                        <p><strong>Price:</strong> FRW {contract.productPrice.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contract File */}
                  {contract.contractFileUrl && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-blue-900 mb-1">Contract Document</h4>
                          <p className="text-sm text-blue-700">Customer has uploaded a signed contract</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              window.open(`/api/contracts/${contract.id}/view`, '_blank')
                            }
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => downloadContract(contract.id, contract.productTitle)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex gap-2">
                      {contract.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateContractStatus(contract.id, 'confirmed')}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Confirm Contract
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateContractStatus(contract.id, 'cancelled')}
                            className="border-red-600 text-red-600 hover:bg-red-50"
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                      {contract.status === 'confirmed' && (
                        <Button
                          size="sm"
                          onClick={() => updateContractStatus(contract.id, 'completed')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Mark Complete
                        </Button>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      Contract ID: {contract.id}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
