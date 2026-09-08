# Land Registry - Property Document Upload Setup

This document explains the new property registration system with document uploads to IPFS via Pinata and metadata storage in Convex.

## 🎯 What Was Implemented

### 1. **Convex Database Schema** (`convex/schema.ts`)
- Comprehensive property data model with:
  - Property identification (ID, survey number, location)
  - Owner information (name, wallet address, contact)
  - Document CIDs and URLs for all uploaded files
  - Legal status and verification tracking
  - History log of all property actions
  - Blockchain transaction tracking (for future implementation)

### 2. **Convex Mutations & Queries** (`convex/properties.ts`)
- `registerProperty`: Save complete property metadata to database
- `getPropertyById`: Fetch property by unique ID
- `getPropertyBySurveyNumber`: Find property by survey number
- `getPropertiesByOwner`: List all properties owned by a wallet address
- `getAllProperties`: Get all registered properties
- `updateVerificationStatus`: Admin function to verify properties
- `updateBlockchainStatus`: Update blockchain transaction status

### 3. **Property Registration Form** (`src/components/PropertyRegistrationForm.tsx`)
Comprehensive form with sections for:

#### Property Information
- Property ID, Survey Number
- District, State, Country
- Area (sq ft and acres)
- GPS Coordinates

#### Owner Information
- Owner Name
- Wallet Address (links to blockchain identity)
- Contact Email & Phone

#### Document Uploads (with IPFS storage)
- **Sale Deed/Title Deed** (Required) - PDF/Image
- **Survey Map/Cadastral Map** (Required) - PDF/Image
- **Encumbrance Certificate** - PDF/Image
- **Tax Receipt** - PDF/Image
- **Notarized Identity Proof** (Required) - PDF/Image
- **Site Photographs** - Multiple images

#### Legal Status
- Encumbrance checkbox
- Encumbrance details textarea

### 4. **Upload Flow**
1. User fills property details
2. Uploads documents → Each file goes to Pinata → Returns CID
3. Form displays upload status for each document
4. On submit:
   - Generates metadata JSON with all property info and document CIDs
   - Uploads metadata JSON to Pinata → Gets metadata CID
   - Saves everything to Convex database
5. Property is registered with "pending" verification status

### 5. **Metadata JSON Structure**
```json
{
  "property_id": "LAND-TX-9920",
  "legal_details": {
    "survey_number": "102/B",
    "district": "Central Region",
    "state": "Texas",
    "country": "USA",
    "area": "2400 sq ft",
    "area_acres": "0.055 acres"
  },
  "location": {
    "gps_coordinates": {
      "latitude": 30.2672,
      "longitude": -97.7431
    }
  },
  "owner": {
    "name": "John Doe",
    "wallet_address": "0x...",
    "contact_email": "owner@example.com",
    "contact_phone": "+1 234 567 8900"
  },
  "files": {
    "deed_url": "ipfs://QmYourDeedHash...",
    "map_url": "ipfs://QmYourMapHash...",
    "encumbrance_certificate_url": "ipfs://QmCertHash...",
    "tax_receipt_url": "ipfs://QmTaxHash...",
    "identity_proof_url": "ipfs://QmIdHash...",
    "site_photos_urls": ["ipfs://QmPhoto1...", "ipfs://QmPhoto2..."]
  },
  "property_details": {
    "type": "residential",
    "current_use": "Vacant land",
    "is_encumbered": false
  },
  "history": [
    {
      "action": "Registration",
      "date": "2026-01-24",
      "by": "0x..."
    }
  ]
}
```

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Pinata
1. Go to [Pinata](https://pinata.cloud) and create an account
2. Get your **Pinata JWT** from API Keys section
3. Get your **Gateway URL** (looks like `yourname.mypinata.cloud`)

### 3. Setup Convex
```bash
npx convex dev
```
This will:
- Create a Convex project (if first time)
- Generate the API files in `convex/_generated/`
- Give you a `NEXT_PUBLIC_CONVEX_URL`

### 4. Environment Variables
Create `.env.local` file in the root directory:
```env
# Pinata Configuration
PINATA_JWT=your_pinata_jwt_token_here
NEXT_PUBLIC_GATEWAY_URL=yourname.mypinata.cloud

# Convex Configuration
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

### 5. Run Development Server
```bash
# Terminal 1: Run Convex
npx convex dev

# Terminal 2: Run Next.js
npm run dev
```

### 6. Access the Form
1. Open http://localhost:3000
2. Connect your MetaMask wallet
3. Click "📄 Register Property Documents" button
4. Fill in the form and upload documents
5. Submit to register property

## 📊 How It Solves the Problems

### 1. **Forgery Prevention**
- **Document Immutability**: All documents stored on IPFS (cannot be altered)
- **CID Verification**: Each document has a unique CID that acts as a cryptographic fingerprint
- **GPS Coordinates**: Hardcoded location prevents fake land claims
- **Identity Proof**: Links wallet address to real-world identity

### 2. **Data Fragmentation**
- **Unified Schema**: All property data in one place (Convex)
- **Unique Survey Number**: Prevents duplicate registrations
- **Property ID**: Global unique identifier
- **Metadata JSON**: Complete digital twin stored on IPFS

### 3. **Trust Issues**
- **Blockchain Wallet**: Owner = Wallet Address (no central authority)
- **Decentralized Storage**: IPFS ensures no single point of failure
- **Verification History**: Complete audit trail of all actions
- **Transparent**: Anyone can verify document CIDs on IPFS

## 🔄 Next Steps (Blockchain Integration)

The system is ready for blockchain integration:

1. **Take the Metadata CID** from Convex
2. **Call Smart Contract** `registerLand()` with:
   - Survey Number
   - Owner Wallet Address
   - Metadata CID (as tokenURI)
   - GPS Coordinates
3. **Update Convex** with blockchain transaction hash
4. **Property becomes immutable** on blockchain

## 🎨 UI Features

- Real-time upload progress
- CID display for each uploaded document
- Form validation (required fields)
- Success/Error notifications
- Disabled submit until required docs uploaded
- Responsive design

## 📁 File Structure

```
land-trust/
├── convex/
│   ├── schema.ts          # Database schema
│   ├── properties.ts      # Mutations and queries
│   └── _generated/        # Auto-generated API files
├── src/
│   ├── app/
│   │   ├── api/files/
│   │   │   └── route.ts   # Pinata upload endpoint
│   │   ├── layout.tsx     # Added ConvexProvider
│   │   └── page.tsx       # Main page with form toggle
│   ├── components/
│   │   ├── PropertyRegistrationForm.tsx  # Main form
│   │   └── ConvexProvider.tsx            # Convex client
│   └── utils/
│       └── config.ts      # Pinata configuration
└── .env.local             # Environment variables
```

## 🔍 Testing the System

1. **Upload a Test Document**:
   - Use any PDF or image file
   - Watch for CID in success message

2. **Verify on IPFS**:
   - Copy the CID
   - Visit `https://gateway.pinata.cloud/ipfs/{CID}`
   - Document should be accessible

3. **Check Convex Database**:
   - Go to Convex dashboard
   - View `properties` table
   - Verify all data is stored correctly

## 🛡️ Security Notes

- PINATA_JWT is secret - keep it server-side only
- Upload endpoint is in `/api/files/route.ts` (server-side)
- Convex handles authentication automatically
- Always validate file types before upload
- Consider adding file size limits

## 📝 Future Enhancements

- [ ] Admin dashboard for property verification
- [ ] Document preview before upload
- [ ] Bulk upload support
- [ ] Search and filter properties
- [ ] Transfer ownership functionality
- [ ] Smart contract integration
- [ ] QR code generation for property
- [ ] Export property report as PDF
