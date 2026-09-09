"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { BrowserProvider, Contract } from "ethers";
import contractABI from "@/utils/contractABI.json";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  ExternalLink, 
  FileText, 
  MapPin, 
  Calendar,
  User,
  Hash,
  Link2,
  Image as ImageIcon,
  Loader2
} from "lucide-react";

import { NETWORKS, DEFAULT_NETWORK } from "@/utils/networkConfig";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;
const TARGET_NETWORK = NETWORKS[DEFAULT_NETWORK] ?? NETWORKS.sepolia;

interface TokenMetadata {
  name?: string;
  description?: string;
  image?: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  propertyDetails?: {
    propertyId?: string;
    surveyNumber?: string;
    location?: {
      district?: string;
      state?: string;
      country?: string;
      coordinates?: {
        latitude?: string;
        longitude?: string;
      };
    };
    area?: {
      sqFt?: number;
      acres?: number;
    };
    propertyType?: string;
    currentUse?: string;
  };
  ownerDetails?: {
    name?: string;
    walletAddress?: string;
    contactEmail?: string;
    contactPhone?: string;
  };
  encumbrance?: {
    isEncumbered?: boolean;
    details?: string;
  };
  documents?: {
    saleDeed?: {
      name?: string;
      ipfsCid?: string;
      ipfsUrl?: string;
    };
    surveyMap?: {
      name?: string;
      ipfsCid?: string;
      ipfsUrl?: string;
    };
    identityProof?: {
      name?: string;
      ipfsCid?: string;
      ipfsUrl?: string;
    };
    encumbranceCertificate?: {
      name?: string;
      ipfsCid?: string;
      ipfsUrl?: string;
    };
    taxReceipt?: {
      name?: string;
      ipfsCid?: string;
      ipfsUrl?: string;
    };
    sitePhotos?: Array<{
      name?: string;
      ipfsCid?: string;
      ipfsUrl?: string;
    }>;
  };
  registrationTimestamp?: string;
}

export default function TokenMetadataPage() {
  const params = useParams();
  const tokenId = params.tokenId as string;
  
  const [metadata, setMetadata] = useState<TokenMetadata | null>(null);
  const [tokenURI, setTokenURI] = useState<string>("");
  const [owner, setOwner] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTokenData();
  }, [tokenId]);

  const loadTokenData = async () => {
    if (!window.ethereum) {
      setError("Please install MetaMask to view token details");
      setIsLoading(false);
      return;
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(CONTRACT_ADDRESS, contractABI, provider);

      // Get token URI and owner
      const [uri, ownerAddress] = await Promise.all([
        contract.tokenURI(tokenId),
        contract.ownerOf(tokenId)
      ]);

      setTokenURI(uri);
      setOwner(ownerAddress);

      // Fetch metadata
      if (uri) {
        const ipfsUrl = uri.startsWith("ipfs://") 
          ? uri.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")
          : uri.startsWith("http")
          ? uri
          : `https://gateway.pinata.cloud/ipfs/${uri}`;

        const response = await fetch(ipfsUrl);
        if (response.ok) {
          const data = await response.json();
          setMetadata(data);
        } else {
          setError("Failed to fetch metadata from IPFS");
        }
      }
    } catch (err: any) {
      console.error("Error loading token data:", err);
      setError(err.message || "Failed to load token data");
    } finally {
      setIsLoading(false);
    }
  };

  const getImageUrl = (imageUri: string) => {
    if (!imageUri) return "";
    if (imageUri.startsWith("ipfs://")) {
      return imageUri.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
    }
    if (imageUri.startsWith("http")) {
      return imageUri;
    }
    return `https://gateway.pinata.cloud/ipfs/${imageUri}`;
  };

  const getMetadataUrl = () => {
    if (tokenURI.startsWith("ipfs://")) {
      return tokenURI.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
    }
    if (tokenURI.startsWith("http")) {
      return tokenURI;
    }
    return `https://gateway.pinata.cloud/ipfs/${tokenURI}`;
  };

  const getPropertyName = () => {
    if (metadata?.name) return metadata.name;
    if (metadata?.ownerDetails?.name) {
      return `${metadata.ownerDetails.name}'s Property`;
    }
    if (metadata?.propertyDetails?.propertyId) {
      return `Property #${metadata.propertyDetails.propertyId}`;
    }
    return `Land Property #${tokenId}`;
  };

  const getPropertyDescription = () => {
    if (metadata?.description) return metadata.description;
    const details = metadata?.propertyDetails;
    if (details) {
      const parts = [];
      if (details.propertyType) parts.push(details.propertyType.charAt(0).toUpperCase() + details.propertyType.slice(1));
      if (details.area?.sqFt) parts.push(`${details.area.sqFt} sq ft`);
      if (details.location?.district) parts.push(details.location.district);
      if (details.location?.state) parts.push(details.location.state);
      return parts.join(' • ');
    }
    return "Blockchain-registered land property";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-900 mx-auto mb-4" />
          <p className="text-slate-600">Loading token details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <nav className="bg-blue-900 text-white">
          <div className="container mx-auto px-6 py-4">
            <Link href="/properties">
              <Button variant="ghost" className="text-white hover:bg-blue-800">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Properties
              </Button>
            </Link>
          </div>
        </nav>
        <div className="container mx-auto px-6 py-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Error</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-blue-900 text-white border-b-4 border-blue-700">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Land Registry System</h1>
              <p className="text-blue-200 text-sm mt-1">Digital Property Records</p>
            </div>
            <Link href="/properties">
              <Button variant="ghost" className="text-white hover:bg-blue-800">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Properties
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Page Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-8 w-8 text-blue-900" />
            <h2 className="text-3xl font-bold text-slate-900">Property Record Details</h2>
          </div>
          <p className="text-slate-600">Official blockchain-verified land registry documentation</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Site Photos */}
            {metadata?.documents?.sitePhotos && metadata.documents.sitePhotos.length > 0 && (
              <Card className="overflow-hidden border-2">
                <div className="h-96 bg-gradient-to-br from-slate-200 to-slate-300 relative">
                  <img
                    src={metadata.documents.sitePhotos[0].ipfsUrl || getImageUrl(metadata.documents.sitePhotos[0].ipfsCid || "")}
                    alt={getPropertyName()}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              </Card>
            )}

            {/* Property Details */}
            {metadata?.propertyDetails && (
              <Card className="border-2">
                <CardHeader className="bg-slate-100 border-b-2">
                  <CardTitle className="text-xl text-slate-900">Property Information</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {metadata.propertyDetails.propertyId && (
                      <div>
                        <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Property ID</label>
                        <p className="text-lg font-medium mt-1">{metadata.propertyDetails.propertyId}</p>
                      </div>
                    )}
                    {metadata.propertyDetails.surveyNumber && (
                      <div>
                        <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Survey Number</label>
                        <p className="text-lg font-medium mt-1">{metadata.propertyDetails.surveyNumber}</p>
                      </div>
                    )}
                    {metadata.propertyDetails.propertyType && (
                      <div>
                        <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Property Type</label>
                        <p className="text-lg font-medium mt-1 capitalize">{metadata.propertyDetails.propertyType}</p>
                      </div>
                    )}
                    {metadata.propertyDetails.currentUse && (
                      <div>
                        <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Current Use</label>
                        <p className="text-lg font-medium mt-1">{metadata.propertyDetails.currentUse}</p>
                      </div>
                    )}
                    {metadata.propertyDetails.area && (
                      <>
                        {metadata.propertyDetails.area.sqFt !== undefined && (
                          <div>
                            <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Area (sq ft)</label>
                            <p className="text-lg font-medium mt-1">{metadata.propertyDetails.area.sqFt.toLocaleString()}</p>
                          </div>
                        )}
                        {metadata.propertyDetails.area.acres !== undefined && (
                          <div>
                            <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Area (acres)</label>
                            <p className="text-lg font-medium mt-1">{metadata.propertyDetails.area.acres.toLocaleString()}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Location Details */}
            {metadata?.propertyDetails?.location && (
              <Card className="border-2">
                <CardHeader className="bg-slate-100 border-b-2">
                  <CardTitle className="text-xl text-slate-900 flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {metadata.propertyDetails.location.district && (
                      <div>
                        <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">District</label>
                        <p className="text-lg font-medium mt-1">{metadata.propertyDetails.location.district}</p>
                      </div>
                    )}
                    {metadata.propertyDetails.location.state && (
                      <div>
                        <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">State</label>
                        <p className="text-lg font-medium mt-1">{metadata.propertyDetails.location.state}</p>
                      </div>
                    )}
                    {metadata.propertyDetails.location.country && (
                      <div>
                        <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Country</label>
                        <p className="text-lg font-medium mt-1">{metadata.propertyDetails.location.country}</p>
                      </div>
                    )}
                    {metadata.propertyDetails.location.coordinates && (
                      <>
                        {metadata.propertyDetails.location.coordinates.latitude && (
                          <div>
                            <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Latitude</label>
                            <p className="text-lg font-medium mt-1 font-mono">{metadata.propertyDetails.location.coordinates.latitude}</p>
                          </div>
                        )}
                        {metadata.propertyDetails.location.coordinates.longitude && (
                          <div>
                            <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Longitude</label>
                            <p className="text-lg font-medium mt-1 font-mono">{metadata.propertyDetails.location.coordinates.longitude}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Owner Details */}
            {metadata?.ownerDetails && (
              <Card className="border-2">
                <CardHeader className="bg-slate-100 border-b-2">
                  <CardTitle className="text-xl text-slate-900 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Owner Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {metadata.ownerDetails.name && (
                      <div>
                        <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Owner Name</label>
                        <p className="text-lg font-medium mt-1">{metadata.ownerDetails.name}</p>
                      </div>
                    )}
                    {metadata.ownerDetails.contactEmail && (
                      <div>
                        <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Email</label>
                        <p className="text-lg font-medium mt-1">{metadata.ownerDetails.contactEmail}</p>
                      </div>
                    )}
                    {metadata.ownerDetails.contactPhone && (
                      <div>
                        <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Phone</label>
                        <p className="text-lg font-medium mt-1">{metadata.ownerDetails.contactPhone}</p>
                      </div>
                    )}
                    {metadata.ownerDetails.walletAddress && (
                      <div className="md:col-span-2">
                        <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Registered Wallet</label>
                        <p className="text-sm font-mono mt-1 bg-slate-50 p-2 rounded border break-all">{metadata.ownerDetails.walletAddress}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Encumbrance Status */}
            {metadata?.encumbrance && (
              <Card className="border-2">
                <CardHeader className="bg-slate-100 border-b-2">
                  <CardTitle className="text-xl text-slate-900">Encumbrance Status</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge className={metadata.encumbrance.isEncumbered ? "bg-red-600" : "bg-green-600"}>
                      {metadata.encumbrance.isEncumbered ? "Encumbered" : "Clear"}
                    </Badge>
                  </div>
                  {metadata.encumbrance.details && (
                    <p className="text-slate-700">{metadata.encumbrance.details}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Documents */}
            {metadata?.documents && (
              <Card className="border-2">
                <CardHeader className="bg-slate-100 border-b-2">
                  <CardTitle className="text-xl text-slate-900 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Property Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  {metadata.documents.saleDeed && (
                    <a 
                      href={metadata.documents.saleDeed.ipfsUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-slate-50 border-2 rounded hover:bg-slate-100 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">Sale Deed</p>
                        <p className="text-sm text-slate-600">{metadata.documents.saleDeed.name}</p>
                      </div>
                      <ExternalLink className="h-5 w-5 text-blue-600" />
                    </a>
                  )}
                  {metadata.documents.surveyMap && (
                    <a 
                      href={metadata.documents.surveyMap.ipfsUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-slate-50 border-2 rounded hover:bg-slate-100 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">Survey Map</p>
                        <p className="text-sm text-slate-600">{metadata.documents.surveyMap.name}</p>
                      </div>
                      <ExternalLink className="h-5 w-5 text-blue-600" />
                    </a>
                  )}
                  {metadata.documents.identityProof && (
                    <a 
                      href={metadata.documents.identityProof.ipfsUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-slate-50 border-2 rounded hover:bg-slate-100 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">Identity Proof</p>
                        <p className="text-sm text-slate-600">{metadata.documents.identityProof.name}</p>
                      </div>
                      <ExternalLink className="h-5 w-5 text-blue-600" />
                    </a>
                  )}
                  {metadata.documents.encumbranceCertificate && (
                    <a 
                      href={metadata.documents.encumbranceCertificate.ipfsUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-slate-50 border-2 rounded hover:bg-slate-100 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">Encumbrance Certificate</p>
                        <p className="text-sm text-slate-600">{metadata.documents.encumbranceCertificate.name}</p>
                      </div>
                      <ExternalLink className="h-5 w-5 text-blue-600" />
                    </a>
                  )}
                  {metadata.documents.taxReceipt && (
                    <a 
                      href={metadata.documents.taxReceipt.ipfsUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-slate-50 border-2 rounded hover:bg-slate-100 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">Tax Receipt</p>
                        <p className="text-sm text-slate-600">{metadata.documents.taxReceipt.name}</p>
                      </div>
                      <ExternalLink className="h-5 w-5 text-blue-600" />
                    </a>
                  )}
                  {metadata.documents.sitePhotos && metadata.documents.sitePhotos.length > 0 && (
                    <div className="pt-2">
                      <p className="font-semibold text-slate-900 mb-3">Site Photos ({metadata.documents.sitePhotos.length})</p>
                      <div className="grid grid-cols-2 gap-3">
                        {metadata.documents.sitePhotos.map((photo, idx) => (
                          <a 
                            key={idx}
                            href={photo.ipfsUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 bg-slate-50 border-2 rounded hover:bg-slate-100 transition-colors"
                          >
                            <div className="truncate">
                              <p className="text-sm font-medium text-slate-900">Photo {idx + 1}</p>
                              <p className="text-xs text-slate-600 truncate">{photo.name}</p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-blue-600 ml-2 flex-shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Standard Attributes Fallback */}
            {metadata?.attributes && metadata.attributes.length > 0 && (
              <Card className="border-2">
                <CardHeader className="bg-slate-100 border-b-2">
                  <CardTitle className="text-xl text-slate-900">Additional Attributes</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {metadata.attributes.map((attr, idx) => (
                      <div key={idx} className="bg-white border-2 p-4 rounded">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          {attr.trait_type}
                        </label>
                        <p className="text-lg font-medium text-slate-900 mt-1">{attr.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            {/* Token Details */}
            <Card className="border-2">
              <CardHeader className="bg-slate-100 border-b-2">
                <CardTitle className="text-lg text-slate-900">Token Details</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    Token ID
                  </label>
                  <p className="text-lg font-mono font-bold text-slate-900 mt-1">#{tokenId}</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Current Owner
                  </label>
                  <p className="text-xs font-mono text-slate-700 mt-1 break-all bg-slate-50 p-2 rounded border">
                    {owner}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Contract Address
                  </label>
                  <p className="text-xs font-mono text-slate-700 mt-1 break-all bg-slate-50 p-2 rounded border">
                    {CONTRACT_ADDRESS}
                  </p>
                </div>

                {metadata?.registrationTimestamp && (
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Registration Date
                    </label>
                    <p className="text-sm text-slate-700 mt-1">
                      {new Date(metadata.registrationTimestamp).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="border-2">
              <CardHeader className="bg-slate-100 border-b-2">
                <CardTitle className="text-lg text-slate-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                {TARGET_NETWORK.blockExplorer && (
                <a
                  href={`${TARGET_NETWORK.blockExplorer}/token/${CONTRACT_ADDRESS}?a=${tokenId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="w-full justify-start border-2">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on Explorer
                  </Button>
                </a>
                )}

                {tokenURI && (
                  <a
                    href={getMetadataUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" className="w-full justify-start border-2">
                      <Link2 className="h-4 w-4 mr-2" />
                      View Raw Metadata
                    </Button>
                  </a>
                )}

                {metadata?.documents?.sitePhotos && metadata.documents.sitePhotos.length > 0 && (
                  <a
                    href={metadata.documents.sitePhotos[0].ipfsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" className="w-full justify-start border-2">
                      <ImageIcon className="h-4 w-4 mr-2" />
                      View Site Photos
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Verification Badge */}
            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 bg-green-600 rounded-full flex items-center justify-center">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-green-900">Verified Record</p>
                    <p className="text-xs text-green-700">Blockchain Authenticated</p>
                  </div>
                </div>
                <p className="text-sm text-green-700 mt-3">
                  This property record is cryptographically secured on the {TARGET_NETWORK.name} blockchain and cannot be altered or tampered with.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-100 border-t-2 mt-12">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center text-sm text-slate-600">
            <p className="font-semibold mb-2">Official Land Registry System</p>
            <p>Blockchain-verified property records on {TARGET_NETWORK.name}</p>
            <p className="mt-2 text-xs">© 2026 Digital Land Registry. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
