import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get blocks for a specific topic
 */
export const getBlocksByTopic = query({
  args: { topicId: v.id("topics") },
  returns: v.array(
    v.object({
      _id: v.id("blocks"),
      _creationTime: v.number(),
      topicId: v.id("topics"),
      content: v.union(
        // Text content block
        v.object({
          type: v.literal("text"),
          data: v.object({
            content: v.object({
              text: v.string(),
              formatting: v.optional(v.any()),
            }),
            styleKey: v.optional(v.string()),
          }),
        }),
        // Interactive exercise block
        v.object({
          type: v.literal("exercise"),
          data: v.object({
            exerciseType: v.union(
              v.literal("multiple_choice"),
              v.literal("fill_in_blank"),
              v.literal("drag_drop"),
              v.literal("true_false"),
              v.literal("short_answer"),
              v.literal("reflection")
            ),
            question: v.string(),
            options: v.optional(
              v.array(
                v.object({
                  id: v.string(),
                  text: v.string(),
                })
              )
            ),
            correctAnswer: v.string(),
            explanation: v.optional(v.string()),
            hints: v.optional(v.array(v.string())),
            points: v.optional(v.number()),
          }),
        }),
        // Media content block
        v.object({
          type: v.literal("media"),
          data: v.object({
            mediaType: v.union(
              v.literal("image"),
              v.literal("video"),
              v.literal("audio"),
              v.literal("diagram")
            ),
            url: v.optional(v.string()),
            diagramCode: v.optional(v.string()),
            caption: v.optional(v.string()),
            altText: v.optional(v.string()),
            thumbnail: v.optional(v.string()),
          }),
        }),
        // Code snippet block
        v.object({
          type: v.literal("code"),
          data: v.object({
            code: v.string(),
            language: v.optional(v.string()),
            title: v.optional(v.string()),
            explanation: v.optional(v.string()),
            runnable: v.optional(v.boolean()),
          }),
        })
      ),
      order: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("blocks")
      .withIndex("by_topic_and_order", (q) => q.eq("topicId", args.topicId))
      .order("asc")
      .collect();
  },
});

/**
 * Create a new block for a topic
 */
export const createBlock = internalMutation({
  args: {
    topicId: v.id("topics"),
    content: v.union(
      // Text content block
      v.object({
        type: v.literal("text"),
        data: v.object({
          content: v.object({
            text: v.string(),
            formatting: v.optional(v.any()),
          }),
          styleKey: v.optional(v.string()),
        }),
      }),
      // Interactive exercise block
      v.object({
        type: v.literal("exercise"),
        data: v.object({
          exerciseType: v.union(
            v.literal("multiple_choice"),
            v.literal("fill_in_blank"),
            v.literal("drag_drop"),
            v.literal("true_false"),
            v.literal("short_answer"),
            v.literal("reflection")
          ),
          question: v.string(),
          options: v.optional(
            v.array(
              v.object({
                id: v.string(),
                text: v.string(),
              })
            )
          ),
          correctAnswer: v.string(),
          explanation: v.optional(v.string()),
          hints: v.optional(v.array(v.string())),
          points: v.optional(v.number()),
        }),
      }),
      // Media content block
      v.object({
        type: v.literal("media"),
        data: v.object({
          mediaType: v.union(
            v.literal("image"),
            v.literal("video"),
            v.literal("audio"),
            v.literal("diagram")
          ),
          url: v.optional(v.string()),
          diagramCode: v.optional(v.string()),
          caption: v.optional(v.string()),
          altText: v.optional(v.string()),
          thumbnail: v.optional(v.string()),
        }),
      }),
      // Code snippet block
      v.object({
        type: v.literal("code"),
        data: v.object({
          code: v.string(),
          language: v.optional(v.string()),
          title: v.optional(v.string()),
          explanation: v.optional(v.string()),
          runnable: v.optional(v.boolean()),
        }),
      })
    ),
    order: v.number(),
  },
  returns: v.id("blocks"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("blocks", args);
  },
});
