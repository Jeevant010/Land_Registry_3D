# Sepolia Network Connection Fix Guide

## Problem Fixed

The Sepolia network connection was not working properly due to:
1. Insufficient error handling in network switching
2. Missing user feedback during network operations
3. Limited RPC URL options for reliability

## Changes Made

### 1. Enhanced Network Switching (`src/app/page.tsx`)
- Added proper error handling for MetaMask installation check
- Added user notifications for all network operations
- Improved error messages for better user experience
- Added feedback for network addition and switching

### 2. Improved Network Configuration (`src/utils/networkConfig.ts`)
- Added multiple RPC URLs for better reliability
- Enhanced native currency name for clarity
- Added TypeScript support for multiple RPC URLs

### 3. Test Script (`test-sepolia-connection.js`)
- Created a standalone test to verify RPC connectivity
- Tests multiple RPC providers
- Provides detailed connection status

## How to Test Sepolia Connection

### Method 1: Using the Test Script
```bash
# Install ethers if not already installed
npm install ethers

# Run the test script
node test-sepolia-connection.js
```

### Method 2: Using the DApp
1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Connect to Sepolia:**
   - Open the DApp in your browser
   - Click the "🔗 Sepolia" button
   - MetaMask will prompt you to switch to Sepolia
   - If Sepolia is not in your MetaMask, it will be automatically added

3. **Verify Connection:**
   - Check the network banner at the top
   - Should show "🔗 Connected to Sepolia Testnet"
   - You should see success notifications

## Troubleshooting

### Issue: "Failed to add network to MetaMask"
**Solution:** 
- Ensure MetaMask is installed and unlocked
- Check your internet connection
- Try manually adding Sepolia to MetaMask:
  ```
  Network Name: Sepolia Testnet
  RPC URL: https://ethereum-sepolia-rpc.publicnode.com
  Chain ID: 11155111
  Currency Symbol: ETH
  Block Explorer URL: https://sepolia.etherscan.io
  ```

### Issue: "Contract not deployed on Sepolia"
**Solution:**
- Deploy the contract to Sepolia first:
  ```bash
  npx hardhat run scripts/deploy-network.ts --network sepolia
  ```
- Ensure you have Sepolia ETH in your wallet (get from faucet)
- Check the contract address in `.env.local`

### Issue: "Network error. Please check your connection"
**Solution:**
- Try the test script to check RPC connectivity
- Switch to a different RPC URL in `.env.local`:
  ```
  NEXT_PUBLIC_SEPOLIA_RPC_URL=https://sepolia.drpc.org
  ```
- Or try other RPC URLs:
  - `https://rpc.sepolia.org`
  - `https://1rpc.io/sepolia`

## Getting Sepolia ETH

To test transactions on Sepolia, you need test ETH:

1. **Official Sepolia Faucet:**
   - Visit: https://sepoliafaucet.com/
   - Connect your wallet
   - Request test ETH

2. **Alternative Faucets:**
   - https://sepolia-faucet.pk910.de/
   - https://faucet.quicknode.com/ethereum/sepolia

## Expected Behavior After Fix

1. **Network Switching:**
   - Click "🔗 Sepolia" button
   - MetaMask prompts to switch/add network
   - Success notification appears
   - Network banner shows "🔗 Connected to Sepolia Testnet"

2. **Contract Interaction:**
   - If contract is deployed: lands load normally
   - If contract not deployed: clear error message with instructions

3. **Error Handling:**
   - Clear notifications for all error scenarios
   - User-friendly messages instead of technical errors
   - Guidance on how to resolve issues

## Verification Checklist

- [ ] Test script runs successfully
- [ ] Can connect to Sepolia via DApp
- [ ] Network banner shows correct status
- [ ] MetaMask shows Sepolia network
- [ ] Can switch between Hardhat and Sepolia
- [ ] Error messages are clear and helpful

## Next Steps

1. **Test the connection** using the methods above
2. **Deploy contract to Sepolia** if needed
3. **Get Sepolia ETH** for testing transactions
4. **Test property registration** on Sepolia
5. **Verify land buying/selling** works on Sepolia

The Sepolia connection should now work reliably with proper error handling and user feedback!