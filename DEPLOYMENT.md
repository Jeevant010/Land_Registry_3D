# LandTrust Deployment Guide

## Network Support

This project supports both **Hardhat Local Network** (for development) and **Sepolia Testnet** (for production testing).

---

## 🔧 Local Development (Hardhat)

### Prerequisites
- Node.js 18+
- MetaMask browser extension

### Quick Start

1. **Start Hardhat Node**
   ```bash
   npm run node
   ```
   Keep this terminal open!

2. **Deploy Contract (new terminal)**
   ```bash
   npm run deploy:local
   ```

3. **Seed with Test Data**
   ```bash
   npm run seed:local
   ```

4. **Start Frontend**
   ```bash
   npm run dev
   ```

5. **Configure MetaMask**
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency: `ETH`

6. **Import Test Accounts** (from Hardhat node output)
   - Account #0 (Owner): `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - Account #1 (Govt): `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`

---

## 🔗 Sepolia Testnet (Production Testing)

### Prerequisites
- Sepolia ETH (get from faucets below)
- Private key with Sepolia ETH
- (Optional) Alchemy/Infura API key for reliable RPC

### Sepolia Faucets
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia
- https://faucets.chain.link/sepolia

### Setup

1. **Copy environment template**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your keys**
   ```env
   SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
   PRIVATE_KEY=your_private_key_without_0x
   ETHERSCAN_API_KEY=your_etherscan_api_key
   ```

3. **Deploy to Sepolia**
   ```bash
   npm run deploy:sepolia
   ```

4. **Update `.env.local`**
   ```env
   NEXT_PUBLIC_SEPOLIA_CONTRACT_ADDRESS=<deployed_address>
   NEXT_PUBLIC_DEFAULT_NETWORK=sepolia
   ```

5. **Verify Contract (optional)**
   ```bash
   npm run verify:sepolia <contract_address>
   ```

### Collaborator Testing on Sepolia

For your collaborator to test:

1. Share the deployed contract address
2. They need Sepolia ETH in their wallet
3. Connect MetaMask to Sepolia network
4. Visit the frontend and click "🔗 Sepolia" button

---

## 📁 Contract Addresses

| Network | Contract Address | Government Official |
|---------|------------------|---------------------|
| Hardhat | `0x5FbDB2315678afecb367f032d93F642f64180aa3` | Account #1 |
| Sepolia | _Update after deployment_ | _Update after deployment_ |

---

## 🏛️ 3-Way Approval System

The smart contract requires approval from 3 parties:

1. **Buyer** - Initiates purchase with payment (locked in contract)
2. **Seller** - Approves to sell their land
3. **Government** - Verifies and approves the transaction

### Transaction Flow

```
Buyer calls initiatePurchase(landId) with ETH
         ↓
Seller calls sellerApprove(transactionId)
         ↓
Government calls governmentApprove(transactionId)
         ↓
Transaction auto-completes:
  - NFT transferred to buyer
  - ETH transferred to seller
  - Land marked as sold
```

### Rejection
- Seller or Government can call `rejectTransaction()` to cancel
- Buyer gets full refund

---

## 📦 NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Build for production |
| `npm run node` | Start Hardhat local blockchain |
| `npm run compile` | Compile smart contracts |
| `npm run deploy:local` | Deploy to Hardhat |
| `npm run deploy:sepolia` | Deploy to Sepolia |
| `npm run seed:local` | Seed local with 20 test lands |
| `npm run verify:sepolia` | Verify contract on Etherscan |

---

## 🔑 Environment Variables

### `.env` (Hardhat - DO NOT COMMIT)
```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/xxx
PRIVATE_KEY=your_private_key
ETHERSCAN_API_KEY=xxx
```

### `.env.local` (Frontend)
```env
NEXT_PUBLIC_DEFAULT_NETWORK=hardhat  # or "sepolia"
NEXT_PUBLIC_HARDHAT_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_SEPOLIA_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://rpc.sepolia.org
```

---

## 🔒 Security Notes

- **NEVER** commit `.env` file with private keys
- Test accounts from Hardhat are PUBLIC - don't use on mainnet
- Always verify contract addresses before transactions
- Use hardware wallet for mainnet deployments
