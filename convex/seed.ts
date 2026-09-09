import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Demo seed data - mirrors the Hardhat-seeded parcels so the dashboard,
// approvals and transfer flows have real records to work with.
// Run with: npx convex run seed:seed

const LANDS = [
  { surveyNumber: "UP/GB/NOI/2024/001", district: "Gautam Buddh Nagar", state: "Uttar Pradesh", location: "Plot 45, Sector 62, Noida", areaSqFt: 2250, propertyType: "residential", ownerName: "Aarav Sharma" },
  { surveyNumber: "KA/BLR/WF/2024/002", district: "Bangalore Urban", state: "Karnataka", location: "Survey No. 123, Whitefield, Bangalore", areaSqFt: 2400, propertyType: "commercial", ownerName: "Priya Nair" },
  { surveyNumber: "DL/SW/DWK/2024/003", district: "South West Delhi", state: "Delhi", location: "Khasra No. 456, Dwarka Sector 21, New Delhi", areaSqFt: 4500, propertyType: "residential", ownerName: "Rahul Verma" },
  { surveyNumber: "MH/MUM/AND/2024/004", district: "Mumbai Suburban", state: "Maharashtra", location: "RS No. 78, Andheri East, Mumbai", areaSqFt: 1200, propertyType: "commercial", ownerName: "Sneha Iyer" },
  { surveyNumber: "HR/GGN/DLF/2024/005", district: "Gurugram", state: "Haryana", location: "Plot 12, DLF Phase 5, Gurugram", areaSqFt: 3600, propertyType: "residential", ownerName: "Vikram Singh" },
  { surveyNumber: "KA/BLR/RN/2024/006", district: "Bangalore Urban", state: "Karnataka", location: "Survey No. 234, Rajaji Nagar, Bangalore", areaSqFt: 1800, propertyType: "residential", ownerName: "Anita Desai" },
  { surveyNumber: "TS/HYD/BH/2024/007", district: "Hyderabad", state: "Telangana", location: "Khasra No. 89, Banjara Hills, Hyderabad", areaSqFt: 3200, propertyType: "commercial", ownerName: "Karan Mehta" },
  { surveyNumber: "TN/CHE/VEL/2024/008", district: "Chennai", state: "Tamil Nadu", location: "RS No. 567, Velachery, Chennai", areaSqFt: 1500, propertyType: "residential", ownerName: "Deepa Rangan" },
  { surveyNumber: "WB/KOL/SL/2024/009", district: "North 24 Parganas", state: "West Bengal", location: "Plot 34, Salt Lake Sector V, Kolkata", areaSqFt: 2000, propertyType: "commercial", ownerName: "Arjun Basu" },
  { surveyNumber: "MH/PUN/KP/2024/010", district: "Pune", state: "Maharashtra", location: "Survey No. 890, Koregaon Park, Pune", areaSqFt: 3000, propertyType: "residential", ownerName: "Meera Joshi" },
  { surveyNumber: "RJ/JAI/VN/2024/011", district: "Jaipur", state: "Rajasthan", location: "Khasra No. 112, Vaishali Nagar, Jaipur", areaSqFt: 2700, propertyType: "residential", ownerName: "Nikhil Chauhan" },
  { surveyNumber: "GJ/AHM/SAT/2024/012", district: "Ahmedabad", state: "Gujarat", location: "RS No. 445, Satellite, Ahmedabad", areaSqFt: 2500, propertyType: "commercial", ownerName: "Pooja Patel" },
  { surveyNumber: "MH/PUN/AUN/2024/013", district: "Pune", state: "Maharashtra", location: "Plot 78, Aundh, Pune", areaSqFt: 1800, propertyType: "residential", ownerName: "Sahil Kulkarni" },
  { surveyNumber: "UP/LKO/GN/2024/014", district: "Lucknow", state: "Uttar Pradesh", location: "Survey No. 321, Gomti Nagar, Lucknow", areaSqFt: 3150, propertyType: "residential", ownerName: "Ishita Gupta" },
  { surveyNumber: "KA/BLR/EC/2024/015", district: "Bangalore Urban", state: "Karnataka", location: "Khasra No. 654, Electronic City, Bangalore", areaSqFt: 4000, propertyType: "residential", ownerName: "Rohan Rao" },
  { surveyNumber: "MH/MUM/POW/2024/016", district: "Mumbai Suburban", state: "Maharashtra", location: "RS No. 223, Powai, Mumbai", areaSqFt: 1600, propertyType: "commercial", ownerName: "Neha Sharma" },
  { surveyNumber: "HR/GGN/CC/2024/017", district: "Gurugram", state: "Haryana", location: "Plot 56, Cyber City, Gurugram", areaSqFt: 5000, propertyType: "commercial", ownerName: "Aditya Khanna" },
  { surveyNumber: "TS/HYD/MAD/2024/018", district: "Hyderabad", state: "Telangana", location: "Survey No. 789, Madhapur, Hyderabad", areaSqFt: 2800, propertyType: "residential", ownerName: "Shreya Reddy" },
  { surveyNumber: "KA/BLR/IND/2024/019", district: "Bangalore Urban", state: "Karnataka", location: "Khasra No. 998, Indiranagar, Bangalore", areaSqFt: 2200, propertyType: "residential", ownerName: "Tanvi Shetty" },
  { surveyNumber: "TN/CHE/OMR/2024/020", district: "Chennai", state: "Tamil Nadu", location: "RS No. 147, OMR, Chennai", areaSqFt: 3500, propertyType: "commercial", ownerName: "Vivek Kumar" },
];

// Hardhat demo accounts: #0 = Government (admin), #1-#5 = citizens
const CITIZEN_WALLETS = [
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
  "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
  "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
  "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
];
const GOVERNMENT = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

function short(surveyNumber: string) {
  return surveyNumber.replace(/[^A-Z0-9]/gi, "").slice(0, 8);
}

export const seed = mutation({
  args: { force: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    // Idempotent: skip if already seeded unless force=true
    const existing = await ctx.db.query("properties").collect();
    if (existing.length > 0 && !args.force) {
      return {
        skipped: true,
        message: `Already seeded (${existing.length} properties). Pass { force: true } to re-seed.`,
      };
    }
    if (args.force) {
      for (const p of existing) await ctx.db.delete(p._id);
      const txs = await ctx.db.query("transactions").collect();
      for (const t of txs) await ctx.db.delete(t._id);
    }

    const baseTime = Date.now() - 1000 * 60 * 60 * 24 * 3; // 3 days ago
    const propertyIds: string[] = [];

    for (let i = 0; i < LANDS.length; i++) {
      const land = LANDS[i];
      const status = i < 12 ? "verified" : i < 18 ? "pending" : "rejected";
      const owner = CITIZEN_WALLETS[i % CITIZEN_WALLETS.length];
      const created = baseTime + i * 3600_000;
      const verified = status === "verified";

      const id = await ctx.db.insert("properties", {
        propertyId: land.surveyNumber,
        surveyNumber: land.surveyNumber,
        district: land.district,
        state: land.state,
        country: "India",
        areaInSqFt: land.areaSqFt,
        areaInAcres: +(land.areaSqFt / 43560).toFixed(3),
        ownerName: land.ownerName,
        ownerWalletAddress: owner,
        ownerContactEmail: `${land.ownerName.split(" ")[0].toLowerCase()}@example.in`,
        ownerContactPhone: `+91 98${String(10000000 + i * 137913).slice(0, 8)}`,
        documents: {
          saleDeedCid: `bafySaleDeed${short(land.surveyNumber)}`,
          saleDeedUrl: `https://ipfs.io/ipfs/demo-sale-deed-${i + 1}.pdf`,
          surveyMapCid: `bafySurveyMap${short(land.surveyNumber)}`,
          surveyMapUrl: `https://ipfs.io/ipfs/demo-survey-map-${i + 1}.png`,
          encumbranceCertificateCid: `bafyEC${short(land.surveyNumber)}`,
          taxReceiptCid: `bafyTax${short(land.surveyNumber)}`,
        },
        isEncumbered: false,
        propertyType: land.propertyType,
        currentUse: land.propertyType === "commercial" ? "Retail" : "Residential",
        verificationStatus: status,
        verifiedBy: verified ? GOVERNMENT : undefined,
        verifiedAt: verified ? created + 3600_000 : undefined,
        blockchainTxHash: verified ? `0xDEMO_TX_${String(i + 1).padStart(3, "0")}` : undefined,
        blockchainStatus: verified ? "confirmed" : status === "rejected" ? "failed" : "pending",
        history: [
          {
            action: "Property Registered",
            date: new Date(created).toISOString(),
            performedBy: owner,
            details: `Property ${land.location} registered`,
          },
          ...(verified
            ? [
                {
                  action: "Verification Status Updated to verified",
                  date: new Date(created + 3600_000).toISOString(),
                  performedBy: GOVERNMENT,
                  details: "Property verification status changed to: verified",
                },
              ]
            : status === "rejected"
              ? [
                  {
                    action: "Verification Status Updated to rejected",
                    date: new Date(created + 7200_000).toISOString(),
                    performedBy: GOVERNMENT,
                    details: "Documents incomplete - resubmission requested",
                  },
                ]
              : []),
        ],
        metadataJsonCid: `bafyMeta${short(land.surveyNumber)}`,
        metadataJsonUrl: `https://ipfs.io/ipfs/demo-meta-${i + 1}.json`,
        createdAt: created,
        updatedAt: verified ? created + 3600_000 : created,
      });
      propertyIds.push(land.surveyNumber);
    }

    // Sample transfer transactions across the workflow stages
    const t = Date.now() - 1000 * 60 * 60 * 24 * 2; // 2 days ago
    const txConfigs = [
      { propIdx: 0, status: "SUBMITTED", agreedPrice: "2.5", sellerIdx: 0, buyerIdx: 4 },
      { propIdx: 2, status: "SUBMITTED", agreedPrice: "4.2", sellerIdx: 1, buyerIdx: 3 },
      { propIdx: 4, status: "LOCKED", agreedPrice: "8.5", sellerIdx: 2, buyerIdx: 0 },
      { propIdx: 7, status: "INITIATED", agreedPrice: "12.0", sellerIdx: 3, buyerIdx: 1 },
      { propIdx: 10, status: "APPROVED", agreedPrice: "6.8", sellerIdx: 4, buyerIdx: 2 },
    ] as const;

    for (let i = 0; i < txConfigs.length; i++) {
      const cfg = txConfigs[i];
      const created = t - 1000 * 60 * 60 * (24 - i * 2);
      const locked = cfg.status !== "INITIATED";
      const submitted = ["SUBMITTED", "APPROVED", "MINTED"].includes(cfg.status);

      await ctx.db.insert("transactions", {
        propertyId: propertyIds[cfg.propIdx],
        tokenId: String(cfg.propIdx + 1),
        sellerWallet: CITIZEN_WALLETS[cfg.sellerIdx],
        buyerWallet: CITIZEN_WALLETS[cfg.buyerIdx],
        agreedPrice: cfg.agreedPrice,
        status: cfg.status,
        documents: {
          saleDeedCid: `bafyTxDeed${String(i + 1).padStart(3, "0")}`,
          saleDeedUrl: `https://ipfs.io/ipfs/demo-tx-deed-${i + 1}.pdf`,
          encumbranceCertCid: `bafyTxEC${String(i + 1).padStart(3, "0")}`,
          encumbranceCertUrl: `https://ipfs.io/ipfs/demo-tx-ec-${i + 1}.pdf`,
          taxReceiptCid: `bafyTxTax${String(i + 1).padStart(3, "0")}`,
          taxReceiptUrl: `https://ipfs.io/ipfs/demo-tx-tax-${i + 1}.pdf`,
          buyerIdCid: `bafyTxBuyerID${String(i + 1).padStart(3, "0")}`,
          buyerIdUrl: `https://ipfs.io/ipfs/demo-tx-buyerid-${i + 1}.pdf`,
          sellerIdCid: `bafyTxSellerID${String(i + 1).padStart(3, "0")}`,
          sellerIdUrl: `https://ipfs.io/ipfs/demo-tx-sellerid-${i + 1}.pdf`,
        },
        escrowContractAddress: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
        lockTxHash: locked ? `0xDEMO_LOCK_TX_${String(i + 1).padStart(3, "0")}` : undefined,
        txHash: cfg.status === "APPROVED" ? `0xDEMO_FINAL_TX_${String(i + 1).padStart(3, "0")}` : undefined,
        submittedAt: submitted ? created + 3600_000 : undefined,
        approvedBy: cfg.status === "APPROVED" ? GOVERNMENT : undefined,
        approvedAt: cfg.status === "APPROVED" ? created + 7200_000 : undefined,
        adminComments: cfg.status === "SUBMITTED" ? "Awaiting document review" : undefined,
        createdAt: created,
        updatedAt: submitted ? created + 3600_000 : created,
      });
    }

    return {
      skipped: false,
      properties: LANDS.length,
      transactions: txConfigs.length,
      verified: 12,
      pending: 6,
      rejected: 2,
    };
  },
});
