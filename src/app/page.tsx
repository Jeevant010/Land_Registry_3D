"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BrowserProvider, Contract } from "ethers";
import contractABI from "../utils/contractABI.json";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Home as HomeIcon,
  Building2, 
  TrendingUp, 
  Shield,
  Wallet, 
  ArrowRight,
  MapPin,
  Users,
  FileCheck,
  Sparkles,
  ChevronRight,
  CheckCircle2
} from "lucide-react";

import { NETWORKS, DEFAULT_NETWORK } from "@/utils/networkConfig";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xA86c3b94d7986a186d8254Bc9a8c5B6eeB63351A";
const TARGET_NETWORK = NETWORKS[DEFAULT_NETWORK] ?? NETWORKS.sepolia;
const TARGET_CHAIN_ID = TARGET_NETWORK.chainIdHex;

interface Property {
  id: string;
  title: string;
  location: string;
  price: string;
  status: "available" | "pending" | "sold";
  image: string;
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

export default function Home() {
  const [account, setAccount] = useState<string | null>(null);
  const [totalProperties, setTotalProperties] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  const featuredProperties: Property[] = [
    {
      id: "1",
      title: "Waterfront Estate",
      location: "Miami, Florida",
      price: "2.5",
      status: "available",
      image: "🏖️"
    },
    {
      id: "2",
      title: "Mountain Retreat",
      location: "Aspen, Colorado",
      price: "3.8",
      status: "available",
      image: "🏔️"
    },
    {
      id: "3",
      title: "Urban Penthouse",
      location: "New York, NY",
      price: "5.2",
      status: "pending",
      image: "🏙️"
    }
  ];

  const stats = [
    { icon: Building2, label: "Properties Listed", value: "1,247", color: "text-blue-600", bgColor: "bg-blue-50" },
    { icon: TrendingUp, label: "Total Volume", value: "$2.4B", color: "text-green-600", bgColor: "bg-green-50" },
    { icon: Users, label: "Active Users", value: "12,458", color: "text-purple-600", bgColor: "bg-purple-50" },
    { icon: FileCheck, label: "Verified Titles", value: "98.7%", color: "text-orange-600", bgColor: "bg-orange-50" }
  ];

  const features = [
    {
      icon: Shield,
      title: "Immutable Records",
      description: "All property records are stored on the blockchain, ensuring they can never be altered or tampered with.",
      color: "blue"
    },
    {
      icon: FileCheck,
      title: "Smart Contracts",
      description: "Automated verification and transfer of ownership through secure smart contracts on Ethereum.",
      color: "green"
    },
    {
      icon: MapPin,
      title: "Global Access",
      description: "Access and manage your properties from anywhere in the world, 24/7, with full transparency.",
      color: "purple"
    }
  ];

  useEffect(() => {
    checkIfWalletConnected();
    loadContractData();
    
    // Listen for network changes
    if (typeof window.ethereum !== "undefined") {
      const handleChainChanged = () => {
        window.location.reload();
      };
      
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          setAccount(null);
          setIsCorrectNetwork(false);
        } else {
          setAccount(accounts[0]);
        }
      };
      
      window.ethereum.on("chainChanged", handleChainChanged);
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      
      return () => {
        window.ethereum?.removeListener("chainChanged", handleChainChanged);
        window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      };
    }
  }, []);

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
    if (typeof window.ethereum === "undefined") return false;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: TARGET_CHAIN_ID }],
      });
      setIsCorrectNetwork(true);
      return true;
    } catch (error: any) {
      // If the target network is not added to MetaMask, add it
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
          return true;
        } catch (addError) {
          console.error(`Error adding ${TARGET_NETWORK.name} network:`, addError);
          return false;
        }
      }
      console.error(`Error switching to ${TARGET_NETWORK.name}:`, error);
      return false;
    }
  };

  const checkIfWalletConnected = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" }) as string[];
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          await checkNetwork();
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      alert("Please install MetaMask to use this feature!");
      return;
    }

    setIsLoading(true);
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts"
      }) as string[];
      
      // Check if on the target network
      const isTargetNetwork = await checkNetwork();
      if (!isTargetNetwork) {
        const switched = await switchToTargetNetwork();
        if (!switched) {
          alert(`Please switch to ${TARGET_NETWORK.name} to continue.`);
          setIsLoading(false);
          return;
        }
      }
      
      setAccount(accounts[0]);
    } catch (error) {
      console.error("Error connecting wallet:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadContractData = async () => {
    if (typeof window.ethereum === "undefined") return;
    
    try {
      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(CONTRACT_ADDRESS, contractABI, provider);
      
      // This contract is an ERC721 NFT contract, it doesn't have landCount
      // We'll just set a placeholder or check totalSupply if available
      try {
        const supply = await contract.totalSupply?.();
        if (supply !== undefined) {
          setTotalProperties(Number(supply));
        }
      } catch {
        // totalSupply might not exist, silently ignore
        console.log("Contract loaded, property count unavailable");
      }
    } catch (error) {
      console.error("Error loading contract data:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl">
              <HomeIcon className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              LandTrust
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/properties">
              <Button variant="ghost" className="hidden md:inline-flex">
                My Properties
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="ghost" className="hidden md:inline-flex">
                Register Property
              </Button>
            </Link>
            <Link href="/admin">
              <Button variant="ghost" className="hidden md:inline-flex">
                Dashboard
              </Button>
            </Link>
            
            {account ? (
              <div className="flex items-center gap-3">
                {isCorrectNetwork ? (
                  <Badge variant="outline" className="gap-2 bg-green-50 text-green-700 border-green-200">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    {TARGET_NETWORK.name}
                  </Badge>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={switchToTargetNetwork}
                    className="gap-2 bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100"
                  >
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    Switch to {TARGET_NETWORK.name}
                  </Button>
                )}
                <Button variant="outline" className="gap-2">
                  <Wallet className="h-4 w-4" />
                  {account.slice(0, 6)}...{account.slice(-4)}
                </Button>
              </div>
            ) : (
              <Button onClick={connectWallet} disabled={isLoading} className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                <Wallet className="h-4 w-4" />
                {isLoading ? "Connecting..." : "Connect Wallet"}
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 pt-12 pb-24">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 text-sm font-medium animate-pulse">
            <Sparkles className="h-4 w-4" />
            Blockchain-Powered Real Estate
          </div>
          
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-tight">
            <span className="bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
              Own Land with
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Total Transparency
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Secure, immutable property registration on the blockchain. Buy, sell, and manage real estate with confidence and complete transparency.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/register">
              <Button size="lg" className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg h-14 px-10 shadow-xl">
                Register Property
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/admin">
              <Button size="lg" variant="outline" className="text-lg h-14 px-10 border-2">
                Browse Properties
              </Button>
            </Link>
          </div>

          {/* Quick Benefits */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span>Blockchain Verified</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span>Instant Transactions</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span>No Intermediaries</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-24 bg-white/60 backdrop-blur-sm rounded-3xl">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-slate-900 mb-6">
            Why Choose LandTrust?
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Revolutionary blockchain technology meets real estate, creating a trustless and transparent ecosystem for everyone.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="border-2 hover:border-blue-300 transition-all hover:shadow-2xl hover:-translate-y-2 bg-white">
              <CardHeader className="pb-4">
                <div className={`h-16 w-16 bg-${feature.color}-100 rounded-2xl flex items-center justify-center mb-6`}>
                  <feature.icon className={`h-8 w-8 text-${feature.color}-600`} />
                </div>
                <CardTitle className="text-2xl mb-3">{feature.title}</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>


      {/* CTA Section */}
      <div className="container mx-auto px-6 py-24">
        <Card className="border-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]"></div>
          <CardContent className="p-16 text-center relative z-10">
            <h2 className="text-5xl font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl mb-10 text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Join thousands of users securing their real estate on the blockchain. Connect your wallet and start your journey towards transparent property ownership today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {!account ? (
                <Button 
                  size="lg" 
                  onClick={connectWallet}
                  disabled={isLoading}
                  className="gap-2 bg-white text-blue-600 hover:bg-blue-50 text-lg h-14 px-10 shadow-xl"
                >
                  <Wallet className="h-5 w-5" />
                  {isLoading ? "Connecting..." : "Connect Wallet Now"}
                </Button>
              ) : (
                <Link href="/register">
                  <Button size="lg" className="gap-2 bg-white text-blue-600 hover:bg-blue-50 text-lg h-14 px-10 shadow-xl">
                    Register Your Property
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              )}
            </div>
            {totalProperties > 0 && (
              <p className="text-blue-100 mt-6 text-sm">
                Join {totalProperties.toLocaleString()} properties already registered on the blockchain
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white/70 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl">
                  <HomeIcon className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">LandTrust</span>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                Revolutionizing real estate with blockchain technology. Transparent, secure, and accessible to everyone.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-slate-900">Platform</h3>
              <ul className="space-y-3 text-sm text-slate-600">
                <li><Link href="/register" className="hover:text-blue-600 transition-colors">Register Property</Link></li>
                <li><Link href="/admin" className="hover:text-blue-600 transition-colors">Browse Properties</Link></li>
                <li><Link href="/sandbox" className="hover:text-blue-600 transition-colors">Sandbox</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-slate-900">Resources</h3>
              <ul className="space-y-3 text-sm text-slate-600">
                <li><a href="#" className="hover:text-blue-600 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-slate-900">Smart Contract</h3>
              <p className="text-xs text-slate-600 break-all mb-3 font-mono bg-slate-100 p-2 rounded">
                {CONTRACT_ADDRESS}
              </p>
              {totalProperties > 0 && (
                <Badge className="bg-blue-100 text-blue-700">
                  {totalProperties} properties registered
                </Badge>
              )}
            </div>
          </div>
          
          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-600">
            <p>© 2026 LandTrust. All rights reserved. Built on Ethereum blockchain.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
