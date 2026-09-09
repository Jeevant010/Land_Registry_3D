"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  FileText,
  Building2,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function ApprovalsListPage() {
  // Use try-catch pattern with skip to handle missing functions gracefully
  const pendingApprovals = useQuery(
    api.transactions?.getPendingApprovals ?? api.properties.getAllProperties,
    api.transactions?.getPendingApprovals ? {} : "skip",
  );
  const allTransactions = useQuery(
    api.transactions?.getAllTransactions ?? api.properties.getAllProperties,
    api.transactions?.getAllTransactions ? {} : "skip",
  );

  // If transactions API isn't available yet, show a helpful message
  if (!api.transactions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-2xl mx-auto text-center">
          <Card>
            <CardContent className="p-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
              <h2 className="text-xl font-bold mb-2">
                Setting up Transaction System
              </h2>
              <p className="text-gray-600 mb-4">
                Please run{" "}
                <code className="bg-gray-100 px-2 py-1 rounded">
                  npx convex dev
                </code>{" "}
                in your terminal.
              </p>
              <Link href="/admin">
                <Button variant="outline">Back to Admin Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            Pending Review
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case "LOCKED":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300">
            Funds Locked
          </Badge>
        );
      case "INITIATED":
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-300">
            Initiated
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin">
            <Button variant="ghost" className="mb-4 group">
              <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to Admin Dashboard
            </Button>
          </Link>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                Transaction Approvals
              </h1>
            </div>
            <p className="text-gray-600">
              Review and approve property transfer transactions submitted for
              government verification.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {pendingApprovals?.length ?? 0}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Approved</p>
                  <p className="text-2xl font-bold text-green-600">
                    {allTransactions?.filter((t) => t.status === "APPROVED")
                      .length ?? 0}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">
                    {allTransactions?.filter((t) => t.status === "REJECTED")
                      .length ?? 0}
                  </p>
                </div>
                <XCircle className="h-8 w-8 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-2xl font-bold text-gray-700">
                    {allTransactions?.length ?? 0}
                  </p>
                </div>
                <Building2 className="h-8 w-8 text-gray-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Approvals Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              Pending Approvals
            </CardTitle>
            <CardDescription>
              Transactions awaiting your review and approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingApprovals === undefined ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : pendingApprovals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No Pending Approvals</p>
                <p className="text-sm">All transactions have been reviewed.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property ID</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingApprovals.map((tx) => (
                    <TableRow key={tx._id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {tx.propertyId}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {tx.sellerWallet.slice(0, 6)}...
                        {tx.sellerWallet.slice(-4)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {tx.buyerWallet.slice(0, 6)}...
                        {tx.buyerWallet.slice(-4)}
                      </TableCell>
                      <TableCell>{tx.agreedPrice} ETH</TableCell>
                      <TableCell>
                        {tx.submittedAt ? formatDate(tx.submittedAt) : "N/A"}
                      </TableCell>
                      <TableCell>{getStatusBadge(tx.status)}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/approvals/${tx._id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* All Transactions Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              All Transactions
            </CardTitle>
            <CardDescription>
              Complete history of all property transfer transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {allTransactions === undefined ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : allTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No Transactions Yet</p>
                <p className="text-sm">
                  Property transfers will appear here once initiated.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property ID</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allTransactions.map((tx) => (
                    <TableRow key={tx._id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {tx.propertyId}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {tx.sellerWallet.slice(0, 6)}...
                        {tx.sellerWallet.slice(-4)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {tx.buyerWallet.slice(0, 6)}...
                        {tx.buyerWallet.slice(-4)}
                      </TableCell>
                      <TableCell>{tx.agreedPrice} ETH</TableCell>
                      <TableCell>{formatDate(tx.createdAt)}</TableCell>
                      <TableCell>{getStatusBadge(tx.status)}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/approvals/${tx._id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
