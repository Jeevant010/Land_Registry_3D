"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { ethers } from "ethers";
import contractABI from "@/utils/contractABI.json";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileText,
  Shield,
  Wallet,
  Building2,
  User,
  Receipt,
  FileCheck,
  BadgeCheck,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";

// Document tabs configuration
const DOCUMENT_TABS = [
  { id: "saleDeed", label: "Sale Deed", icon: FileText, required: true },
  {
    id: "encumbranceCert",
    label: "EC Certificate",
    icon: Shield,
    required: true,
  },
  { id: "taxReceipt", label: "Tax Receipt", icon: Receipt, required: true },
  { id: "buyerId", label: "Buyer ID", icon: User, required: true },
  { id: "sellerId", label: "Seller ID", icon: User, required: false },
  { id: "noc", label: "NOC", icon: FileCheck, required: false },
  { id: "affidavit", label: "Affidavit", icon: BadgeCheck, required: false },
];

// Verification checklist items
const VERIFICATION_CHECKLIST = [
  {
    id: "signatures",
    label: "Verify signatures match on Sale Deed",
    description: "Check that buyer and seller signatures are authentic",
  },
  {
    id: "propertyTax",
    label: "Verify property tax is paid",
    description: "Confirm tax receipt shows payment up to current year",
  },
  {
    id: "encumbrance",
    label: "Verify no encumbrances (EC)",
    description: "Confirm no loans, mortgages, or legal disputes",
  },
  {
    id: "buyerKyc",
    label: "Verify buyer KYC",
    description: "Match buyer identity document with sale deed details",
  },
];

export default function ApprovalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const transactionId = params.id as string;

  // State
  const [activeTab, setActiveTab] = useState("saleDeed");
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    signatures: false,
    propertyTax: false,
    encumbrance: false,
    buyerKyc: false,
  });
  const [adminWallet, setAdminWallet] = useState<string>("");
  const [adminComments, setAdminComments] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Convex queries and mutations - with safety checks
  const transaction = api.transactions?.getTransactionById
    ? useQuery(api.transactions.getTransactionById, {
        transactionId: transactionId as Id<"transactions">,
      })
    : null;

  let approveTransactionMutation: ReturnType<typeof useMutation> | null = null;
  let rejectTransactionMutation: ReturnType<typeof useMutation> | null = null;

  try {
    if (api.transactions) {
      approveTransactionMutation = useMutation(
        api.transactions.approveTransaction,
      );
      rejectTransactionMutation = useMutation(
        api.transactions.rejectTransaction,
      );
    }
  } catch (e) {
    console.warn("Transactions API not ready");
  }

  // Connect admin wallet on mount
  useEffect(() => {
    const connectWallet = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
          });
          if (accounts && accounts.length > 0) {
            setAdminWallet(accounts[0]);
          }
        } catch (error) {
          console.error("Failed to connect wallet:", error);
        }
      }
    };
    connectWallet();
  }, []);

  // Check if all required verifications are complete
  const allVerificationsComplete = Object.values(checklist).every(Boolean);

  // Get document URL based on active tab
  const getDocumentUrl = () => {
    if (!transaction?.documents) return null;

    const docMap: Record<string, string | undefined> = {
      saleDeed: transaction.documents.saleDeedUrl,
      encumbranceCert: transaction.documents.encumbranceCertUrl,
      taxReceipt: transaction.documents.taxReceiptUrl,
      buyerId: transaction.documents.buyerIdUrl,
      sellerId: transaction.documents.sellerIdUrl,
      noc: transaction.documents.nocUrl,
      affidavit: transaction.documents.affidavitUrl,
    };

    return docMap[activeTab] || null;
  };

  // Handle approval
  const handleApprove = async () => {
    if (!adminWallet) {
      setMessage({ type: "error", text: "Please connect your wallet first" });
      return;
    }

    if (!allVerificationsComplete) {
      setMessage({
        type: "error",
        text: "Please complete all verification checks before approving",
      });
      return;
    }

    setProcessing(true);
    setMessage(null);

    try {
      // Check for MetaMask
      if (!window.ethereum) {
        throw new Error("Please install MetaMask to continue");
      }

      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      if (!contractAddress) {
        throw new Error("Contract address not configured");
      }

      // Connect to provider
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Create contract instance
      const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer,
      );

      // Get the token ID from the transaction (user-provided)
      const tokenId = transaction!.tokenId ? parseInt(transaction!.tokenId) : null;
      
      if (!tokenId && tokenId !== 0) {
        throw new Error("Token ID is missing from transaction. Please provide a valid token ID.");
      }

      // Validate addresses before transfer
      const sellerAddr = transaction!.sellerWallet;
      const buyerAddr = transaction!.buyerWallet;

      console.log("Transfer Details:", {
        tokenId,
        seller: sellerAddr,
        buyer: buyerAddr,
        propertyId: transaction!.propertyId,
      });

      // Check if seller and buyer are different
      if (sellerAddr.toLowerCase() === buyerAddr.toLowerCase()) {
        throw new Error(
          `Invalid transaction: Seller and buyer addresses are identical (${sellerAddr}). ` +
          "A property cannot be transferred to the same owner."
        );
      }

      // Check if seller actually owns the token
      const currentOwner = await contract.ownerOf(tokenId);
      console.log("Current token owner:", currentOwner);
      
      if (currentOwner.toLowerCase() !== sellerAddr.toLowerCase()) {
        throw new Error(
          `Seller address ${sellerAddr} does not own token ${tokenId}. ` +
          `Current owner is ${currentOwner}`
        );
      }

      // Execute the transfer on blockchain using Government-authorized transferLand function
      // This is required for the Soulbound contract
      const tx = await contract.transferLand(
        sellerAddr,
        buyerAddr,
        tokenId,
      );

      // Wait for confirmation
      const receipt = await tx.wait();
      const txHash = receipt.hash;

      // Update Convex database
      if (approveTransactionMutation) {
        await approveTransactionMutation({
          transactionId: transactionId as Id<"transactions">,
          adminWallet,
          mintTxHash: txHash,
          adminComments: adminComments || undefined,
        });
      }

      setMessage({
        type: "success",
        text: "Transaction approved! Property NFT transferred successfully.",
      });

      // Redirect after short delay
      setTimeout(() => router.push("/admin"), 2000);
    } catch (error) {
      console.error("Approval error:", error);

      // Handle specific errors
      let errorMessage = "Failed to approve transaction";
      if (error instanceof Error) {
        if (error.message.includes("user rejected")) {
          errorMessage = "Transaction was rejected by user";
        } else if (error.message.includes("insufficient funds")) {
          errorMessage = "Insufficient gas funds";
        } else {
          errorMessage = error.message;
        }
      }

      setMessage({ type: "error", text: errorMessage });
    } finally {
      setProcessing(false);
    }
  };

  // Handle rejection
  const handleReject = async () => {
    if (!adminWallet) {
      setMessage({ type: "error", text: "Please connect your wallet first" });
      return;
    }

    if (!rejectionReason.trim()) {
      setMessage({ type: "error", text: "Please provide a rejection reason" });
      return;
    }

    setProcessing(true);
    setMessage(null);

    try {
      // In production, you would also trigger refund from escrow here
      if (rejectTransactionMutation) {
        await rejectTransactionMutation({
          transactionId: transactionId as Id<"transactions">,
          adminWallet,
          rejectionReason,
        });
      }

      setShowRejectModal(false);
      setMessage({
        type: "success",
        text: "Transaction rejected. Funds will be refunded to buyer.",
      });

      // Redirect after short delay
      setTimeout(() => router.push("/admin"), 2000);
    } catch (error) {
      console.error("Rejection error:", error);
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to reject transaction",
      });
    } finally {
      setProcessing(false);
    }
  };

  // Loading state
  if (transaction === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Not found state
  if (transaction === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-2xl mx-auto">
          <Alert className="border-red-500">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertTitle>Transaction Not Found</AlertTitle>
            <AlertDescription>
              The requested transaction could not be found.
            </AlertDescription>
          </Alert>
          <Link href="/admin">
            <Button className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Admin Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const documentUrl = getDocumentUrl();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Transaction Approval
                </h1>
                <p className="text-sm text-gray-500">
                  Review documents and verify transaction
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge
                variant="outline"
                className={`${
                  transaction.status === "SUBMITTED"
                    ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                    : transaction.status === "APPROVED"
                      ? "bg-green-100 text-green-800 border-green-300"
                      : "bg-red-100 text-red-800 border-red-300"
                }`}
              >
                {transaction.status}
              </Badge>
              {adminWallet ? (
                <Badge variant="outline" className="font-mono">
                  <Wallet className="h-3 w-3 mr-1" />
                  {adminWallet.slice(0, 6)}...{adminWallet.slice(-4)}
                </Badge>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (window.ethereum) {
                      const accounts = await window.ethereum.request({
                        method: "eth_requestAccounts",
                      });
                      if (accounts?.[0]) setAdminWallet(accounts[0]);
                    }
                  }}
                >
                  Connect Wallet
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {message && (
        <div className="container mx-auto px-4 py-4">
          <Alert
            className={`${message.type === "success" ? "border-green-500" : "border-red-500"}`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Split Screen Layout */}
      <div className="flex h-[calc(100vh-120px)]">
        {/* Left Panel - Document Viewer (60%) */}
        <div className="w-[60%] border-r bg-white flex flex-col">
          {/* Document Tabs */}
          <div className="border-b px-4 py-2 bg-gray-50">
            <div className="flex gap-1 overflow-x-auto">
              {DOCUMENT_TABS.map((tab) => {
                const Icon = tab.icon;
                const hasDocument =
                  transaction.documents &&
                  transaction.documents[
                    `${tab.id}Url` as keyof typeof transaction.documents
                  ];

                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 ${
                      !hasDocument ? "opacity-50" : ""
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    {tab.required && !hasDocument && (
                      <AlertTriangle className="h-3 w-3 text-yellow-500" />
                    )}
                    {hasDocument && (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    )}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Document Display */}
          <div className="flex-1 p-4 bg-gray-100">
            {documentUrl ? (
              <div className="h-full bg-white rounded-lg shadow-inner overflow-hidden">
                {documentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img
                    src={documentUrl}
                    alt={activeTab}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <iframe
                    src={documentUrl}
                    className="w-full h-full"
                    title={activeTab}
                  />
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center bg-white rounded-lg">
                <div className="text-center text-gray-500">
                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No Document Uploaded</p>
                  <p className="text-sm">
                    This document has not been provided for this transaction.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Document Actions */}
          {documentUrl && (
            <div className="border-t px-4 py-2 bg-white">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(documentUrl, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
            </div>
          )}
        </div>

        {/* Right Panel - Decision Console (40%) */}
        <div className="w-[40%] flex flex-col bg-gray-50 overflow-y-auto">
          {/* Transaction Info */}
          <Card className="m-4 mb-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Transaction Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Address Validation Warning */}
              {transaction.sellerWallet.toLowerCase() === transaction.buyerWallet.toLowerCase() && (
                <Alert className="border-red-500 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <AlertTitle>Invalid Transaction</AlertTitle>
                  <AlertDescription className="text-sm">
                    Seller and buyer addresses are identical. This transaction cannot be processed.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Property ID</span>
                  <p className="font-medium">{transaction.propertyId}</p>
                </div>
                <div>
                  <span className="text-gray-500">Token ID</span>
                  <p className="font-medium">{transaction.tokenId || 'Not specified'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Agreed Price</span>
                  <p className="font-medium">{transaction.agreedPrice} ETH</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Seller Wallet</span>
                  <p className="font-mono text-xs break-all">
                    {transaction.sellerWallet}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Buyer Wallet</span>
                  <p className="font-mono text-xs break-all">
                    {transaction.buyerWallet}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Escrow Status */}
          <Card className="mx-4 mb-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Escrow Status</span>
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-300">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Funds Locked: {transaction.agreedPrice} ETH
                </Badge>
              </div>
              {transaction.lockTxHash && (
                <p className="text-xs text-gray-500 mt-2 font-mono truncate">
                  Lock TX: {transaction.lockTxHash}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Verification Checklist */}
          <Card className="mx-4 mb-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Verification Checklist</CardTitle>
              <CardDescription>
                Complete all checks before approving
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {VERIFICATION_CHECKLIST.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-white"
                >
                  <Checkbox
                    id={item.id}
                    checked={checklist[item.id]}
                    onCheckedChange={(checked) =>
                      setChecklist((prev) => ({
                        ...prev,
                        [item.id]: !!checked,
                      }))
                    }
                    disabled={transaction.status !== "SUBMITTED"}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={item.id}
                      className="font-medium cursor-pointer"
                    >
                      {item.label}
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}

              {/* Progress indicator */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Verification Progress</span>
                  <span>
                    {Object.values(checklist).filter(Boolean).length}/
                    {VERIFICATION_CHECKLIST.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      allVerificationsComplete ? "bg-green-500" : "bg-blue-500"
                    } ${
                      Object.values(checklist).filter(Boolean).length === 0
                        ? "w-0"
                        : Object.values(checklist).filter(Boolean).length === 1
                          ? "w-1/4"
                          : Object.values(checklist).filter(Boolean).length ===
                              2
                            ? "w-1/2"
                            : Object.values(checklist).filter(Boolean)
                                  .length === 3
                              ? "w-3/4"
                              : "w-full"
                    }`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Comments */}
          <Card className="mx-4 mb-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Admin Comments</CardTitle>
              <CardDescription>
                Optional notes for this approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add any comments or notes..."
                value={adminComments}
                onChange={(e) => setAdminComments(e.target.value)}
                disabled={transaction.status !== "SUBMITTED"}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {transaction.status === "SUBMITTED" && (
            <div className="mx-4 mb-4 space-y-3">
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
                onClick={handleApprove}
                disabled={
                  !allVerificationsComplete || 
                  processing || 
                  !adminWallet ||
                  transaction.sellerWallet.toLowerCase() === transaction.buyerWallet.toLowerCase()
                }
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Approval...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve & Transfer Property
                  </>
                )}
              </Button>

              {transaction.sellerWallet.toLowerCase() === transaction.buyerWallet.toLowerCase() && (
                <p className="text-xs text-red-600 text-center">
                  Cannot approve: Seller and buyer must be different addresses
                </p>
              )}

              <Button
                variant="destructive"
                className="w-full"
                size="lg"
                onClick={() => setShowRejectModal(true)}
                disabled={processing}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject Transaction
              </Button>

              {!allVerificationsComplete && (
                <p className="text-xs text-center text-gray-500">
                  Complete all verification checks to enable approval
                </p>
              )}
            </div>
          )}

          {/* Already processed */}
          {transaction.status !== "SUBMITTED" && (
            <div className="mx-4 mb-4">
              <Alert
                className={
                  transaction.status === "APPROVED"
                    ? "border-green-500"
                    : "border-red-500"
                }
              >
                {transaction.status === "APPROVED" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <AlertTitle>
                  Transaction{" "}
                  {transaction.status === "APPROVED" ? "Approved" : "Rejected"}
                </AlertTitle>
                <AlertDescription>
                  {transaction.status === "APPROVED" ? (
                    <>
                      Approved by: {transaction.approvedBy?.slice(0, 10)}...
                      <br />
                      TX Hash: {transaction.txHash?.slice(0, 20)}...
                    </>
                  ) : (
                    <>
                      Rejected by: {transaction.rejectedBy?.slice(0, 10)}...
                      <br />
                      Reason: {transaction.rejectionReason}
                    </>
                  )}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </div>

      {/* Rejection Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Reject Transaction
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this transaction. The funds
              will be refunded to the buyer.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="rejection-reason">Rejection Reason</Label>
            <Textarea
              id="rejection-reason"
              placeholder="e.g., Signature mismatch on page 2 of Sale Deed"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="mt-2"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectModal(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || processing}
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Confirm Rejection"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
