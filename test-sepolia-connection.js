// Test script to verify Sepolia network connection
// Run with: node test-sepolia-connection.js

const { ethers } = require("ethers");

async function testSepoliaConnection() {
  console.log("Testing Sepolia network connection...");
  
  // Test RPC URLs
  const rpcUrls = [
    "https://ethereum-sepolia-rpc.publicnode.com",
    "https://sepolia.drpc.org",
    "https://rpc.sepolia.org",
    "https://1rpc.io/sepolia"
  ];

  for (const rpcUrl of rpcUrls) {
    try {
      console.log(`\nTesting RPC: ${rpcUrl}`);
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      
      // Test connection by getting network info
      const network = await provider.getNetwork();
      console.log(`✅ Connected to ${network.name} (chainId: ${network.chainId})`);
      
      // Test getting latest block
      const blockNumber = await provider.getBlockNumber();
      console.log(`✅ Latest block: ${blockNumber}`);
      
      // Test getting balance of a known address
      const testAddress = "0x0000000000000000000000000000000000000000";
      const balance = await provider.getBalance(testAddress);
      console.log(`✅ Test address balance: ${ethers.formatEther(balance)} ETH`);
      
      console.log(`✅ RPC ${rpcUrl} is working!`);
      return true;
      
    } catch (error) {
      console.log(`❌ RPC ${rpcUrl} failed:`, error.message);
    }
  }
  
  console.log("\n❌ All RPC URLs failed. Please check your internet connection or try different RPC URLs.");
  return false;
}

// Run the test
testSepoliaConnection().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error("Test failed:", error);
  process.exit(1);
});