import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Transaction Status Flow:
// INITIATED -> LOCKED -> SUBMITTED -> APPROVED/REJECTED -> MINTED/REFUNDED

// ==================== MUTATIONS ====================

// Mutation to initiate a new property transfer transaction
export const initiateTransaction = mutation({
  args: {
    propertyId: v.string(),
    tokenId: v.optional(v.string()), // NFT token ID
    sellerWallet: v.string(),
    buyerWallet: v.string(),
    agreedPrice: v.string(), // Price in ETH as string
    escrowContractAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Validate that seller and buyer are different addresses
    if (args.sellerWallet.toLowerCase() === args.buyerWallet.toLowerCase()) {
      throw new Error(
        `Invalid transaction: Seller and buyer cannot be the same address (${args.sellerWallet}). ` +
        "You cannot transfer a property to yourself."
      );
    }

    // Check if property exists and get details
    const property = await ctx.db
      .query("properties")
      .withIndex("by_property_id", (q) => q.eq("propertyId", args.propertyId))
      .first();

    if (!property) {
      throw new Error(`Property with ID "${args.propertyId}" not found in the database. Please ensure the property is registered first.`);
    }

    // Verify seller is the current owner
    if (property.ownerWalletAddress.toLowerCase() !== args.sellerWallet.toLowerCase()) {
      throw new Error(`Seller wallet ${args.sellerWallet} does not match property owner ${property.ownerWalletAddress}`);
    }

    // Check if there's already a pending transaction for this property
    const existingTransaction = await ctx.db
      .query("transactions")
      .withIndex("by_property_id", (q) => q.eq("propertyId", args.propertyId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "INITIATED"),
          q.eq(q.field("status"), "LOCKED"),
          q.eq(q.field("status"), "SUBMITTED"),
        ),
      )
      .first();

    if (existingTransaction) {
      throw new Error(`A pending transaction already exists for this property (Status: ${existingTransaction.status})`);
    }

    const transactionId = await ctx.db.insert("transactions", {
      propertyId: args.propertyId,
      tokenId: args.tokenId,
      sellerWallet: args.sellerWallet,
      buyerWallet: args.buyerWallet,
      agreedPrice: args.agreedPrice,
      status: "INITIATED",
      documents: {
        saleDeedCid: "",
        saleDeedUrl: "",
        encumbranceCertCid: "",
        encumbranceCertUrl: "",
        taxReceiptCid: "",
        taxReceiptUrl: "",
        buyerIdCid: "",
        buyerIdUrl: "",
        sellerIdCid: "",
        sellerIdUrl: "",
        nocCid: "",
        nocUrl: "",
        affidavitCid: "",
        affidavitUrl: "",
      },
      escrowContractAddress: args.escrowContractAddress,
      createdAt: now,
      updatedAt: now,
    });

    return transactionId;
  },
});

// Mutation to update transaction status when funds are locked
export const lockFunds = mutation({
  args: {
    transactionId: v.id("transactions"),
    lockTxHash: v.string(),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.transactionId);

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.status !== "INITIATED") {
      throw new Error("Transaction must be in INITIATED status to lock funds");
    }

    await ctx.db.patch(args.transactionId, {
      status: "LOCKED",
      lockTxHash: args.lockTxHash,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Mutation to upload documents (Approval Packet)
export const uploadDocuments = mutation({
  args: {
    transactionId: v.id("transactions"),
    documentType: v.string(), // saleDeed, encumbranceCert, taxReceipt, buyerId, sellerId, noc, affidavit
    cid: v.string(),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.transactionId);

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    const documentUpdates: Record<string, string> = {};

    switch (args.documentType) {
      case "saleDeed":
        documentUpdates.saleDeedCid = args.cid;
        documentUpdates.saleDeedUrl = args.url;
        break;
      case "encumbranceCert":
        documentUpdates.encumbranceCertCid = args.cid;
        documentUpdates.encumbranceCertUrl = args.url;
        break;
      case "taxReceipt":
        documentUpdates.taxReceiptCid = args.cid;
        documentUpdates.taxReceiptUrl = args.url;
        break;
      case "buyerId":
        documentUpdates.buyerIdCid = args.cid;
        documentUpdates.buyerIdUrl = args.url;
        break;
      case "sellerId":
        documentUpdates.sellerIdCid = args.cid;
        documentUpdates.sellerIdUrl = args.url;
        break;
      case "noc":
        documentUpdates.nocCid = args.cid;
        documentUpdates.nocUrl = args.url;
        break;
      case "affidavit":
        documentUpdates.affidavitCid = args.cid;
        documentUpdates.affidavitUrl = args.url;
        break;
      default:
        throw new Error("Invalid document type");
    }

    await ctx.db.patch(args.transactionId, {
      documents: {
        ...transaction.documents,
        ...documentUpdates,
      },
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Mutation to submit transaction for approval
export const submitForApproval = mutation({
  args: {
    transactionId: v.id("transactions"),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.transactionId);

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.status !== "LOCKED") {
      throw new Error("Funds must be locked before submitting for approval");
    }

    // Validate required documents are uploaded
    const docs = transaction.documents;
    const requiredDocs = [
      { key: "saleDeedUrl", name: "Sale Deed" },
      { key: "encumbranceCertUrl", name: "Encumbrance Certificate" },
      { key: "taxReceiptUrl", name: "Tax Receipt" },
      { key: "buyerIdUrl", name: "Buyer ID" },
    ];

    for (const doc of requiredDocs) {
      if (!docs[doc.key as keyof typeof docs]) {
        throw new Error(`${doc.name} is required`);
      }
    }

    await ctx.db.patch(args.transactionId, {
      status: "SUBMITTED",
      submittedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Mutation for admin to approve transaction
export const approveTransaction = mutation({
  args: {
    transactionId: v.id("transactions"),
    adminWallet: v.string(),
    mintTxHash: v.string(),
    adminComments: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.transactionId);

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.status !== "SUBMITTED") {
      throw new Error("Transaction must be in SUBMITTED status to approve");
    }

    await ctx.db.patch(args.transactionId, {
      status: "APPROVED",
      approvedBy: args.adminWallet,
      approvedAt: Date.now(),
      txHash: args.mintTxHash,
      adminComments: args.adminComments,
      updatedAt: Date.now(),
    });

    // Update the property ownership
    const property = await ctx.db
      .query("properties")
      .withIndex("by_property_id", (q) =>
        q.eq("propertyId", transaction.propertyId),
      )
      .first();

    if (property) {
      await ctx.db.patch(property._id, {
        ownerWalletAddress: transaction.buyerWallet,
        verificationStatus: "verified",
        blockchainTxHash: args.mintTxHash,
        blockchainStatus: "confirmed",
        updatedAt: Date.now(),
        history: [
          ...property.history,
          {
            action: "Property Transfer",
            date: new Date().toISOString(),
            performedBy: args.adminWallet,
            details: `Property transferred from ${transaction.sellerWallet} to ${transaction.buyerWallet}. TX: ${args.mintTxHash}`,
          },
        ],
      });
    }

    return { success: true };
  },
});

// Mutation for admin to reject transaction
export const rejectTransaction = mutation({
  args: {
    transactionId: v.id("transactions"),
    adminWallet: v.string(),
    rejectionReason: v.string(),
    refundTxHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.transactionId);

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.status !== "SUBMITTED") {
      throw new Error("Transaction must be in SUBMITTED status to reject");
    }

    await ctx.db.patch(args.transactionId, {
      status: "REJECTED",
      rejectedBy: args.adminWallet,
      rejectedAt: Date.now(),
      rejectionReason: args.rejectionReason,
      refundTxHash: args.refundTxHash,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ==================== QUERIES ====================

// Query to get transaction by ID
export const getTransactionById = query({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.transactionId);
    return transaction;
  },
});

// Query to get all pending approvals (for admin)
export const getPendingApprovals = query({
  args: {},
  handler: async (ctx) => {
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_status", (q) => q.eq("status", "SUBMITTED"))
      .collect();

    // Enrich with property details
    const enrichedTransactions = await Promise.all(
      transactions.map(async (tx) => {
        const property = await ctx.db
          .query("properties")
          .withIndex("by_property_id", (q) => q.eq("propertyId", tx.propertyId))
          .first();

        return {
          ...tx,
          property,
        };
      }),
    );

    return enrichedTransactions;
  },
});

// Query to get transactions by wallet (buyer or seller)
export const getTransactionsByWallet = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const asBuyer = await ctx.db
      .query("transactions")
      .withIndex("by_buyer", (q) => q.eq("buyerWallet", args.walletAddress))
      .collect();

    const asSeller = await ctx.db
      .query("transactions")
      .withIndex("by_seller", (q) => q.eq("sellerWallet", args.walletAddress))
      .collect();

    return {
      asBuyer,
      asSeller,
      all: [...asBuyer, ...asSeller],
    };
  },
});

// Query to get transaction by property ID
export const getTransactionsByPropertyId = query({
  args: { propertyId: v.string() },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_property_id", (q) => q.eq("propertyId", args.propertyId))
      .collect();

    return transactions;
  },
});

// Query to get all transactions (for admin dashboard)
export const getAllTransactions = query({
  args: {},
  handler: async (ctx) => {
    const transactions = await ctx.db.query("transactions").collect();
    return transactions;
  },
});
