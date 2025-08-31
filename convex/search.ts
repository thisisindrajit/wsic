import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create a content generation request
 */
export const createGenerationRequest = mutation({
  args: {
    userId: v.string(),
    topicQuery: v.string(),
    metadata: v.optional(v.object({
      estimatedBlocks: v.number(),
      targetDifficulty: v.string(),
      requestedSections: v.array(v.string()),
    })),
  },
  returns: v.id("generationRequests"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("generationRequests", {
      ...args,
      status: "pending",
    });
  },
});

/**
 * Update generation request status
 */
export const updateGenerationRequest = internalMutation({
  args: {
    requestId: v.id("generationRequests"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    topicId: v.optional(v.id("topics")),
    errorMessage: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates: any = {
      status: args.status,
    };
    
    if (args.status === "processing") {
      updates.processingStartedAt = Date.now();
    } else if (args.status === "completed" || args.status === "failed") {
      updates.completedAt = Date.now();
    }
    
    if (args.topicId) {
      updates.topicId = args.topicId;
    }
    
    if (args.errorMessage) {
      updates.errorMessage = args.errorMessage;
    }
    
    await ctx.db.patch(args.requestId, updates);
    return null;
  },
});