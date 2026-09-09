"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getUserLands, UserLand } from "@/utils/etherium";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Loader2, 
  Home, 
  ExternalLink, 
  MapPin, 
  Calendar,
  FileText,
  Wallet,
  ArrowLeft,
  RefreshCw,
  Building2,
  Shield,
  CheckCircle2
} from "lucide-react";

import { NETWORKS, DEFAULT_NETWORK } from "@/utils/networkConfig";

const TARGET_NETWORK = NETWORKS[DEFAULT_NETWORK] ?? NETWORKS.sepolia;
const TARGET_CHAIN_ID = TARGET_NETWORK.chainIdHex;

export default function PropertiesPage() {
  const [account, setAccount] = useState<string | null>(null);
  const [lands, setLands] = useState<UserLand[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" }) as string[];
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          await checkNetwork();
          await loadUserLands(accounts[0]);
        }
      } catch (error) {
        console.error("Error checking wallet:", error);
      }
    }
  };

  const checkNetwork = async () => {
    if (typeof window.ethereum === "undefined") return false;
    
    try {
      const chainId = await window.ethereum.request({ method: "eth_chainId" }) as string;
      const isCorrect = chainId === TARGET_CHAIN_ID;
      setIsCorrectNetwork(isCorrect);
      return isCorrect;
    } catch (error) {
      console.error("Error checking network:", error);
      return false;
    }
  };

  const switchToTargetNetwork = async () => {
    if (typeof window.ethereum === "undefined") return;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: TARGET_CHAIN_ID }],
      });
      setIsCorrectNetwork(true);
      if (account) {
        await loadUserLands(account);
      }
    } catch (error: any) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: TARGET_CHAIN_ID,
              chainName: TARGET_NETWORK.name,
              nativeCurrency: TARGET_NETWORK.nativeCurrency,
              rpcUrls: [TARGET_NETWORK.rpcUrl],
              ...(TARGET_NETWORK.blockExplorer
                ? { blockExplorerUrls: [TARGET_NETWORK.blockExplorer] }
                : {}),
            }],
          });
          setIsCorrectNetwork(true);
        } catch (addError) {
          console.error(`Error adding ${TARGET_NETWORK.name}:`, addError);
        }
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      alert("Please install MetaMask!");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts"
      }) as string[];
      
      const isTargetNetwork = await checkNetwork();
      if (!isTargetNetwork) {
        await switchToTargetNetwork();
      }
      
      setAccount(accounts[0]);
      await loadUserLands(accounts[0]);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setError("Failed to connect wallet");
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserLands = async (userAddress: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("Loading lands for:", userAddress);
      const userLands = await getUserLands(userAddress);
      setLands(userLands);
    } catch (error: any) {
      console.error("Error loading lands:", error);
      setError(error.message || "Failed to load your properties");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshLands = () => {
    if (account) {
      loadUserLands(account);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-blue-900 text-white border-b-4 border-blue-700 shadow-lg">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Land Registry System</h1>
              <p className="text-blue-200 text-sm mt-1">Digital Property Records</p>
            </div>
            
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" className="text-white hover:bg-blue-800">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
              
              {account && (
                <div className="flex items-center gap-3">
                  {isCorrectNetwork ? (
                    <Badge className="gap-2 bg-green-600 text-white border-0">
                      <CheckCircle2 className="h-3 w-3" />
                      {TARGET_NETWORK.name}
                    </Badge>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={switchToTargetNetwork}
                      className="gap-2 bg-yellow-100 text-yellow-900 border-yellow-300 hover:bg-yellow-200"
                    >
                      Switch Network
                    </Button>
                  )}
                  <Badge variant="secondary" className="font-mono px-3 py-2 bg-white text-slate-900">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!account ? (
          <Card className="max-w-2xl mx-auto border-2 shadow-lg">
            <CardHeader className="text-center bg-slate-100 border-b-2">
              <div className="mx-auto mb-4 w-20 h-20 bg-blue-900 rounded-full flex items-center justify-center">
                <Wallet className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-2xl text-slate-900">Wallet Authentication Required</CardTitle>
              <CardDescription className="text-base mt-2">
                Connect your MetaMask wallet to access your registered land properties on {TARGET_NETWORK.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <Button 
                onClick={connectWallet} 
                className="w-full h-12 bg-blue-900 hover:bg-blue-800 text-lg" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="h-5 w-5 mr-2" />
                    Connect Wallet
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="bg-white border-2 p-12 rounded-lg shadow-lg text-center">
              <Loader2 className="h-16 w-16 animate-spin text-blue-900 mb-6 mx-auto" />
              <p className="text-xl font-semibold text-slate-900">Loading Property Records</p>
              <p className="text-sm text-slate-600 mt-3">Querying blockchain registry...</p>
            </div>
          </div>
        ) : lands.length === 0 ? (
          <Card className="max-w-2xl mx-auto border-2 shadow-lg">
            <CardHeader className="text-center bg-slate-100 border-b-2">
              <div className="mx-auto mb-4 w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center">
                <Building2 className="h-10 w-10 text-slate-600" />
              </div>
              <CardTitle className="text-2xl text-slate-900">No Property Records Found</CardTitle>
              <CardDescription className="text-base mt-2">
                No land ownership records are associated with this wallet address. Register a new property to create a blockchain-verified record.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 text-center">
              <Link href="/register">
                <Button className="h-12 px-8 bg-blue-900 hover:bg-blue-800">
                  <FileText className="h-5 w-5 mr-2" />
                  Register New Property
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-white border-2 p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 bg-blue-900 rounded-lg flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">Registered Properties</h2>
                    <p className="text-slate-600 mt-1 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      {lands.length} {lands.length === 1 ? "property record" : "property records"} verified on blockchain
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={refreshLands} 
                  disabled={isLoading}
                  className="border-2 h-11 px-6"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                  Refresh Records
                </Button>
              </div>
            </div>

            {/* Property Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lands.map((land) => (
                <Card key={land.id} className="overflow-hidden border-2 hover:shadow-xl transition-all hover:border-blue-300">
                  {land.metadata?.image && (
                    <div className="h-48 bg-gradient-to-br from-slate-300 to-slate-400 relative">
                      {land.metadata.image.startsWith("ipfs://") ? (
                        <img
                          src={land.metadata.image.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")}
                          alt={land.metadata.name || `Land #${land.id}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl">
                          🏡
                        </div>
                      )}
                    </div>
                  )}

                  <CardHeader className="bg-slate-50 border-b-2">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className="bg-blue-900 text-white">ID: {land.id}</Badge>
                      {TARGET_NETWORK.blockExplorer && (
                        <a
                          href={`${TARGET_NETWORK.blockExplorer}/token/${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}?a=${land.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-900 hover:text-blue-700"
                          title="View on explorer"
                        >
                          <ExternalLink className="h-5 w-5" />
                        </a>
                      )}
                    </div>
                    
                    <CardTitle className="text-xl text-slate-900">
                      {land.metadata?.name || `Land Property #${land.id}`}
                    </CardTitle>
                    
                    {land.metadata?.description && (
                      <CardDescription className="line-clamp-2 mt-2 text-slate-700">
                        {land.metadata.description}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-4 p-6">
                    {land.metadata?.attributes && land.metadata.attributes.length > 0 && (
                      <div className="space-y-2">
                        {land.metadata.attributes.slice(0, 3).map((attr: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm bg-slate-50 p-2 rounded border">
                            <span className="text-slate-600 font-medium">{attr.trait_type}:</span>
                            <span className="font-semibold text-slate-900">{attr.value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-2">
                      <Link href={`/properties/${land.id}`}>
                        <Button variant="outline" className="w-full border-2 h-10">
                          <FileText className="h-4 w-4 mr-2" />
                          View Full Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
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
