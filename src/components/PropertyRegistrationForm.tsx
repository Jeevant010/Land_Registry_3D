"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, Upload, CheckCircle2, AlertCircle, FileText, X, Download } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

// Form validation schema
const formSchema = z.object({
  propertyId: z.string().min(1, "Property ID is required"),
  surveyNumber: z.string().min(1, "Survey number is required"),
  district: z.string().min(1, "District is required"),
  state: z.string().optional(),
  country: z.string().optional(),
  areaInSqFt: z.string().min(1, "Area is required"),
  areaInAcres: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  ownerName: z.string().min(1, "Owner name is required"),
  ownerWalletAddress: z
    .string()
    .min(1, "Wallet address is required")
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  ownerContactEmail: z
    .string()
    .email("Invalid email")
    .optional()
    .or(z.literal("")),
  ownerContactPhone: z.string().optional(),
  isEncumbered: z.boolean(),
  encumbranceDetails: z.string().optional(),
  propertyType: z.enum([
    "residential",
    "commercial",
    "agricultural",
    "industrial",
  ]),
  currentUse: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface UploadedFile {
  name: string;
  cid: string;
  url: string;
}

export default function PropertyRegistrationForm() {
  // Use Convex mutation
  const registerProperty = useMutation(api.properties.registerProperty);

  // Form state
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyId: "",
      surveyNumber: "",
      district: "",
      state: "",
      country: "",
      areaInSqFt: "",
      areaInAcres: "",
      latitude: "",
      longitude: "",
      ownerName: "",
      ownerWalletAddress: "",
      ownerContactEmail: "",
      ownerContactPhone: "",
      isEncumbered: false,
      encumbranceDetails: "",
      propertyType: "residential",
      currentUse: "",
    },
  });

  // Document upload states
  const [saleDeed, setSaleDeed] = useState<UploadedFile | null>(null);
  const [surveyMap, setSurveyMap] = useState<UploadedFile | null>(null);
  const [identityProof, setIdentityProof] = useState<UploadedFile | null>(null);
  const [encumbranceCert, setEncumbranceCert] = useState<UploadedFile | null>(
    null,
  );
  const [taxReceipt, setTaxReceipt] = useState<UploadedFile | null>(null);
  const [sitePhotos, setSitePhotos] = useState<UploadedFile[]>([]);

  // Upload states
  const [uploadingSaleDeed, setUploadingSaleDeed] = useState(false);
  const [uploadingSurveyMap, setUploadingSurveyMap] = useState(false);
  const [uploadingIdentity, setUploadingIdentity] = useState(false);
  const [uploadingEncumbrance, setUploadingEncumbrance] = useState(false);
  const [uploadingTax, setUploadingTax] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Upload function
  const uploadFile = async (file: File): Promise<UploadedFile> => {
    console.log("Starting upload for:", file.name);

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/files", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Upload failed:", error);
      throw new Error(error.error || "Upload failed");
    }

    const data = await response.json();
    console.log("Upload successful:", data);

    return {
      name: file.name,
      cid: data.cid || data.IpfsHash,
      url: data.url,
    };
  };

  // Document upload handlers
  const handleSaleDeedUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSaleDeed(true);
    try {
      const uploaded = await uploadFile(file);
      setSaleDeed(uploaded);
      console.log("Sale deed uploaded:", uploaded);
    } catch (error) {
      console.error("Sale deed upload error:", error);
      alert(
        `Failed to upload: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setUploadingSaleDeed(false);
    }
  };

  const handleSurveyMapUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSurveyMap(true);
    try {
      const uploaded = await uploadFile(file);
      setSurveyMap(uploaded);
      console.log("Survey map uploaded:", uploaded);
    } catch (error) {
      console.error("Survey map upload error:", error);
      alert(
        `Failed to upload: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setUploadingSurveyMap(false);
    }
  };

  const handleIdentityUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIdentity(true);
    try {
      const uploaded = await uploadFile(file);
      setIdentityProof(uploaded);
      console.log("Identity proof uploaded:", uploaded);
    } catch (error) {
      console.error("Identity proof upload error:", error);
      alert(
        `Failed to upload: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setUploadingIdentity(false);
    }
  };

  const handleEncumbranceUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingEncumbrance(true);
    try {
      const uploaded = await uploadFile(file);
      setEncumbranceCert(uploaded);
      console.log("Encumbrance certificate uploaded:", uploaded);
    } catch (error) {
      console.error("Encumbrance upload error:", error);
      alert(
        `Failed to upload: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setUploadingEncumbrance(false);
    }
  };

  const handleTaxReceiptUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingTax(true);
    try {
      const uploaded = await uploadFile(file);
      setTaxReceipt(uploaded);
      console.log("Tax receipt uploaded:", uploaded);
    } catch (error) {
      console.error("Tax receipt upload error:", error);
      alert(
        `Failed to upload: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setUploadingTax(false);
    }
  };

  const handleSitePhotosUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingPhotos(true);
    try {
      const uploaded: UploadedFile[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`Uploading photo ${i + 1}/${files.length}:`, file.name);
        const result = await uploadFile(file);
        uploaded.push(result);
      }
      setSitePhotos((prev) => [...prev, ...uploaded]);
      console.log("Site photos uploaded:", uploaded);
    } catch (error) {
      console.error("Site photos upload error:", error);
      alert(
        `Failed to upload: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setUploadingPhotos(false);
    }
  };

  // Helper function to render file upload component
  const FileUploadZone = ({ 
    label, 
    required = false, 
    file, 
    uploading, 
    onChange,
    accept = ".pdf,.jpg,.jpeg,.png",
    multiple = false 
  }: { 
    label: string; 
    required?: boolean; 
    file: UploadedFile | null | UploadedFile[]; 
    uploading: boolean; 
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    accept?: string;
    multiple?: boolean;
  }) => {
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDragEnter = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      
      const files = e.dataTransfer.files;
      if (files && files.length > 0 && inputRef.current) {
        const dataTransfer = new DataTransfer();
        for (let i = 0; i < files.length; i++) {
          dataTransfer.items.add(files[i]);
        }
        inputRef.current.files = dataTransfer.files;
        onChange({ target: inputRef.current } as any);
      }
    };

    const hasFile = Array.isArray(file) ? file.length > 0 : !!file;
    const fileArray = Array.isArray(file) ? file : file ? [file] : [];

    return (
      <div className="space-y-3">
        <FormLabel className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </FormLabel>
        
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-6 transition-all duration-200
            ${isDragging 
              ? 'border-primary bg-primary/5 scale-[1.02]' 
              : hasFile
                ? 'border-green-500 bg-green-50/50'
                : 'border-gray-300 hover:border-gray-400 bg-gray-50/50'
            }
            ${uploading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100/50'}
          `}
          onClick={() => !uploading && inputRef.current?.click()}
        >
          <input
            title="name"
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={onChange}
            disabled={uploading}
            className="hidden"
          />
          
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            {uploading ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">Uploading to IPFS...</p>
                  <p className="text-xs text-gray-500">Please wait while we secure your file</p>
                </div>
              </>
            ) : hasFile ? (
              <>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-green-700">
                    {multiple ? `${fileArray.length} file(s) uploaded` : 'File uploaded successfully'}
                  </p>
                  <p className="text-xs text-gray-500">Click to replace or drag new file</p>
                </div>
              </>
            ) : (
              <>
                <div className="p-3 bg-primary/10 rounded-full">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">
                    {isDragging ? 'Drop file here' : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {accept.includes('.pdf') && 'PDF, '}
                    {accept.includes('.jpg') && 'JPG, '}
                    {accept.includes('.png') && 'PNG '}
                    files accepted
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* File Details */}
        {hasFile && fileArray.length > 0 && (
          <div className="space-y-2">
            {fileArray.map((f, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2 bg-blue-50 rounded">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {f.name}
                    </p>
                    <p className="text-xs text-gray-500 font-mono truncate">
                      IPFS: {f.cid.substring(0, 12)}...{f.cid.substring(f.cid.length - 8)}
                    </p>
                  </div>
                </div>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Form submission
  const onSubmit = async (data: FormValues) => {
    // Check required documents
    if (!saleDeed || !surveyMap || !identityProof) {
      setMessage({
        type: "error",
        text: "Please upload all required documents (Sale Deed, Survey Map, Identity Proof)",
      });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      // Create metadata JSON
      const metadata = {
        propertyDetails: {
          propertyId: data.propertyId,
          surveyNumber: data.surveyNumber,
          location: {
            district: data.district,
            state: data.state || "",
            country: data.country || "",
            coordinates: {
              latitude: data.latitude || "",
              longitude: data.longitude || "",
            },
          },
          area: {
            sqFt: parseFloat(data.areaInSqFt),
            acres: data.areaInAcres ? parseFloat(data.areaInAcres) : undefined,
          },
          propertyType: data.propertyType,
          currentUse: data.currentUse || "",
        },
        ownerDetails: {
          name: data.ownerName,
          walletAddress: data.ownerWalletAddress,
          contactEmail: data.ownerContactEmail || "",
          contactPhone: data.ownerContactPhone || "",
        },
        encumbrance: {
          isEncumbered: data.isEncumbered,
          details: data.encumbranceDetails || "",
        },
        documents: {
          saleDeed: {
            name: saleDeed.name,
            ipfsCid: saleDeed.cid,
            ipfsUrl: saleDeed.url,
          },
          surveyMap: {
            name: surveyMap.name,
            ipfsCid: surveyMap.cid,
            ipfsUrl: surveyMap.url,
          },
          identityProof: {
            name: identityProof.name,
            ipfsCid: identityProof.cid,
            ipfsUrl: identityProof.url,
          },
          encumbranceCertificate: encumbranceCert
            ? {
                name: encumbranceCert.name,
                ipfsCid: encumbranceCert.cid,
                ipfsUrl: encumbranceCert.url,
              }
            : undefined,
          taxReceipt: taxReceipt
            ? {
                name: taxReceipt.name,
                ipfsCid: taxReceipt.cid,
                ipfsUrl: taxReceipt.url,
              }
            : undefined,
          sitePhotos: sitePhotos.map((photo) => ({
            name: photo.name,
            ipfsCid: photo.cid,
            ipfsUrl: photo.url,
          })),
        },
        registrationTimestamp: new Date().toISOString(),
      };

      console.log("Metadata created:", metadata);

      // Upload metadata to IPFS
      const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
        type: "application/json",
      });
      const metadataFile = new File([metadataBlob], "metadata.json", {
        type: "application/json",
      });

      console.log("Uploading metadata to IPFS...");
      const metadataUpload = await uploadFile(metadataFile);
      console.log("Metadata uploaded:", metadataUpload);

      // Save to Convex if available
      if (registerProperty) {
        console.log("Saving to Convex...");

        const gpsCoordinates =
          data.latitude && data.longitude
            ? {
                latitude: parseFloat(data.latitude),
                longitude: parseFloat(data.longitude),
              }
            : undefined;

        const propertyData = {
          propertyId: data.propertyId,
          surveyNumber: data.surveyNumber,
          district: data.district,
          state: data.state || "",
          country: data.country || "",
          areaInSqFt: parseFloat(data.areaInSqFt),
          areaInAcres: data.areaInAcres
            ? parseFloat(data.areaInAcres)
            : undefined,
          gpsCoordinates: gpsCoordinates,
          ownerName: data.ownerName,
          ownerWalletAddress: data.ownerWalletAddress,
          ownerContactEmail: data.ownerContactEmail || "",
          ownerContactPhone: data.ownerContactPhone || "",
          isEncumbered: data.isEncumbered,
          encumbranceDetails: data.encumbranceDetails || "",
          propertyType: data.propertyType,
          currentUse: data.currentUse || "",
          documents: {
            saleDeedCid: saleDeed.cid,
            saleDeedUrl: saleDeed.url,
            surveyMapCid: surveyMap.cid,
            surveyMapUrl: surveyMap.url,
            identityProofCid: identityProof.cid,
            identityProofUrl: identityProof.url,
            encumbranceCertificateCid: encumbranceCert?.cid,
            encumbranceCertificateUrl: encumbranceCert?.url,
            taxReceiptCid: taxReceipt?.cid,
            taxReceiptUrl: taxReceipt?.url,
            sitePhotosCids: sitePhotos.map((p) => p.cid),
            sitePhotosUrls: sitePhotos.map((p) => p.url),
          },
          metadataJsonCid: metadataUpload.cid,
          metadataJsonUrl: metadataUpload.url,
        };
        
        console.log("Sending property data to Convex:", propertyData);
        const savedPropertyId = await registerProperty(propertyData);
        console.log("Property saved to Convex with ID:", savedPropertyId);
      } else {
        console.log("Convex not available, property data:", metadata);
      }

      console.log("Property registered successfully!");
      setMessage({
        type: "success",
        text: `Property registered successfully! Metadata CID: ${metadataUpload.cid}. Pending admin approval.`,
      });

      // Reset form
      form.reset();
      setSaleDeed(null);
      setSurveyMap(null);
      setIdentityProof(null);
      setEncumbranceCert(null);
      setTaxReceipt(null);
      setSitePhotos([]);
    } catch (error) {
      console.error("Registration error:", error);
      setMessage({
        type: "error",
        text: `Failed to register property: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const requiredDocsUploaded = saleDeed && surveyMap && identityProof;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Property Registration</CardTitle>
        <CardDescription>
          Register your property with complete documentation on IPFS. After registration, your property will be pending admin approval.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Property Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Property Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="propertyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property ID *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., PROP-2024-001" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="surveyNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Survey Number *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., 123/4A" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>District *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Mumbai" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Maharashtra" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., India" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="areaInSqFt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Area (sq. ft.) *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="e.g., 2400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="areaInAcres"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Area (acres)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="e.g., 0.5"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., 19.0760" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., 72.8777" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="propertyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Type *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select property type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="residential">
                            Residential
                          </SelectItem>
                          <SelectItem value="commercial">Commercial</SelectItem>
                          <SelectItem value="agricultural">
                            Agricultural
                          </SelectItem>
                          <SelectItem value="industrial">Industrial</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currentUse"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Use</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Vacant, Rented" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Owner Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Owner Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ownerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Full legal name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ownerWalletAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wallet Address *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="0x..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ownerContactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="owner@example.com"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ownerContactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+91 9876543210" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Encumbrance Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Encumbrance Status</h3>

              <FormField
                control={form.control}
                name="isEncumbered"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Property has encumbrances</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {form.watch("isEncumbered") && (
                <FormField
                  control={form.control}
                  name="encumbranceDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Encumbrance Details</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe the encumbrances (mortgages, liens, etc.)"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Document Upload Section */}
            <div className="space-y-6">
              <div className="border-b pb-2">
                <h3 className="text-xl font-semibold text-gray-900">Document Upload</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Upload documents to IPFS. Drag and drop or click to browse. Files marked with * are required.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sale Deed */}
                <FileUploadZone
                  label="Sale Deed / Title Document"
                  required
                  file={saleDeed}
                  uploading={uploadingSaleDeed}
                  onChange={handleSaleDeedUpload}
                />

                {/* Survey Map */}
                <FileUploadZone
                  label="Survey Map / Plot Plan"
                  required
                  file={surveyMap}
                  uploading={uploadingSurveyMap}
                  onChange={handleSurveyMapUpload}
                />

                {/* Identity Proof */}
                <FileUploadZone
                  label="Identity Proof (Aadhaar/PAN/Passport)"
                  required
                  file={identityProof}
                  uploading={uploadingIdentity}
                  onChange={handleIdentityUpload}
                />

                {/* Encumbrance Certificate */}
                <FileUploadZone
                  label="Encumbrance Certificate"
                  file={encumbranceCert}
                  uploading={uploadingEncumbrance}
                  onChange={handleEncumbranceUpload}
                />

                {/* Tax Receipt */}
                <FileUploadZone
                  label="Tax Receipt"
                  file={taxReceipt}
                  uploading={uploadingTax}
                  onChange={handleTaxReceiptUpload}
                />

                {/* Site Photos */}
                <FileUploadZone
                  label="Site Photos (Multiple files allowed)"
                  file={sitePhotos}
                  uploading={uploadingPhotos}
                  onChange={handleSitePhotosUpload}
                  accept=".jpg,.jpeg,.png"
                  multiple
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submitting || !requiredDocsUploaded}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Registering Property...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-5 w-5" />
                  Register Property
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
