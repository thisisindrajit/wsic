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
        description: "Notification for when a submitted topic is invalid or inappropriate",
        iconUrl: "❌",
        priority: 2, // medium priority
        defaultTitle: "Invalid Topic Submitted",
        defaultMessage: "The topic you submitted was not suitable for content generation."
      },
      {
        key: "topic_generated",
        name: "Topic Generated",
        description: "Notification for when a topic has been successfully generated",
        iconUrl: "✅",
        priority: 1, // high priority
        defaultTitle: "Topic Generated Successfully",
        defaultMessage: "Your topic has been generated and is ready to explore!"
      }
    ];

    // Insert all notification types
    for (const type of notificationTypes) {
      await ctx.db.insert("notificationTypes", type);
    }

    console.log(`Successfully seeded ${notificationTypes.length} notification types`);
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

    // Define 25 comprehensive categories with colors and icons
    const categories = [
      {
        name: "Technology",
        slug: "technology",
        description:
          "Computing, software, AI, programming, and digital innovation",
        color: "#3B82F6", // Blue
        icon: "💻",
      },
      {
        name: "Science",
        slug: "science",
        description:
          "Physics, chemistry, biology, astronomy, and scientific research",
        color: "#10B981", // Green
        icon: "🔬",
      },
      {
        name: "Health & Medicine",
        slug: "health-medicine",
        description:
          "Healthcare, medical research, wellness, and human biology",
        color: "#EF4444", // Red
        icon: "🏥",
      },
      {
        name: "Business & Finance",
        slug: "business-finance",
        description:
          "Economics, entrepreneurship, investing, and corporate strategy",
        color: "#F59E0B", // Amber
        icon: "💼",
      },
      {
        name: "Education & Learning",
        slug: "education-learning",
        description:
          "Teaching methods, academic subjects, and skill development",
        color: "#8B5CF6", // Purple
        icon: "📚",
      },
      {
        name: "Arts & Culture",
        slug: "arts-culture",
        description:
          "Visual arts, music, literature, theater, and cultural studies",
        color: "#EC4899", // Pink
        icon: "🎨",
      },
      {
        name: "History",
        slug: "history",
        description: "Historical events, civilizations, and cultural heritage",
        color: "#92400E", // Brown
        icon: "🏛️",
      },
      {
        name: "Environment & Nature",
        slug: "environment-nature",
        description:
          "Ecology, climate change, conservation, and natural sciences",
        color: "#059669", // Emerald
        icon: "🌱",
      },
      {
        name: "Psychology & Mental Health",
        slug: "psychology-mental-health",
        description: "Human behavior, cognitive science, and mental wellness",
        color: "#7C3AED", // Violet
        icon: "🧠",
      },
      {
        name: "Sports & Fitness",
        slug: "sports-fitness",
        description: "Athletics, exercise science, and physical wellness",
        color: "#DC2626", // Red
        icon: "⚽",
      },
      {
        name: "Food & Nutrition",
        slug: "food-nutrition",
        description: "Culinary arts, dietary science, and food culture",
        color: "#D97706", // Orange
        icon: "🍎",
      },
      {
        name: "Travel & Geography",
        slug: "travel-geography",
        description: "World cultures, destinations, and geographical studies",
        color: "#0891B2", // Cyan
        icon: "🌍",
      },
      {
        name: "Language & Communication",
        slug: "language-communication",
        description: "Linguistics, foreign languages, and communication skills",
        color: "#7C2D12", // Orange-Brown
        icon: "💬",
      },
      {
        name: "Philosophy & Ethics",
        slug: "philosophy-ethics",
        description:
          "Philosophical thought, moral reasoning, and ethical frameworks",
        color: "#374151", // Gray
        icon: "🤔",
      },
      {
        name: "Mathematics",
        slug: "mathematics",
        description:
          "Pure and applied mathematics, statistics, and mathematical concepts",
        color: "#1F2937", // Dark Gray
        icon: "📐",
      },
      {
        name: "Engineering",
        slug: "engineering",
        description:
          "Mechanical, electrical, civil, and other engineering disciplines",
        color: "#4B5563", // Gray
        icon: "⚙️",
      },
      {
        name: "Social Sciences",
        slug: "social-sciences",
        description:
          "Sociology, anthropology, political science, and social studies",
        color: "#6366F1", // Indigo
        icon: "👥",
      },
      {
        name: "Law & Government",
        slug: "law-government",
        description: "Legal systems, governance, politics, and public policy",
        color: "#1E40AF", // Blue
        icon: "⚖️",
      },
      {
        name: "Religion & Spirituality",
        slug: "religion-spirituality",
        description:
          "World religions, spiritual practices, and theological studies",
        color: "#7C3AED", // Violet
        icon: "🕊️",
      },
      {
        name: "Media & Entertainment",
        slug: "media-entertainment",
        description: "Film, television, gaming, journalism, and digital media",
        color: "#DB2777", // Pink
        icon: "🎬",
      },
      {
        name: "Architecture & Design",
        slug: "architecture-design",
        description:
          "Building design, urban planning, and aesthetic principles",
        color: "#0F766E", // Teal
        icon: "🏗️",
      },
      {
        name: "Agriculture & Farming",
        slug: "agriculture-farming",
        description:
          "Crop science, livestock, sustainable farming, and food production",
        color: "#65A30D", // Lime
        icon: "🚜",
      },
      {
        name: "Transportation",
        slug: "transportation",
        description:
          "Vehicles, logistics, urban mobility, and transportation systems",
        color: "#0369A1", // Sky Blue
        icon: "🚗",
      },
      {
        name: "Energy & Resources",
        slug: "energy-resources",
        description:
          "Renewable energy, fossil fuels, and natural resource management",
        color: "#CA8A04", // Yellow
        icon: "⚡",
      },
      {
        name: "Personal Development",
        slug: "personal-development",
        description:
          "Self-improvement, productivity, leadership, and life skills",
        color: "#BE185D", // Rose
        icon: "🌟",
      },
      {
        name: "Other",
        slug: "other",
        description:
          "Miscellaneous topics that don't fit into other categories",
        color: "#6B7280", // Gray
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

/**
 * Seed only notification types (useful for adding new notification types)
 */
export const seedNotificationTypesOnly = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await ctx.runMutation(internal.seed.seedNotificationTypes, {});
    console.log("Notification types seeded successfully");
    return null;
  },
});
