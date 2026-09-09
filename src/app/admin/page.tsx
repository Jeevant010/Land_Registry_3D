"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ethers } from "ethers";
import contractABI from "@/utils/contractABI.json";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  FileText,
  Map,
  IdCard,
  FileJson,
  CheckCircle,
  AlertCircle,
  Download,
  Eye,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";

export default function AdminDashboard() {
  const pendingLands = useQuery(api.properties.getPendingVerifications);
  const updateStatus = useMutation(api.properties.updateVerificationStatus);
  const updateBlockchainStatus = useMutation(
    api.properties.updateBlockchainStatus,
  );
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleApproveAndMint = async (land: any) => {
    setProcessing(land._id);
    setMessage(null);
    try {
      if (!window.ethereum) {
        setMessage({
          type: "error",
          text: "Please install MetaMask to continue",
        });
        setProcessing(null);
        return;
      }

      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      if (!contractAddress) {
        setMessage({
          type: "error",
          text: "Contract address not configured. Please add NEXT_PUBLIC_CONTRACT_ADDRESS to .env.local",
        });
        setProcessing(null);
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer,
      );

      console.log("Minting NFT for CID:", land.metadataJsonCid);
      const tx = await contract.mintLandRecord(
        land.ownerWalletAddress,
        land.metadataJsonCid,
      );

      console.log("Transaction sent:", tx.hash);

      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);

      await updateStatus({
        propertyId: land.propertyId,
        status: "verified",
        verifiedBy: signerAddress,
      });

      await updateBlockchainStatus({
        propertyId: land.propertyId,
        txHash: tx.hash,
        status: "confirmed",
      });

      setMessage({
        type: "success",
        text: `Property ${land.propertyId} successfully verified and minted!`,
      });
    } catch (err) {
      console.error("Blockchain error:", err);
      setMessage({
        type: "error",
        text: `Minting failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      });
    } finally {
      setProcessing(null);
    }
  };

  if (pendingLands === undefined) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card>
          <CardHeader>
            <CardTitle>Government Land Approval Portal</CardTitle>
            <CardDescription>Loading pending verifications...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Government Header */}
      <header className="bg-gradient-to-r from-blue-900 to-blue-800 shadow-xl border-b-4 border-amber-500">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-white/80 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                  <span className="text-3xl">🏛️</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    Government Land Registry
                  </h1>
                  <p className="text-blue-200 text-sm">
                    Ministry of Land Administration
                  </p>
                </div>
              </div>
            </div>
            <nav className="flex items-center gap-3">
              <Link href="/admin/approvals">
                <Button
                  variant="ghost"
                  className="text-white hover:bg-white/10 hover:text-white"
                >
                  Transaction Approvals
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  variant="outline"
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                >
                  Register Property
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-l-4 border-l-amber-500 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    Pending Approvals
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {pendingLands?.length || 0}
                  </p>
                </div>
                <div className="p-3 bg-amber-100 rounded-full">
                  <AlertCircle className="h-8 w-8 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    Verified Today
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    Total Properties
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {pendingLands?.length || 0}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="shadow-xl border-t-4 border-t-blue-600">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-slate-50 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-gray-900">
                  Pending Property Verifications
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  Review documentation and approve property registrations for
                  blockchain minting
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-700 border-amber-200 px-4 py-2 text-sm"
              >
                {pendingLands?.length || 0} Pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {message && (
              <Alert
                variant={message.type === "error" ? "destructive" : "default"}
                className={`mb-6 ${message.type === "success" ? "bg-green-50 border-green-200 text-green-800" : ""}`}
              >
                {message.type === "success" ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <AlertDescription className="font-medium">
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            {pendingLands.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-b from-slate-50 to-white rounded-xl border-2 border-dashed border-slate-200">
                <div className="p-4 bg-green-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <p className="text-xl font-semibold text-gray-900">
                  All Clear!
                </p>
                <p className="text-gray-600 mt-2 max-w-md mx-auto">
                  No pending property verifications at this time. All
                  registrations have been processed.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingLands.map((land, index) => (
                  <Card
                    key={land._id}
                    className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-blue-100 rounded-lg">
                            <FileText className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold text-gray-900">
                                {land.propertyId}
                              </h3>
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-700 border-blue-200"
                              >
                                {land.propertyType}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              Survey No: {land.surveyNumber}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-700 border-amber-300"
                        >
                          #{String(index + 1).padStart(3, "0")}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        {/* Owner Info */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Property Owner
                          </p>
                          <p className="font-semibold text-gray-900">
                            {land.ownerName}
                          </p>
                          <p className="text-xs font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded">
                            {land.ownerWalletAddress.slice(0, 10)}...
                            {land.ownerWalletAddress.slice(-8)}
                          </p>
                        </div>

                        {/* Location */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Location Details
                          </p>
                          <p className="font-semibold text-gray-900">
                            {land.district}
                          </p>
                          <p className="text-sm text-gray-600">
                            {land.state || "India"}
                          </p>
                        </div>

                        {/* Area */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Property Area
                          </p>
                          <p className="font-semibold text-gray-900">
                            {land.areaInSqFt.toLocaleString()} sq ft
                          </p>
                          {land.areaInAcres && (
                            <p className="text-sm text-gray-600">
                              {land.areaInAcres} acres
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Documents Grid */}
                      <div className="border-t pt-6">
                        <p className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
                          Submitted Documents
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {land.documents.saleDeedUrl && (
                            <a
                              href={land.documents.saleDeedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all hover:shadow-md"
                            >
                              <FileText className="h-6 w-6 text-blue-600" />
                              <span className="text-xs font-medium text-blue-900 text-center">
                                Sale Deed
                              </span>
                              <ExternalLink className="h-3 w-3 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
                          )}
                          {land.documents.surveyMapUrl && (
                            <a
                              href={land.documents.surveyMapUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-all hover:shadow-md"
                            >
                              <Map className="h-6 w-6 text-green-600" />
                              <span className="text-xs font-medium text-green-900 text-center">
                                Survey Map
                              </span>
                              <ExternalLink className="h-3 w-3 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
                          )}
                          {land.documents.identityProofUrl && (
                            <a
                              href={land.documents.identityProofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex flex-col items-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-all hover:shadow-md"
                            >
                              <IdCard className="h-6 w-6 text-purple-600" />
                              <span className="text-xs font-medium text-purple-900 text-center">
                                ID Proof
                              </span>
                              <ExternalLink className="h-3 w-3 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
                          )}
                          {land.metadataJsonUrl && (
                            <a
                              href={land.metadataJsonUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex flex-col items-center gap-2 p-4 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-all hover:shadow-md"
                            >
                              <FileJson className="h-6 w-6 text-amber-600" />
                              <span className="text-xs font-medium text-amber-900 text-center">
                                Metadata
                              </span>
                              <ExternalLink className="h-3 w-3 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="border-t pt-6 mt-6 flex justify-end">
                        <Button
                          onClick={() => handleApproveAndMint(land)}
                          disabled={processing === land._id}
                          size="lg"
                          className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
                        >
                          {processing === land._id ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Processing Verification...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-2 h-5 w-5" />
                              Approve & Mint NFT
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
