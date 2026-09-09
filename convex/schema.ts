import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ==================== TRANSACTIONS TABLE ====================
  // For property transfer approval workflow
  transactions: defineTable({
    // Property & Party Information
    propertyId: v.string(),
    tokenId: v.optional(v.string()), // NFT token ID from blockchain
    sellerWallet: v.string(),
    buyerWallet: v.string(),
    agreedPrice: v.string(), // Price in ETH as string

    // Status: INITIATED -> LOCKED -> SUBMITTED -> APPROVED/REJECTED -> MINTED/REFUNDED
    status: v.string(),

    // The "Approval Packet" - Documents from Pinata/IPFS
    documents: v.object({
      // Sale Deed (The signed contract)
      saleDeedCid: v.optional(v.string()),
      saleDeedUrl: v.optional(v.string()),

      // Encumbrance Certificate (EC - Proof of no loans/legal issues)
      encumbranceCertCid: v.optional(v.string()),
      encumbranceCertUrl: v.optional(v.string()),

      // Tax Receipt (Proof property tax is paid)
      taxReceiptCid: v.optional(v.string()),
      taxReceiptUrl: v.optional(v.string()),

      // Buyer Identity Proof (KYC - Aadhaar/PAN)
      buyerIdCid: v.optional(v.string()),
      buyerIdUrl: v.optional(v.string()),

      // Seller Identity Proof
      sellerIdCid: v.optional(v.string()),
      sellerIdUrl: v.optional(v.string()),

      // NOC - No Objection Certificate (from society/authority)
      nocCid: v.optional(v.string()),
      nocUrl: v.optional(v.string()),

      // Affidavit (Voluntary sale declaration)
      affidavitCid: v.optional(v.string()),
      affidavitUrl: v.optional(v.string()),
    }),

    // Blockchain Data
    escrowContractAddress: v.string(),
    lockTxHash: v.optional(v.string()), // When funds were locked
    txHash: v.optional(v.string()), // Final mint/transfer hash
    refundTxHash: v.optional(v.string()), // If rejected

    // Admin Decision Fields
    adminComments: v.optional(v.string()),
    approvedBy: v.optional(v.string()),
    approvedAt: v.optional(v.number()),
    rejectedBy: v.optional(v.string()),
    rejectedAt: v.optional(v.number()),
    rejectionReason: v.optional(v.string()),
    submittedAt: v.optional(v.number()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_property_id", ["propertyId"])
    .index("by_buyer", ["buyerWallet"])
    .index("by_seller", ["sellerWallet"]),

  // ==================== PROPERTIES TABLE ====================
  properties: defineTable({
    // Property Identification
    propertyId: v.string(),
    surveyNumber: v.string(),
    district: v.string(),
    state: v.optional(v.string()),
    country: v.optional(v.string()),

    // Area and Location
    areaInSqFt: v.number(),
    areaInAcres: v.optional(v.number()),
    gpsCoordinates: v.optional(
      v.object({
        latitude: v.number(),
        longitude: v.number(),
      }),
    ),

    // Owner Information
    ownerName: v.string(),
    ownerWalletAddress: v.string(),
    ownerContactEmail: v.optional(v.string()),
    ownerContactPhone: v.optional(v.string()),

    // Document CIDs from Pinata/IPFS
    documents: v.object({
      saleDeedCid: v.optional(v.string()),
      saleDeedUrl: v.optional(v.string()),

      surveyMapCid: v.optional(v.string()),
      surveyMapUrl: v.optional(v.string()),

      encumbranceCertificateCid: v.optional(v.string()),
      encumbranceCertificateUrl: v.optional(v.string()),

      taxReceiptCid: v.optional(v.string()),
      taxReceiptUrl: v.optional(v.string()),

      identityProofCid: v.optional(v.string()),
      identityProofUrl: v.optional(v.string()),

      sitePhotosCids: v.optional(v.array(v.string())),
      sitePhotosUrls: v.optional(v.array(v.string())),
    }),

    // Legal Status
    isEncumbered: v.boolean(),
    encumbranceDetails: v.optional(v.string()),

    // Property Details
    propertyType: v.optional(v.string()), // "residential", "commercial", "agricultural"
    currentUse: v.optional(v.string()),

    // Verification Status
    verificationStatus: v.string(), // "pending", "verified", "rejected"
    verifiedBy: v.optional(v.string()),
    verifiedAt: v.optional(v.number()),

    // Blockchain Status (for future implementation)
    blockchainTxHash: v.optional(v.string()),
    blockchainStatus: v.optional(v.string()), // "pending", "confirmed", "failed"

    // History tracking
    history: v.array(
      v.object({
        action: v.string(),
        date: v.string(),
        performedBy: v.string(),
        details: v.optional(v.string()),
      }),
    ),

    // Metadata
    metadataJsonCid: v.optional(v.string()), // The final compiled JSON stored on IPFS
    metadataJsonUrl: v.optional(v.string()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_property_id", ["propertyId"])
    .index("by_survey_number", ["surveyNumber"])
    .index("by_owner_wallet", ["ownerWalletAddress"])
    .index("by_verification_status", ["verificationStatus"]),
});
