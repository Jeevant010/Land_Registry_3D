import { ethers } from "ethers";
import contractABI from "@/utils/contractABI.json";
import { NETWORKS, DEFAULT_NETWORK } from "@/utils/networkConfig";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;
const ACTIVE_NETWORK = NETWORKS[DEFAULT_NETWORK] ?? NETWORKS.sepolia;
const RPC_URL = ACTIVE_NETWORK.rpcUrl;

export const getContract = async () => {
  if (!window.ethereum) throw new Error("No crypto wallet found");

  // 1. Initialize the Provider (Connects to MetaMask)
  const provider = new ethers.BrowserProvider(window.ethereum);

  // 2. Get the Signer (The user's account)
  const signer = await provider.getSigner();

  // 3. Create the Contract instance
  return new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
};

export interface UserLand {
  id: string;
  uri: string;
  metadata?: {
    name?: string;
    description?: string;
    image?: string;
    attributes?: any[];
  };
}

/**
 * Get all NFT lands owned by a specific user address
 * This queries Transfer events and verifies current ownership
 */
export const getUserLands = async (userAddress: string): Promise<UserLand[]> => {
  if (!CONTRACT_ADDRESS) {
    throw new Error("Contract address not configured");
  }

  // 1. Setup Provider & Contract (read-only)
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);

  console.log("🔍 Searching for lands owned by:", userAddress);

  try {
    // Get current block number
    const currentBlock = await provider.getBlockNumber();
    console.log(`Current block: ${currentBlock}`);
    
    // Query from last 5000 blocks to avoid RPC limits (free tier usually allows 10k)
    // If your contract was deployed recently, this should catch all events
    // Adjust this number based on your deployment
    const fromBlock = Math.max(0, currentBlock - 5000);
    
    console.log(`📜 Querying Transfer events from block ${fromBlock} to latest...`);

    // 2. Create a Filter for Transfer events where 'to' is the user
    // Transfer event signature: Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
    const filter = contract.filters.Transfer(null, userAddress);

    // 3. Query the logs in chunks if needed
    let logs: any[] = [];
    
    try {
      // Try to get all at once first
      logs = await contract.queryFilter(filter, fromBlock, "latest");
    } catch (error: any) {
      // If it fails due to range limit, query in smaller chunks
      console.log("⚠️ Range too large, querying in chunks...");
      const chunkSize = 2000; // 2000 blocks per chunk
      
      for (let startBlock = fromBlock; startBlock <= currentBlock; startBlock += chunkSize) {
        const endBlock = Math.min(startBlock + chunkSize - 1, currentBlock);
        console.log(`Querying blocks ${startBlock} to ${endBlock}`);
        
        const chunkLogs = await contract.queryFilter(filter, startBlock, endBlock);
        logs = logs.concat(chunkLogs);
      }
    }
    
    console.log(`Found ${logs.length} transfer events to this address`);

    // 4. Extract Token IDs (use Set to avoid duplicates)
    const tokenIds = new Set<string>();
    for (const log of logs) {
      try {
        // Parse the log using the contract interface
        const parsedLog = contract.interface.parseLog({
          topics: log.topics as string[],
          data: log.data
        });
        
        if (parsedLog && parsedLog.args) {
          // Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
          // Access by index: args[0]=from, args[1]=to, args[2]=tokenId
          // Or by name: args.tokenId
          const tokenId = (parsedLog.args[2] || parsedLog.args.tokenId)?.toString();
          
          if (tokenId) {
            tokenIds.add(tokenId);
            console.log(`✓ Found token ID: ${tokenId}`);
          } else {
            console.warn("Could not extract tokenId from args:", parsedLog.args);
          }
        }
      } catch (parseError) {
        console.error("Error parsing log:", parseError);
      }
    }

    console.log(`Checking ownership of ${tokenIds.size} unique tokens...`);

    // 5. Verify Current Ownership (important - they might have transferred it)
    const ownedLands: UserLand[] = [];
    for (const id of tokenIds) {
      try {
        const currentOwner = await contract.ownerOf(id);
        if (currentOwner.toLowerCase() === userAddress.toLowerCase()) {
          // Still owns it!
          const uri = await contract.tokenURI(id);
          
          // Try to fetch metadata if it's an IPFS URI
          let metadata;
          if (uri) {
            try {
              const ipfsUrl = uri.startsWith("ipfs://") 
                ? uri.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")
                : uri;
              const response = await fetch(ipfsUrl);
              if (response.ok) {
                metadata = await response.json();
              }
            } catch (metadataError) {
              console.warn(`Failed to fetch metadata for token ${id}:`, metadataError);
            }
          }
          
          ownedLands.push({ id, uri, metadata });
        }
      } catch (error) {
        console.warn(`Error checking token ${id}:`, error);
      }
    }

    console.log(`✅ User owns ${ownedLands.length} land NFTs`);
    return ownedLands;
  } catch (error) {
    console.error("Error fetching user lands:", error);
    throw error;
  }
};
