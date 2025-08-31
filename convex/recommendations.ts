import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get trending topics by period
 */
export const getTrendingByPeriod = query({
  args: { 
    period: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
    limit: v.optional(v.number())
  },
  returns: v.array(v.object({
    _id: v.id("trendingTopics"),
    topicId: v.id("topics"),
    score: v.number(),
    period: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
    calculatedAt: v.number(),
    metrics: v.object({
      viewsInPeriod: v.number(),
      likesInPeriod: v.number(),
      sharesInPeriod: v.number(),
      completionsInPeriod: v.number(),
    }),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    
    return await ctx.db
      .query("trendingTopics")
      .withIndex("by_period_and_score", (q) => q.eq("period", args.period))
      .order("desc")
      .take(limit);
  },
});



/**
 * Calculate and update trending scores (internal function for cron jobs)
 */
export const calculateTrendingScores = internalMutation({
  args: {
    period: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    let periodStart: number;
    
    // Calculate period start time
    switch (args.period) {
      case "daily":
        periodStart = now - (24 * 60 * 60 * 1000);
        break;
      case "weekly":
        periodStart = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case "monthly":
        periodStart = now - (30 * 24 * 60 * 60 * 1000);
        break;
    }
    
    // Get all published topics
    const topics = await ctx.db
      .query("topics")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .collect();
    
    // Calculate trending scores for each topic
    for (const topic of topics) {
      // Get interactions in the period
      const interactions = await ctx.db
        .query("userTopicInteractions")
        .withIndex("by_topic", (q) => q.eq("topicId", topic._id))
        .filter((q) => q.gte(q.field("_creationTime"), periodStart))
        .collect();
      
      // Count different types of interactions
      const metrics = {
        viewsInPeriod: 0,
        likesInPeriod: 0,
        sharesInPeriod: 0,
        completionsInPeriod: 0,
      };
      
      for (const interaction of interactions) {
        switch (interaction.interactionType) {
          case "view":
            metrics.viewsInPeriod++;
            break;
          case "like":
            metrics.likesInPeriod++;
            break;
          case "share":
            metrics.sharesInPeriod++;
            break;
          case "complete":
            metrics.completionsInPeriod++;
            break;
        }
      }
      
      // Calculate trending score (weighted formula)
      const score = 
        metrics.viewsInPeriod * 1 +
        metrics.likesInPeriod * 3 +
        metrics.sharesInPeriod * 5 +
        metrics.completionsInPeriod * 10;
      
      // Remove old trending entry for this topic and period
      const existing = await ctx.db
        .query("trendingTopics")
        .withIndex("by_topic", (q) => q.eq("topicId", topic._id))
        .filter((q) => q.eq(q.field("period"), args.period))
        .unique();
      
      if (existing) {
        await ctx.db.delete(existing._id);
      }
      
      // Insert new trending entry
      if (score > 0) {
        await ctx.db.insert("trendingTopics", {
          topicId: topic._id,
          score,
          period: args.period,
          calculatedAt: now,
          metrics,
        });
      }
    }
    
    return null;
  },
});