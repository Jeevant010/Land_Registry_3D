"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft,
  Loader2,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  Wallet,
  Building2,
  Users,
  Shield,
  FileCheck,
  ArrowRight,
} from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";

// Form validation schema
const formSchema = z.object({
  propertyId: z.string().min(1, "Property ID is required"),
  tokenId: z.string().min(1, "Token ID is required").regex(/^\d+$/, "Token ID must be a number"),
  buyerWallet: z
    .string()
    .min(1, "Buyer wallet address is required")
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  agreedPrice: z.string().min(1, "Agreed price is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface UploadedFile {
  name: string;
  cid: string;
  url: string;
}

// Step component for visual progress
function StepIndicator({
  step,
  currentStep,
  title,
}: {
  step: number;
  currentStep: number;
  title: string;
}) {
  const isCompleted = currentStep > step;
  const isCurrent = currentStep === step;

  return (
    <div className="flex items-center">
      <div
        className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
          isCompleted
            ? "bg-green-500 border-green-500 text-white"
            : isCurrent
              ? "bg-blue-500 border-blue-500 text-white"
              : "bg-gray-100 border-gray-300 text-gray-500"
        }`}
      >
        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : step}
      </div>
      <span
        className={`ml-3 font-medium ${isCurrent ? "text-blue-600" : "text-gray-600"}`}
      >
        {title}
      </span>
    </div>
  );
}

export default function TransferPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [transactionId, setTransactionId] = useState<Id<"transactions"> | null>(
    null,
  );
  const [sellerWallet, setSellerWallet] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Document upload states
  const [saleDeed, setSaleDeed] = useState<UploadedFile | null>(null);
  const [encumbranceCert, setEncumbranceCert] = useState<UploadedFile | null>(
    null,
  );
  const [taxReceipt, setTaxReceipt] = useState<UploadedFile | null>(null);
  const [buyerId, setBuyerId] = useState<UploadedFile | null>(null);
  const [sellerId, setSellerId] = useState<UploadedFile | null>(null);
  const [noc, setNoc] = useState<UploadedFile | null>(null);
  const [affidavit, setAffidavit] = useState<UploadedFile | null>(null);

  // Upload loading states
  const [uploadingSaleDeed, setUploadingSaleDeed] = useState(false);
  const [uploadingEncumbrance, setUploadingEncumbrance] = useState(false);
  const [uploadingTax, setUploadingTax] = useState(false);
  const [uploadingBuyerId, setUploadingBuyerId] = useState(false);
  const [uploadingSellerId, setUploadingSellerId] = useState(false);
  const [uploadingNoc, setUploadingNoc] = useState(false);
  const [uploadingAffidavit, setUploadingAffidavit] = useState(false);

  // Convex mutations
  const initiateTransaction = useMutation(api.transactions.initiateTransaction);
  const uploadDocuments = useMutation(api.transactions.uploadDocuments);
  const submitForApproval = useMutation(api.transactions.submitForApproval);
  const lockFunds = useMutation(api.transactions.lockFunds);

  // Query for properties
  const properties = useQuery(api.properties.getAllProperties);

  // Connect wallet on mount
  useEffect(() => {
    const connectWallet = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
          });
          if (accounts && accounts.length > 0) {
            setSellerWallet(accounts[0]);
          }
        } catch (error) {
          console.error("Failed to connect wallet:", error);
        }
      }
    };
    connectWallet();
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyId: "",
      tokenId: "",
      buyerWallet: "",
      agreedPrice: "",
    },
  });

  // Upload function
  const uploadFile = async (file: File): Promise<UploadedFile> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/files", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }

    const data = await response.json();
    return {
      name: file.name,
      cid: data.cid || data.IpfsHash,
      url: data.url,
    };
  };

  // Document upload handlers
  const handleDocumentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: string,
    setFile: (file: UploadedFile | null) => void,
    setUploading: (loading: boolean) => void,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !transactionId) return;

    setUploading(true);
    try {
      const uploaded = await uploadFile(file);
      setFile(uploaded);

      // Update Convex
      await uploadDocuments({
        transactionId,
        documentType: type,
        cid: uploaded.cid,
        url: uploaded.url,
      });

      setMessage({ type: "success", text: `${type} uploaded successfully!` });
    } catch (error) {
      console.error(`${type} upload error:`, error);
      setMessage({
        type: "error",
        text: `Failed to upload ${type}: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setUploading(false);
    }
  };

  // Step 1: Initiate Transaction
  const handleInitiateTransaction = async (values: FormValues) => {
    if (!sellerWallet) {
      setMessage({ type: "error", text: "Please connect your wallet first" });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      // For demo, using a placeholder escrow address
      const escrowAddress = "0x0000000000000000000000000000000000000000";

      const txId = await initiateTransaction({
        propertyId: values.propertyId,
        tokenId: values.tokenId,
        sellerWallet,
        buyerWallet: values.buyerWallet,
        agreedPrice: values.agreedPrice,
        escrowContractAddress: escrowAddress,
      });

      setTransactionId(txId);
      setMessage({
        type: "success",
        text: "Transaction initiated! Proceed to lock funds.",
      });
      setCurrentStep(2);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to initiate transaction",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Lock Funds (Simulated for now)
  const handleLockFunds = async () => {
    if (!transactionId) return;

    setSubmitting(true);
    setMessage(null);

    try {
      // In production, this would call the smart contract
      // For now, we simulate with a placeholder tx hash
      const mockTxHash = `0x${Array(64)
        .fill(0)
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join("")}`;

      await lockFunds({
        transactionId,
        lockTxHash: mockTxHash,
      });

      setMessage({
        type: "success",
        text: "Funds locked in escrow! Proceed to upload documents.",
      });
      setCurrentStep(3);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to lock funds",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Step 3: Submit for Approval
  const handleSubmitForApproval = async () => {
    if (!transactionId) return;

    // Validate required documents
    if (!saleDeed || !encumbranceCert || !taxReceipt || !buyerId) {
      setMessage({
        type: "error",
        text: "Please upload all required documents (Sale Deed, EC, Tax Receipt, Buyer ID)",
      });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      await submitForApproval({ transactionId });

      setMessage({
        type: "success",
        text: "Transaction submitted for government approval! You will be notified once reviewed.",
      });
      setCurrentStep(4);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to submit for approval",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Document upload card component
  const DocumentUploadCard = ({
    title,
    description,
    required,
    file,
    uploading,
    onUpload,
    accept = ".pdf,.jpg,.jpeg,.png",
  }: {
    title: string;
    description: string;
    required?: boolean;
    file: UploadedFile | null;
    uploading: boolean;
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    accept?: string;
  }) => (
    <Card className={`${file ? "border-green-300 bg-green-50/50" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-sm">{title}</span>
              {required && (
                <Badge variant="destructive" className="text-xs">
                  Required
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
          <div className="ml-4">
            {file ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(file.url, "_blank")}
                >
                  View
                </Button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  accept={accept}
                  onChange={onUpload}
                  disabled={uploading}
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  asChild
                >
                  <span>
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    <span className="ml-2">Upload</span>
                  </span>
                </Button>
              </label>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4 group">
              <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Button>
          </Link>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                Property Transfer
              </h1>
            </div>
            <p className="text-gray-600">
              Transfer property ownership securely through blockchain-verified
              transactions with government approval.
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-8">
          <div className="flex justify-between items-center">
            <StepIndicator
              step={1}
              currentStep={currentStep}
              title="Initiate Transfer"
            />
            <ArrowRight className="h-5 w-5 text-gray-300" />
            <StepIndicator
              step={2}
              currentStep={currentStep}
              title="Lock Funds"
            />
            <ArrowRight className="h-5 w-5 text-gray-300" />
            <StepIndicator
              step={3}
              currentStep={currentStep}
              title="Upload Documents"
            />
            <ArrowRight className="h-5 w-5 text-gray-300" />
            <StepIndicator
              step={4}
              currentStep={currentStep}
              title="Await Approval"
            />
          </div>
        </div>

        {/* Status Messages */}
        {message && (
          <Alert
            className={`mb-6 ${message.type === "success" ? "border-green-500" : "border-red-500"}`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Wallet Status */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-gray-500" />
                <span className="font-medium">Seller Wallet (You)</span>
              </div>
              {sellerWallet ? (
                <Badge variant="outline" className="font-mono">
                  {sellerWallet.slice(0, 6)}...{sellerWallet.slice(-4)}
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
                      if (accounts?.[0]) setSellerWallet(accounts[0]);
                    }
                  }}
                >
                  Connect Wallet
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Step 1: Initiate Transaction */}
        {currentStep === 1 && (
          <>
            {/* Important Notice */}
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-900">Before You Begin</AlertTitle>
              <AlertDescription className="text-blue-800">
                <div className="space-y-2 mt-2">
                  <p>• You must have <strong>already registered</strong> the property in the system</p>
                  <p>• Use the <strong>Property ID</strong> (e.g., "123") from your registration, NOT wallet addresses</p>
                  <p>• You must be the current owner (your wallet must match the registered owner)</p>
                  <p className="mt-3 pt-3 border-t border-blue-200">
                    <Link href="/register" className="text-blue-600 underline font-medium">
                      Don't have a registered property? Register one here →
                    </Link>
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Step 1: Initiate Property Transfer
                </CardTitle>
                <CardDescription>
                  Enter the property details and buyer information to start the
                  transfer process.
                </CardDescription>
              </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleInitiateTransaction)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="propertyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property ID</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter the property ID from your registration (e.g., 123, PROP-001)"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-blue-600 font-medium">
                          ⚠️ Enter the Property ID from when you registered the property (NOT a wallet address). 
                          {properties && properties.length > 0 && sellerWallet && (
                            <span className="block mt-2">
                              Your registered properties: {properties
                                .filter(p => p.ownerWalletAddress.toLowerCase() === sellerWallet.toLowerCase())
                                .map(p => p.propertyId)
                                .join(', ') || 'None found - Please register a property first'}
                            </span>
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tokenId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NFT Token ID</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter the token ID (e.g., 0, 1, 2)"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          The blockchain token ID of the property NFT you want to transfer. This was assigned when the property was minted.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="buyerWallet"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Buyer Wallet Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="0x..."
                            {...field}
                            className="font-mono"
                          />
                        </FormControl>
                        <FormDescription>
                          The Ethereum wallet address of the buyer
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="agreedPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agreed Price (ETH)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.001"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          The agreed sale price in ETH
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={submitting || !sellerWallet}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Initiating Transfer...
                      </>
                    ) : (
                      <>
                        Initiate Transfer
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          </>
        )}

        {/* Step 2: Lock Funds */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Step 2: Lock Funds in Escrow
              </CardTitle>
              <CardDescription>
                The buyer needs to lock the agreed amount in the smart contract
                escrow.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  In production, this step would require the buyer to deposit{" "}
                  {form.getValues("agreedPrice")} ETH into the escrow smart
                  contract. For this demo, we&apos;ll simulate the fund locking.
                </AlertDescription>
              </Alert>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Property ID:</span>
                  <span className="font-medium">
                    {form.getValues("propertyId")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Agreed Price:</span>
                  <span className="font-medium">
                    {form.getValues("agreedPrice")} ETH
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Buyer Wallet:</span>
                  <span className="font-mono text-sm">
                    {form.getValues("buyerWallet")}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleLockFunds}
                className="w-full"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Locking Funds...
                  </>
                ) : (
                  <>
                    Lock Funds in Escrow
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Upload Documents */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Step 3: Upload Approval Packet
              </CardTitle>
              <CardDescription>
                Upload all required documents for government verification. These
                documents form the &quot;Approval Packet&quot; that the
                government official will review.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Required Documents */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">
                  Required Documents
                </h3>

                <DocumentUploadCard
                  title="Sale Deed"
                  description="The signed legal contract between buyer and seller"
                  required
                  file={saleDeed}
                  uploading={uploadingSaleDeed}
                  onUpload={(e) =>
                    handleDocumentUpload(
                      e,
                      "saleDeed",
                      setSaleDeed,
                      setUploadingSaleDeed,
                    )
                  }
                />

                <DocumentUploadCard
                  title="Encumbrance Certificate (EC)"
                  description="Proof that the land has no existing loans or legal disputes"
                  required
                  file={encumbranceCert}
                  uploading={uploadingEncumbrance}
                  onUpload={(e) =>
                    handleDocumentUpload(
                      e,
                      "encumbranceCert",
                      setEncumbranceCert,
                      setUploadingEncumbrance,
                    )
                  }
                />

                <DocumentUploadCard
                  title="Tax Receipt"
                  description="Proof that property tax has been paid up to date"
                  required
                  file={taxReceipt}
                  uploading={uploadingTax}
                  onUpload={(e) =>
                    handleDocumentUpload(
                      e,
                      "taxReceipt",
                      setTaxReceipt,
                      setUploadingTax,
                    )
                  }
                />

                <DocumentUploadCard
                  title="Buyer Identity Proof"
                  description="Aadhaar, PAN, or other government ID of the buyer"
                  required
                  file={buyerId}
                  uploading={uploadingBuyerId}
                  onUpload={(e) =>
                    handleDocumentUpload(
                      e,
                      "buyerId",
                      setBuyerId,
                      setUploadingBuyerId,
                    )
                  }
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </div>

              {/* Optional Documents */}
              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">
                  Optional Documents
                </h3>

                <DocumentUploadCard
                  title="Seller Identity Proof"
                  description="Aadhaar, PAN, or other government ID of the seller"
                  file={sellerId}
                  uploading={uploadingSellerId}
                  onUpload={(e) =>
                    handleDocumentUpload(
                      e,
                      "sellerId",
                      setSellerId,
                      setUploadingSellerId,
                    )
                  }
                  accept=".pdf,.jpg,.jpeg,.png"
                />

                <DocumentUploadCard
                  title="No Objection Certificate (NOC)"
                  description="NOC from housing society or relevant authority"
                  file={noc}
                  uploading={uploadingNoc}
                  onUpload={(e) =>
                    handleDocumentUpload(e, "noc", setNoc, setUploadingNoc)
                  }
                />

                <DocumentUploadCard
                  title="Affidavit"
                  description="Sworn statement declaring voluntary sale"
                  file={affidavit}
                  uploading={uploadingAffidavit}
                  onUpload={(e) =>
                    handleDocumentUpload(
                      e,
                      "affidavit",
                      setAffidavit,
                      setUploadingAffidavit,
                    )
                  }
                />
              </div>

              <div className="pt-4">
                <Button
                  onClick={handleSubmitForApproval}
                  className="w-full"
                  disabled={
                    submitting ||
                    !saleDeed ||
                    !encumbranceCert ||
                    !taxReceipt ||
                    !buyerId
                  }
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting for Approval...
                    </>
                  ) : (
                    <>
                      Submit for Government Approval
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Awaiting Approval */}
        {currentStep === 4 && (
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                Submission Complete!
              </CardTitle>
              <CardDescription>
                Your property transfer request has been submitted for government
                approval.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction Status:</span>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    Pending Approval
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Property ID:</span>
                  <span className="font-medium">
                    {form.getValues("propertyId")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Buyer:</span>
                  <span className="font-mono text-sm">
                    {form.getValues("buyerWallet").slice(0, 10)}...
                  </span>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>What happens next?</AlertTitle>
                <AlertDescription>
                  A government official will review your documents. Once
                  approved, the property NFT will be transferred to the buyer
                  and funds will be released from escrow. If rejected, the funds
                  will be refunded.
                </AlertDescription>
              </Alert>

              <div className="flex gap-4">
                <Link href="/" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Return Home
                  </Button>
                </Link>
                <Link href="/admin" className="flex-1">
                  <Button variant="default" className="w-full">
                    View Admin Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
