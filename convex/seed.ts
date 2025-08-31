import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Seed the database with sample data
 * Run this once to populate your database with initial data
 */
export const seedDatabase = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    console.log("🌱 Starting database seeding...");

    // 1. Create Categories
    console.log("Creating categories...");
    const scienceCategory = await ctx.db.insert("categories", {
      name: "Science",
      slug: "science",
      description: "Explore the wonders of scientific discovery",
      color: "#3B82F6",
      icon: "🔬",
    });

    const technologyCategory = await ctx.db.insert("categories", {
      name: "Technology",
      slug: "technology", 
      description: "Understanding modern technology and innovation",
      color: "#10B981",
      icon: "💻",
    });

    const historyCategory = await ctx.db.insert("categories", {
      name: "History",
      slug: "history",
      description: "Journey through time and historical events",
      color: "#F59E0B",
      icon: "📚",
    });

    const artCategory = await ctx.db.insert("categories", {
      name: "Art & Culture",
      slug: "art-culture",
      description: "Discover artistic expressions and cultural heritage",
      color: "#EF4444",
      icon: "🎨",
    });

    // 2. Create Tags
    console.log("Creating tags...");
    const beginnerTag = await ctx.db.insert("tags", {
      name: "Beginner Friendly",
      slug: "beginner-friendly",
      description: "Perfect for those new to the topic",
      color: "#22C55E",
    });

    const interactiveTag = await ctx.db.insert("tags", {
      name: "Interactive",
      slug: "interactive",
      description: "Hands-on learning experience",
      color: "#8B5CF6",
    });

    const visualTag = await ctx.db.insert("tags", {
      name: "Visual Learning",
      slug: "visual-learning",
      description: "Learn through images and diagrams",
      color: "#F97316",
    });

    const quickReadTag = await ctx.db.insert("tags", {
      name: "Quick Read",
      slug: "quick-read",
      description: "Can be completed in under 10 minutes",
      color: "#06B6D4",
    });

    // 3. Create Reward Types
    console.log("Creating reward types...");
    await ctx.db.insert("rewardTypes", {
      key: "first_like",
      name: "First Like",
      description: "Liked your first topic",
      points: 10,
      iconUrl: "❤️",
      category: "social",
      isRepeatable: false,
    });

    await ctx.db.insert("rewardTypes", {
      key: "first_share",
      name: "First Share",
      description: "Shared your first topic",
      points: 15,
      iconUrl: "📤",
      category: "social",
      isRepeatable: false,
    });

    await ctx.db.insert("rewardTypes", {
      key: "first_topic_complete",
      name: "Topic Explorer",
      description: "Completed your first topic",
      points: 25,
      iconUrl: "🎯",
      category: "achievement",
      isRepeatable: false,
    });

    await ctx.db.insert("rewardTypes", {
      key: "daily_checkin",
      name: "Daily Visitor",
      description: "Visited the platform today",
      points: 5,
      iconUrl: "📅",
      category: "streak",
      isRepeatable: true,
    });

    // 4. Create Content Types
    console.log("Creating content types...");
    await ctx.db.insert("contentTypes", {
      key: "paragraph",
      name: "Paragraph",
      description: "Standard paragraph text",
      cssClass: "prose-paragraph",
    });

    await ctx.db.insert("contentTypes", {
      key: "heading",
      name: "Heading",
      description: "Section heading",
      cssClass: "prose-heading",
    });

    await ctx.db.insert("contentTypes", {
      key: "callout",
      name: "Callout",
      description: "Important information highlight",
      cssClass: "prose-callout",
    });

    await ctx.db.insert("contentTypes", {
      key: "quote",
      name: "Quote",
      description: "Inspirational or informative quote",
      cssClass: "prose-quote",
    });

    // 5. Create Notification Types
    console.log("Creating notification types...");
    await ctx.db.insert("notificationTypes", {
      key: "reward_earned",
      name: "Reward Earned",
      description: "User earned a new reward",
      iconUrl: "🎉",
      priority: 1,
      defaultTitle: "Congratulations!",
      defaultMessage: "You've earned a new reward!",
    });

    await ctx.db.insert("notificationTypes", {
      key: "achievement_unlocked",
      name: "Achievement Unlocked",
      description: "User unlocked a new achievement",
      iconUrl: "🏆",
      priority: 1,
      defaultTitle: "Achievement Unlocked!",
      defaultMessage: "You've unlocked a new achievement!",
    });

    await ctx.db.insert("notificationTypes", {
      key: "new_topic_available",
      name: "New Topic Available",
      description: "A new topic matching user interests is available",
      iconUrl: "📚",
      priority: 2,
      defaultTitle: "New Topic Available",
      defaultMessage: "Check out this new topic we think you'll love!",
    });

    // 6. Create Sample Topics
    console.log("Creating sample topics...");
    
    // Topic 1: Quantum Physics
    const quantumTopic = await ctx.db.insert("topics", {
      title: "Why Should I Care About Quantum Physics?",
      description: "Discover how quantum physics affects your daily life and why it's revolutionizing technology",
      slug: "quantum-physics-daily-life",
      categoryId: scienceCategory,
      tagIds: [beginnerTag, visualTag],
      difficulty: "beginner" as const,
      estimatedReadTime: 8,
      isPublished: true,
      isTrending: true,
      viewCount: 1247,
      likeCount: 89,
      shareCount: 23,
      lastUpdated: Date.now(),
      isAIGenerated: true,
      generationPrompt: "Explain quantum physics in simple terms for beginners",
      sources: ["MIT Physics Department", "Quantum Computing Research"],
      metadata: {
        wordCount: 1200,
        readingLevel: "Grade 8",
        estimatedTime: 8,
        exerciseCount: 2,
      },
    });

    // Topic 2: AI and Machine Learning
    const aiTopic = await ctx.db.insert("topics", {
      title: "Why Should I Care About Artificial Intelligence?",
      description: "Understanding AI's impact on jobs, creativity, and the future of human society",
      slug: "artificial-intelligence-impact",
      categoryId: technologyCategory,
      tagIds: [beginnerTag, interactiveTag],
      difficulty: "intermediate" as const,
      estimatedReadTime: 12,
      isPublished: true,
      isTrending: true,
      viewCount: 2156,
      likeCount: 156,
      shareCount: 45,
      lastUpdated: Date.now(),
      isAIGenerated: true,
      generationPrompt: "Explain AI impact on society for general audience",
      sources: ["Stanford AI Lab", "MIT Technology Review"],
      metadata: {
        wordCount: 1800,
        readingLevel: "Grade 10",
        estimatedTime: 12,
        exerciseCount: 3,
      },
    });

    // Topic 3: Renaissance Art
    const renaissanceTopic = await ctx.db.insert("topics", {
      title: "Why Should I Care About Renaissance Art?",
      description: "How Renaissance art techniques still influence modern design, movies, and digital art",
      slug: "renaissance-art-modern-influence",
      categoryId: artCategory,
      tagIds: [visualTag, quickReadTag],
      difficulty: "beginner" as const,
      estimatedReadTime: 6,
      isPublished: true,
      isTrending: false,
      viewCount: 834,
      likeCount: 67,
      shareCount: 12,
      lastUpdated: Date.now(),
      isAIGenerated: false,
      sources: ["Art History Institute", "Metropolitan Museum"],
      metadata: {
        wordCount: 900,
        readingLevel: "Grade 7",
        estimatedTime: 6,
        exerciseCount: 1,
      },
    });

    // 7. Create Sample Blocks for Quantum Physics Topic
    console.log("Creating sample blocks...");
    
    await ctx.db.insert("blocks", {
      topicId: quantumTopic,
      content: {
        type: "text",
        data: {
          content: {
            text: "You might think quantum physics is just abstract science for physicists in lab coats, but it's actually powering the technology you use every day. From the GPS in your phone to the LED lights in your home, quantum mechanics is quietly revolutionizing our world.",
            formatting: null,
          },
          styleKey: "paragraph",
        },
      },
      order: 1,
    });

    await ctx.db.insert("blocks", {
      topicId: quantumTopic,
      content: {
        type: "text",
        data: {
          content: {
            text: "What makes quantum physics so special?",
            formatting: { bold: true, size: "large" },
          },
          styleKey: "heading",
        },
      },
      order: 2,
    });

    await ctx.db.insert("blocks", {
      topicId: quantumTopic,
      content: {
        type: "exercise",
        data: {
          exerciseType: "multiple_choice",
          question: "Which everyday technology relies on quantum physics?",
          options: [
            { id: "a", text: "GPS navigation" },
            { id: "b", text: "LED lights" },
            { id: "c", text: "Computer processors" },
            { id: "d", text: "All of the above" },
          ],
          correctAnswer: "d",
          explanation: "All of these technologies depend on quantum mechanical principles to function properly!",
          points: 10,
        },
      },
      order: 3,
    });

    await ctx.db.insert("blocks", {
      topicId: quantumTopic,
      content: {
        type: "text",
        data: {
          content: {
            text: "💡 Fun Fact: Without quantum physics, your smartphone wouldn't exist! The transistors that make up computer chips rely on quantum tunneling to switch on and off billions of times per second.",
            formatting: null,
          },
          styleKey: "callout",
        },
      },
      order: 4,
    });

    // 8. Create Sample Blocks for AI Topic
    await ctx.db.insert("blocks", {
      topicId: aiTopic,
      content: {
        type: "text",
        data: {
          content: {
            text: "Artificial Intelligence isn't just science fiction anymore—it's reshaping how we work, create, and connect with each other. But should you be excited or worried about this technological revolution?",
            formatting: null,
          },
          styleKey: "paragraph",
        },
      },
      order: 1,
    });

    await ctx.db.insert("blocks", {
      topicId: aiTopic,
      content: {
        type: "exercise",
        data: {
          exerciseType: "reflection",
          question: "Think about your daily routine. How many AI-powered tools do you already use without realizing it?",
          correctAnswer: "reflection",
          explanation: "From recommendation algorithms on social media to voice assistants and autocorrect, AI is already deeply integrated into our daily lives!",
          hints: ["Consider your phone, social media, shopping apps, and streaming services"],
          points: 15,
        },
      },
      order: 2,
    });

    // 9. Create Trending Topics Data
    console.log("Creating trending data...");
    await ctx.db.insert("trendingTopics", {
      topicId: quantumTopic,
      score: 95.5,
      period: "weekly",
      calculatedAt: Date.now(),
      metrics: {
        viewsInPeriod: 1247,
        likesInPeriod: 89,
        sharesInPeriod: 23,
        completionsInPeriod: 156,
      },
    });

    await ctx.db.insert("trendingTopics", {
      topicId: aiTopic,
      score: 87.2,
      period: "weekly",
      calculatedAt: Date.now(),
      metrics: {
        viewsInPeriod: 2156,
        likesInPeriod: 156,
        sharesInPeriod: 45,
        completionsInPeriod: 234,
      },
    });

    console.log("✅ Database seeding completed successfully!");
    console.log("📊 Created:");
    console.log("  - 4 categories");
    console.log("  - 4 tags");
    console.log("  - 4 reward types");
    console.log("  - 4 content types");
    console.log("  - 3 notification types");
    console.log("  - 3 sample topics");
    console.log("  - 6 content blocks");
    console.log("  - 2 trending topic entries");

    return null;
  },
});
/**
 
* Create test notifications for a specific user
 * This is useful for testing the notification system
 */
export const createTestNotifications = internalMutation({
  args: {
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    console.log(`🔔 Creating test notifications for user: ${args.userId}`);

    // Create a few test notifications
    await ctx.db.insert("notifications", {
      userId: args.userId,
      notificationTypeKey: "reward_earned",
      title: "🎉 Welcome Reward!",
      message: "You've earned 25 points for joining WSIC! Start exploring topics to earn more rewards.",
      isRead: false,
      isArchived: false,
      data: {
        metadata: {
          points: 25,
          rewardTitle: "Welcome Bonus",
        },
      },
    });

    await ctx.db.insert("notifications", {
      userId: args.userId,
      notificationTypeKey: "achievement_unlocked",
      title: "🏆 First Steps!",
      message: "Achievement unlocked: You've taken your first step into the world of curious learning!",
      isRead: false,
      isArchived: false,
      data: {
        metadata: {
          achievementTitle: "First Steps",
          achievementDescription: "Joined the platform",
        },
      },
    });

    await ctx.db.insert("notifications", {
      userId: args.userId,
      notificationTypeKey: "new_topic_available",
      title: "📚 New Topic: Quantum Physics",
      message: "We think you'll love our new topic about quantum physics and its impact on daily life!",
      isRead: true, // This one is already read
      isArchived: false,
      data: {
        actionUrl: "/topics/quantum-physics-daily-life",
        metadata: {
          topicTitle: "Why Should I Care About Quantum Physics?",
        },
      },
    });

    // Create an older notification
    await ctx.db.insert("notifications", {
      userId: args.userId,
      notificationTypeKey: "reward_earned",
      title: "🎯 Daily Visitor",
      message: "You've earned 5 points for visiting WSIC today. Keep up the great work!",
      isRead: false,
      isArchived: false,
      data: {
        metadata: {
          points: 5,
          rewardTitle: "Daily Visitor",
        },
      },
    });

    console.log("✅ Test notifications created successfully!");
    return null;
  },
});