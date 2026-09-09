// Network configuration for Hardhat local and Sepolia testnet

export interface NetworkConfig {
  name: string;
  chainId: number;
  chainIdHex: string;
  rpcUrl: string;
  rpcUrls?: string[];
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  contractAddress: string;
}

export const NETWORKS: Record<string, NetworkConfig> = {
  hardhat: {
    name: "Hardhat Local",
    chainId: 31337,
    chainIdHex: "0x7A69",
    rpcUrl: "http://127.0.0.1:8545",
    blockExplorer: "",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    // Update this after deploying to Hardhat
    contractAddress:
      process.env.NEXT_PUBLIC_HARDHAT_CONTRACT_ADDRESS ||
      "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  },
  sepolia: {
    name: "Sepolia Testnet",
    chainId: 11155111,
    chainIdHex: "0xAA36A7",
    rpcUrl:
      process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ||
      "https://ethereum-sepolia-rpc.publicnode.com",
    // Alternative RPC URLs for better reliability
    rpcUrls: [
      process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
      "https://sepolia.drpc.org",
      "https://rpc.sepolia.org",
      "https://1rpc.io/sepolia"
    ],
    blockExplorer: "https://sepolia.etherscan.io",
    nativeCurrency: {
      name: "Sepolia Ether",
      symbol: "ETH",
      decimals: 18,
    },
    // Deployed Sepolia contract address
    contractAddress:
      process.env.NEXT_PUBLIC_SEPOLIA_CONTRACT_ADDRESS ||
      "0xA86c3b94d7986a186d8254Bc9a8c5B6eeB63351A",
  },
};

// Default network based on environment
export const DEFAULT_NETWORK =
  process.env.NEXT_PUBLIC_DEFAULT_NETWORK || "hardhat";

export function getNetworkConfig(
  networkName: string,
): NetworkConfig | undefined {
  return NETWORKS[networkName];
}

export function getNetworkByChainId(
  chainId: number,
): NetworkConfig | undefined {
  return Object.values(NETWORKS).find((network) => network.chainId === chainId);
}

export function isValidNetwork(chainId: number): boolean {
  return Object.values(NETWORKS).some((network) => network.chainId === chainId);
}

export function getContractAddress(chainId: number): string {
  const network = getNetworkByChainId(chainId);
  return network?.contractAddress || "";
}

// Check if running in production (Sepolia) or development (Hardhat)
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production" || DEFAULT_NETWORK === "sepolia";
}
