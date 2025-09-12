import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

/**
 * Seed the database with notification types
 */
export const seedNotificationTypes = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // First, clear existing notification types
    const existingTypes = await ctx.db.query("notificationTypes").collect();
    for (const type of existingTypes) {
      await ctx.db.delete(type._id);
    }

    // Define notification types
    const notificationTypes = [
      {
        key: "bad_topic",
        name: "Invalid Topic",
        description:
          "Notification for when a submitted topic is invalid or inappropriate",
        iconUrl: "❌",
        priority: 2, // medium priority
        defaultTitle: "Invalid Topic Submitted",
        defaultMessage:
          "The topic you submitted was not suitable for content generation.",
      },
      {
        key: "topic_generated",
        name: "Topic Generated",
        description:
          "Notification for when a topic has been successfully generated",
        iconUrl: "✅",
        priority: 1, // high priority
        defaultTitle: "Topic Generated Successfully",
        defaultMessage:
          "Your topic has been generated and is ready to explore!",
      },
    ];

    // Insert all notification types
    for (const type of notificationTypes) {
      await ctx.db.insert("notificationTypes", type);
    }

    console.log(
      `Successfully seeded ${notificationTypes.length} notification types`
    );
    return null;
  },
});

/**
 * Seed the database with 25 generic categories that cover any topic in the world
 */
export const seedCategories = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // First, clear existing categories
    const existingCategories = await ctx.db.query("categories").collect();
    for (const category of existingCategories) {
      await ctx.db.delete(category._id);
    }

    // Define 25 comprehensive categories with separate colors for light and dark modes
    const categories = [
      {
        name: "Technology",
        slug: "technology",
        description:
          "Computing, software, AI, programming, and digital innovation",
        lightHex: "#3B82F6", // Blue for light mode
        darkHex: "#60A5FA", // Lighter blue for dark mode
        icon: "💻",
      },
      {
        name: "Science",
        slug: "science",
        description:
          "Physics, chemistry, biology, astronomy, and scientific research",
        lightHex: "#10B981", // Emerald for light mode
        darkHex: "#34D399", // Lighter emerald for dark mode
        icon: "🔬",
      },
      {
        name: "Health & Medicine",
        slug: "health-medicine",
        description:
          "Healthcare, medical research, wellness, and human biology",
        lightHex: "#EF4444", // Red for light mode
        darkHex: "#F87171", // Lighter red for dark mode
        icon: "🏥",
      },
      {
        name: "Business & Finance",
        slug: "business-finance",
        description:
          "Economics, entrepreneurship, investing, and corporate strategy",
        lightHex: "#F59E0B", // Amber for light mode
        darkHex: "#FBBF24", // Lighter amber for dark mode
        icon: "💼",
      },
      {
        name: "Education & Learning",
        slug: "education-learning",
        description:
          "Teaching methods, academic subjects, and skill development",
        lightHex: "#8B5CF6", // Purple for light mode
        darkHex: "#A78BFA", // Lighter purple for dark mode
        icon: "📚",
      },
      {
        name: "Arts & Culture",
        slug: "arts-culture",
        description:
          "Visual arts, music, literature, theater, and cultural studies",
        lightHex: "#EC4899", // Pink for light mode
        darkHex: "#F472B6", // Lighter pink for dark mode
        icon: "🎨",
      },
      {
        name: "History",
        slug: "history",
        description: "Historical events, civilizations, and cultural heritage",
        lightHex: "#B45309", // Orange-brown for light mode
        darkHex: "#D97706", // Lighter orange-brown for dark mode
        icon: "🏛️",
      },
      {
        name: "Environment & Nature",
        slug: "environment-nature",
        description:
          "Ecology, climate change, conservation, and natural sciences",
        lightHex: "#059669", // Emerald for light mode
        darkHex: "#10B981", // Lighter emerald for dark mode
        icon: "🌱",
      },
      {
        name: "Psychology & Mental Health",
        slug: "psychology-mental-health",
        description: "Human behavior, cognitive science, and mental wellness",
        lightHex: "#7C3AED", // Purple for light mode
        darkHex: "#8B5CF6", // Lighter purple for dark mode
        icon: "🧠",
      },
      {
        name: "Sports & Fitness",
        slug: "sports-fitness",
        description: "Athletics, exercise science, and physical wellness",
        lightHex: "#DC2626", // Red for light mode
        darkHex: "#EF4444", // Lighter red for dark mode
        icon: "⚽",
      },
      {
        name: "Food & Nutrition",
        slug: "food-nutrition",
        description: "Culinary arts, dietary science, and food culture",
        lightHex: "#EA580C", // Orange for light mode
        darkHex: "#FB923C", // Lighter orange for dark mode
        icon: "🍎",
      },
      {
        name: "Travel & Geography",
        slug: "travel-geography",
        description: "World cultures, destinations, and geographical studies",
        lightHex: "#0891B2", // Cyan for light mode
        darkHex: "#06B6D4", // Lighter cyan for dark mode
        icon: "🌍",
      },
      {
        name: "Language & Communication",
        slug: "language-communication",
        description: "Linguistics, foreign languages, and communication skills",
        lightHex: "#D97706", // Amber for light mode
        darkHex: "#F59E0B", // Lighter amber for dark mode
        icon: "💬",
      },
      {
        name: "Philosophy & Ethics",
        slug: "philosophy-ethics",
        description:
          "Philosophical thought, moral reasoning, and ethical frameworks",
        lightHex: "#6B7280", // Gray for light mode
        darkHex: "#9CA3AF", // Lighter gray for dark mode
        icon: "🤔",
      },
      {
        name: "Mathematics",
        slug: "mathematics",
        description:
          "Pure and applied mathematics, statistics, and mathematical concepts",
        lightHex: "#4F46E5", // Indigo for light mode
        darkHex: "#6366F1", // Lighter indigo for dark mode
        icon: "📐",
      },
      {
        name: "Engineering",
        slug: "engineering",
        description:
          "Mechanical, electrical, civil, and other engineering disciplines",
        lightHex: "#a64d79", // Purple for light mode
        darkHex: "#c27ba0", // Lighter purple for dark mode
        icon: "⚙️",
      },
      {
        name: "Social Sciences",
        slug: "social-sciences",
        description:
          "Sociology, anthropology, political science, and social studies",
        lightHex: "#6366F1", // Indigo for light mode
        darkHex: "#818CF8", // Lighter indigo for dark mode
        icon: "👥",
      },
      {
        name: "Law & Government",
        slug: "law-government",
        description: "Legal systems, governance, politics, and public policy",
        lightHex: "#2563EB", // Blue for light mode
        darkHex: "#3B82F6", // Lighter blue for dark mode
        icon: "⚖️",
      },
      {
        name: "Religion & Spirituality",
        slug: "religion-spirituality",
        description:
          "World religions, spiritual practices, and theological studies",
        lightHex: "#9333EA", // Purple for light mode
        darkHex: "#C084FC", // Lighter purple for dark mode
        icon: "🕊️",
      },
      {
        name: "Media & Entertainment",
        slug: "media-entertainment",
        description: "Film, television, gaming, journalism, and digital media",
        lightHex: "#DB2777", // Pink for light mode
        darkHex: "#EC4899", // Lighter pink for dark mode
        icon: "🎬",
      },
      {
        name: "Architecture & Design",
        slug: "architecture-design",
        description:
          "Building design, urban planning, and aesthetic principles",
        lightHex: "#0F766E", // Teal for light mode
        darkHex: "#14B8A6", // Lighter teal for dark mode
        icon: "🏗️",
      },
      {
        name: "Agriculture & Farming",
        slug: "agriculture-farming",
        description:
          "Crop science, livestock, sustainable farming, and food production",
        lightHex: "#65A30D", // Lime for light mode
        darkHex: "#84CC16", // Lighter lime for dark mode
        icon: "🚜",
      },
      {
        name: "Transportation",
        slug: "transportation",
        description:
          "Vehicles, logistics, urban mobility, and transportation systems",
        lightHex: "#0284C7", // Sky blue for light mode
        darkHex: "#0EA5E9", // Lighter sky blue for dark mode
        icon: "🚗",
      },
      {
        name: "Energy & Resources",
        slug: "energy-resources",
        description:
          "Renewable energy, fossil fuels, and natural resource management",
        lightHex: "#CA8A04", // Yellow for light mode
        darkHex: "#EAB308", // Lighter yellow for dark mode
        icon: "⚡",
      },
      {
        name: "Personal Development",
        slug: "personal-development",
        description:
          "Self-improvement, productivity, leadership, and life skills",
        lightHex: "#EA580C", // Orange for light mode
        darkHex: "#F97316", // Lighter orange for dark mode
        icon: "🌟",
      },
      {
        name: "Other",
        slug: "other",
        description:
          "Miscellaneous topics that don't fit into other categories",
        lightHex: "#64748B", // Slate for light mode
        darkHex: "#94A3B8", // Lighter slate for dark mode
        icon: "📂",
      },
    ];

    // Insert all categories
    for (const category of categories) {
      await ctx.db.insert("categories", category);
    }

    console.log(`Successfully seeded ${categories.length} categories`);
    return null;
  },
});

/**
 * Clear all existing data (use with caution!)
 */
export const clearAllData = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Clear topics and their blocks
    const topics = await ctx.db.query("topics").collect();
    for (const topic of topics) {
      // Delete associated blocks first
      const blocks = await ctx.db
        .query("blocks")
        .withIndex("by_topic", (q) => q.eq("topicId", topic._id))
        .collect();

      for (const block of blocks) {
        await ctx.db.delete(block._id);
      }

      // Delete associated embeddings
      const embeddings = await ctx.db
        .query("embeddings")
        .withIndex("by_topic", (q) => q.eq("topicId", topic._id))
        .collect();

      for (const embedding of embeddings) {
        await ctx.db.delete(embedding._id);
      }

      // Delete the topic
      await ctx.db.delete(topic._id);
    }

    // Clear categories
    const categories = await ctx.db.query("categories").collect();
    for (const category of categories) {
      await ctx.db.delete(category._id);
    }

    // Clear other tables if needed
    const userInteractions = await ctx.db
      .query("userTopicInteractions")
      .collect();
    for (const interaction of userInteractions) {
      await ctx.db.delete(interaction._id);
    }

    const trendingTopics = await ctx.db.query("trendingTopics").collect();
    for (const trending of trendingTopics) {
      await ctx.db.delete(trending._id);
    }

    console.log("Successfully cleared all data");
    return null;
  },
});

/**
 * Initialize the database with fresh categories and notification types
 */
export const initializeDatabase = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Clear existing data
    await ctx.runMutation(internal.seed.clearAllData, {});

    // Seed with new categories
    await ctx.runMutation(internal.seed.seedCategories, {});

    // Seed with notification types
    await ctx.runMutation(internal.seed.seedNotificationTypes, {});

    console.log("Database initialized successfully");
    return null;
  },
});
