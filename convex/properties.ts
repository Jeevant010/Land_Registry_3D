import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Mutation to register a new property in the land registry
export const registerProperty = mutation({
  args: {
    // Property Identification
    propertyId: v.string(),
    surveyNumber: v.string(),
    district: v.string(),
    state: v.optional(v.string()),
    country: v.optional(v.string()),
    
    // Area and Location
    areaInSqFt: v.number(),
    areaInAcres: v.optional(v.number()),
    gpsCoordinates: v.optional(v.object({
      latitude: v.number(),
      longitude: v.number(),
    })),
    
    // Owner Information
    ownerName: v.string(),
    ownerWalletAddress: v.string(),
    ownerContactEmail: v.optional(v.string()),
    ownerContactPhone: v.optional(v.string()),
    
    // Document CIDs and URLs from Pinata
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
    propertyType: v.optional(v.string()),
    currentUse: v.optional(v.string()),
    
    // Metadata JSON CID
    metadataJsonCid: v.optional(v.string()),
    metadataJsonUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Create initial history entry
    const initialHistory = [
      {
        action: "Property Registration",
        date: new Date(now).toISOString(),
        performedBy: args.ownerWalletAddress,
        details: `Property ${args.propertyId} registered in the system`,
      },
    ];
    
    // Insert the property into the database
    const propertyId = await ctx.db.insert("properties", {
      ...args,
      verificationStatus: "pending",
      history: initialHistory,
      createdAt: now,
      updatedAt: now,
    });
    
    return propertyId;
  },
});

// Query to get a property by ID
export const getPropertyById = query({
  args: { propertyId: v.string() },
  handler: async (ctx, args) => {
    const property = await ctx.db
      .query("properties")
      .withIndex("by_property_id", (q) => q.eq("propertyId", args.propertyId))
      .first();
    
    return property;
  },
});

// Query to get a property by survey number
export const getPropertyBySurveyNumber = query({
  args: { surveyNumber: v.string() },
  handler: async (ctx, args) => {
    const property = await ctx.db
      .query("properties")
      .withIndex("by_survey_number", (q) => q.eq("surveyNumber", args.surveyNumber))
      .first();
    
    return property;
  },
});

// Query to get all properties by owner wallet
export const getPropertiesByOwner = query({
  args: { ownerWalletAddress: v.string() },
  handler: async (ctx, args) => {
    const properties = await ctx.db
      .query("properties")
      .withIndex("by_owner_wallet", (q) => q.eq("ownerWalletAddress", args.ownerWalletAddress))
      .collect();
    
    return properties;
  },
});

// Query to get all properties
export const getAllProperties = query({
  args: {},
  handler: async (ctx) => {
    const properties = await ctx.db.query("properties").collect();
    return properties;
  },
});
// get all properties with pending verification status
export const getPendingVerifications = query({
  args: {},
  handler: async (ctx) => {
    const properties = await ctx.db
      .query("properties")
      .withIndex("by_verification_status", (q) => q.eq("verificationStatus", "pending"))
      .collect();
    
    return properties;
  },
});

// Mutation to update property verification status
export const updateVerificationStatus = mutation({
  args: {
    propertyId: v.string(),
    status: v.string(),
    verifiedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const property = await ctx.db
      .query("properties")
      .withIndex("by_property_id", (q) => q.eq("propertyId", args.propertyId))
      .first();
    
    if (!property) {
      throw new Error("Property not found");
    }
    
    const now = Date.now();
    const newHistoryEntry = {
      action: `Verification Status Updated to ${args.status}`,
      date: new Date(now).toISOString(),
      performedBy: args.verifiedBy,
      details: `Property verification status changed to: ${args.status}`,
    };
    
    await ctx.db.patch(property._id, {
      verificationStatus: args.status,
      verifiedBy: args.verifiedBy,
      verifiedAt: now,
      history: [...property.history, newHistoryEntry],
      updatedAt: now,
    });
    
    return property._id;
  },
});

// Mutation to update blockchain status
export const updateBlockchainStatus = mutation({
  args: {
    propertyId: v.string(),
    txHash: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const property = await ctx.db
      .query("properties")
      .withIndex("by_property_id", (q) => q.eq("propertyId", args.propertyId))
      .first();
    
    if (!property) {
      throw new Error("Property not found");
    }
    
    const now = Date.now();
    const newHistoryEntry = {
      action: "Blockchain Transaction",
      date: new Date(now).toISOString(),
      performedBy: "System",
      details: `Transaction Hash: ${args.txHash}, Status: ${args.status}`,
    };
    
    await ctx.db.patch(property._id, {
      blockchainTxHash: args.txHash,
      blockchainStatus: args.status,
      history: [...property.history, newHistoryEntry],
      updatedAt: now,
    });
    
    return property._id;
  },
});
