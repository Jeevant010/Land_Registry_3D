# Environment Setup

Create a `.env.local` file in the project root with the following variables:

```env
# ============================================
# LandTrust Environment Configuration
# ============================================

## ============ PINATA CONFIGURATION ============
# Get your keys from https://app.pinata.cloud/developers/api-keys
NEXT_PUBLIC_GATEWAY_URL=your-gateway.mypinata.cloud
PINATA_API=your_api_key
PINATA_API_SECRET=your_api_secret
PINATA_JWT=your_jwt_token

## ============ NETWORK CONFIGURATION ============
# Set to "hardhat" for local development, "sepolia" for testnet
NEXT_PUBLIC_DEFAULT_NETWORK=hardhat

## ============ CONTRACT ADDRESSES ============
# These are AUTO-FILLED by deployment scripts
# Run: npm run deploy:local or npm run deploy:sepolia
NEXT_PUBLIC_HARDHAT_CONTRACT_ADDRESS=
NEXT_PUBLIC_SEPOLIA_CONTRACT_ADDRESS=

## ============ SEPOLIA CONFIGURATION ============
# RPC URL (use Alchemy, Infura, or public RPC)
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://rpc.sepolia.org
SEPOLIA_RPC_URL=https://rpc.sepolia.org

# Private Key for deploying contracts (DO NOT COMMIT!)
# Export from MetaMask: Account Details > Export Private Key
# Ensure account has Sepolia ETH from faucets
PRIVATE_KEY=

# Etherscan API Key (for contract verification)
ETHERSCAN_API_KEY=

## ============ CONVEX CONFIGURATION ============
# Optional - leave empty if not using Convex database
# NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

## Quick Start

1. Copy the template above to `.env.local`
2. Fill in your Pinata credentials
3. For local development:

   ```bash
   npm run node          # Start Hardhat node (in terminal 1)
   npm run deploy:local  # Deploy contract (auto-fills env)
   npm run seed:local    # Seed test data
   npm run dev           # Start frontend
   ```

4. For Sepolia testnet:
   - Add your `PRIVATE_KEY` (with Sepolia ETH)
   - Run `npm run deploy:sepolia` (auto-fills env)

## Notes

- Contract addresses are **automatically updated** when you run deployment scripts
- Never commit `.env.local` - it contains sensitive keys
- Convex is optional - the app works without it
