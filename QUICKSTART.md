# Quick Start Guide - Property Registration System

## ⚡ Quick Setup (5 minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Initialize Convex
```bash
npx convex dev
```

When prompted:
1. Press Enter to create a new project
2. Copy the `NEXT_PUBLIC_CONVEX_URL` it gives you
3. Keep this terminal running

### Step 3: Setup Environment Variables

Create `.env.local` in the root directory:

```env
# Pinata (Get from https://pinata.cloud)
PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_GATEWAY_URL=gateway.pinata.cloud

# Convex (From step 2)
NEXT_PUBLIC_CONVEX_URL=https://happy-animal-123.convex.cloud
```

**Don't have Pinata credentials yet?**
1. Go to https://app.pinata.cloud
2. Sign up (free)
3. Go to "API Keys" → Create New Key
4. Copy the JWT token
5. Go to "Gateways" to get your gateway URL

### Step 4: Run Development Server

Open a NEW terminal (keep Convex running):

```bash
npm run dev
```

### Step 5: Use the Form

1. Open http://localhost:3000
2. Click "Connect Wallet"
3. Click "📄 Register Property Documents"
4. Fill the form and upload documents
5. Submit!

## ✅ Verification

### Check Convex Database
1. Go to https://dashboard.convex.dev
2. Click on your project
3. Go to "Data" tab
4. See the `properties` table with your data

### Check IPFS Files
Take any CID from the form and visit:
```
https://gateway.pinata.cloud/ipfs/{YOUR_CID}
```

## 🐛 Troubleshooting

### "Module not found: Can't resolve '../../convex/_generated/api'"
**Fix**: Run `npx convex dev` - it generates the API files

### "Failed to upload file to Pinata"
**Fix**: Check your `PINATA_JWT` in `.env.local`

### "Cannot read properties of undefined"
**Fix**: Make sure `NEXT_PUBLIC_CONVEX_URL` is set and Convex dev server is running

### Form won't load
**Fix**: 
1. Make sure both terminals are running (Convex + Next.js)
2. Refresh the page
3. Check browser console for errors

## 📂 What Gets Created

When you register a property, you'll see:

1. **In Convex Database**: Complete property record
2. **On IPFS**: 
   - All uploaded documents (PDF/images)
   - Metadata JSON file
3. **On Screen**: Success message with metadata CID

## 🎯 Next: Blockchain Integration

After testing the form, you can integrate with blockchain:

1. Use the `metadataJsonCid` from Convex
2. Call your smart contract's `registerLand()` function
3. Pass the metadata CID as `tokenURI`
4. Update Convex with blockchain TX hash using `updateBlockchainStatus` mutation

See `PROPERTY_REGISTRATION_SETUP.md` for detailed documentation.
