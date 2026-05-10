"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, FileText, Clock, CheckCircle, XCircle } from "lucide-react";

interface Contract {
  id: string;
  productId: string;
  productTitle: string;
  productPrice: number;
  tenantName: string;
  userName: string;
  userEmail: string;
  customerPhone?: string;
  category: string;
  subcategory?: string;
  contractFileUrl?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  submittedAt?: string;
  contractSubmittedAt?: string;
  createdAt: string;
}

export default function ContractsTable() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/contracts');
      const data = await response.json();
      console.log('Fetched contracts data:', data);
      if (data.success) {
        setContracts(data.contracts || []);
      } else {
        console.error('API returned error:', data.error || data.message);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateContractStatus = async (contractId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/contracts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId, status: newStatus }),
      });
      const data = await response.json();
      if (data.success) {
        fetchContracts();
      } else {
        alert(data.error || "Failed to update status");
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
      case 'confirmed': return <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Confirmed</Badge>;
      case 'completed': return <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Completed</Badge>;
      case 'cancelled': return <Badge className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1"><XCircle className="w-3 h-3" /> Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Contract Requests
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contract</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No contracts found
                  </TableCell>
                </TableRow>
              ) : (
                contracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell>
                      <div className="font-medium text-blue-900">{contract.productTitle}</div>
                      <div className="text-xs text-gray-500">{contract.category}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{contract.tenantName || contract.userName}</div>
                      <div className="text-xs text-gray-500">{contract.userEmail}</div>
                    </TableCell>
                    <TableCell>{getStatusBadge(contract.status)}</TableCell>
                    <TableCell>
                      {contract.contractFileUrl ? (
                        <a
                          href={`/api/contracts/${contract.id}/view`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <Eye className="w-4 h-4" /> View
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No file</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-gray-600">
                        {new Date(contract.contractSubmittedAt || contract.submittedAt || contract.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {contract.status === 'pending' && (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white h-8"
                            onClick={() => updateContractStatus(contract.id, 'confirmed')}
                          >
                            Confirm
                          </Button>
                        )}
                        {contract.status === 'confirmed' && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white h-8"
                            onClick={() => updateContractStatus(contract.id, 'completed')}
                          >
                            Complete
                          </Button>
                        )}
                        {contract.status !== 'cancelled' && contract.status !== 'completed' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8"
                            onClick={() => updateContractStatus(contract.id, 'cancelled')}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
