# API Reference

This document covers the API endpoints and authentication system used in the WSIC application.

## Authentication System

WSIC uses [Better Auth](https://better-auth.com/) for authentication with Google OAuth integration.

### Configuration

**Server Configuration** (`lib/auth.ts`):
```typescript
import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
  database: new Pool({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT
      ? parseInt(process.env.POSTGRES_PORT, 10)
      : 5432,
    database: process.env.POSTGRES_DATABASE,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    ssl: true,
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 10 * 60, // 10 minutes
    },
  },
});
```

**Client Configuration** (`lib/auth-client.ts`):
```typescript
import { createAuthClient } from "better-auth/react";
import { auth } from "./auth";

const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
});

export const { signIn, signUp, signOut, useSession } = authClient;
export type Session = typeof auth.$Infer.Session;
```

## API Endpoints

### Authentication Endpoints

All authentication endpoints are handled by Better Auth at `/api/auth/[...all]`.

#### Base URL
```
/api/auth/
```

#### Available Endpoints

**Session Management:**
- `GET /api/auth/get-session` - Get current user session
- `POST /api/auth/sign-out` - Sign out current user

**OAuth Flow:**
- `GET /api/auth/sign-in/google` - Initiate Google OAuth flow
- `GET /api/auth/callback/google` - Handle Google OAuth callback

### Session Object

The session object contains the following structure:

```typescript
interface Session {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
    createdAt: Date;
    updatedAt: Date;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string;
    userAgent?: string;
  };
}
```

## Client-Side Authentication

### Hooks and Functions

**useSession Hook:**
```typescript
import { useSession } from "@/lib/auth-client";

function MyComponent() {
  const { data: session, isPending, error } = useSession();
  
  if (isPending) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!session) return <div>Not authenticated</div>;
  
  return <div>Welcome, {session.user.name}!</div>;
}
```

**Sign In:**
```typescript
import { signIn } from "@/lib/auth-client";

const handleGoogleSignIn = async () => {
  try {
    const result = await signIn.social({
      provider: "google",
      callbackURL: "/user/dashboard",
      newUserCallbackURL: "/user/dashboard?newUser=1"
    });
    
    if (result?.error) {
      throw new Error(result.error.message);
    }
  } catch (error) {
    console.error("Sign-in error:", error);
  }
};
```

**Sign Out:**
```typescript
import { signOut } from "@/lib/auth-client";

const handleSignOut = async () => {
  await signOut({
    fetchOptions: {
      onSuccess: () => {
        router.push("/");
        router.refresh();
      },
      onError: (error) => {
        console.error("Sign-out error:", error);
      },
    },
  });
};
```

## Server-Side Authentication

### Getting Session in Server Components

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function ServerComponent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return <div>Please sign in</div>;
  }

  return <div>Welcome, {session.user.name}!</div>;
}
```

### Middleware Protection

The application uses Next.js middleware to protect routes:

```typescript
// middleware.ts
import { betterFetch } from "@better-fetch/fetch";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { data: session } = await betterFetch<Session>(
    "/api/auth/get-session",
    {
      baseURL: request.nextUrl.origin,
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    }
  );

  if (!session) {
    return NextResponse.redirect(
      new URL(`/login?redirect_url=${request.url}`, request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/user/:path*"], // Protect all /user/* routes
};
```

## Authentication Flow

### User Journey

1. **Anonymous User**: Can browse landing page and trending content
2. **Search Attempt**: Redirected to login when trying to search topics
3. **Google OAuth**: User signs in with Google account
4. **Session Creation**: Better Auth creates session in PostgreSQL
5. **Dashboard Redirect**: User redirected to personalized dashboard
6. **Protected Access**: Can access all `/user/*` routes

### Callback URLs

- **Standard Login**: `/user/dashboard`
- **New User**: `/user/dashboard?newUser=1`
- **Login Redirect**: `/login?redirect_url=<original_url>`

## Error Handling

### Common Error Scenarios

**Network Issues:**
```typescript
if (error.message.includes("network") || error.message.includes("fetch")) {
  errorMessage = "Connection issue. Please check your internet and try again.";
}
```

**OAuth Issues:**
```typescript
if (error.message.includes("oauth") || error.message.includes("google")) {
  errorMessage = "Unable to sign in with Google. Please try again.";
}
```

**Popup Blocked:**
```typescript
if (error.message.includes("popup") || error.message.includes("blocked")) {
  errorMessage = "Pop-up blocked. Please allow pop-ups and try again.";
}
```

## Database Schema

Better Auth automatically manages the following tables in PostgreSQL:

- `user` - User account information
- `session` - Active user sessions
- `account` - OAuth provider accounts
- `verification` - Email verification tokens (if used)

## Topic Generation API

WSIC includes a sophisticated topic generation system that creates educational content on-demand using AI agents.

### Queue Topic Request Endpoint

**POST `/api/queue-topic-request`**

Queues a topic generation request using QStash for asynchronous processing.

```typescript
// Request body
{
  topic: string;        // Topic to generate content for
  difficulty: string;   // "beginner" | "intermediate" | "advanced"
  user_id: string;      // Better Auth user ID
}

// Response
{
  message: string;           // Success/error message
  qstashMessageId: string;   // QStash message ID for tracking
}
```

**Implementation:**
```typescript
import { Client } from "@upstash/qstash";

const client = new Client({ token: process.env.QSTASH_TOKEN! });

export const POST = async (req: Request) => {
  const { topic, difficulty, user_id } = await req.json();

  const result = await client.publishJSON({
    url: process.env.TOPIC_GENERATOR_RENDER_URL!,
    body: {
      topic,
      difficulty,
      user_id,
      publish_immediately: "True",
    },
    retries: 3,
    retryDelay: "30000" // 30 seconds
  });

  return NextResponse.json({
    message: "Topic queued for generation!",
    qstashMessageId: result.messageId,
  });
};
```

### Topic Generation Pipeline

The topic generation system uses a multi-agent architecture deployed across multiple cloud services:

```mermaid
graph LR
    A[/api/queue-topic-request] --> B[QStash Messaging Queue]
    B --> C[generator_api - Render Long Running Workers]
    C --> D[Google Cloud Run - AI Agents Hosted]
    D --> E[Convex Database]
    
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style C fill:#e8f5e8
    style D fill:#fff3e0
    style E fill:#f1f8e9
```

**Infrastructure Flow:**

1. **Next.js API Route** (`/api/queue-topic-request`): Receives and validates user requests
2. **QStash Messaging Queue**: Ensures reliable delivery with automatic retries
3. **Render Long Running Workers** (`generator_api`): Flask API that orchestrates the generation process
4. **Google Cloud Run**: Auto-scaling platform hosting the AI agents
5. **Convex Database**: Real-time database storing generated content

**AI Agents:**

1. **Topic Checker Agent**: Validates topic appropriateness
2. **Topic Generator Agent**: Creates educational content
3. **Research Agent**: Gathers factual information
4. **Interactive Content Agent**: Creates quizzes and activities
5. **Real-World Impact Agent**: Connects topics to current events
6. **Validator Agent**: Fact-checks all claims
7. **Summary Agent**: Creates flash cards
8. **Thumbnail Generator Agent**: Finds relevant images
9. **Assembler Agent**: Combines all components

**Generator API Endpoints:**

- `POST /check-topic`: Validates topic appropriateness
- `POST /generate-topic`: Full topic generation pipeline
- `GET /ok`: Health check endpoint

## Convex API Integration

WSIC uses Convex for real-time data management and API operations. The application integrates with Convex through React hooks and server functions.

### Search API

#### Simple Text Search

**Simple Search Topics:**
```typescript
// convex/search.ts
export const simpleSearchTopics = query({
  args: {
    searchTerm: v.string(),
    difficulty: v.optional(v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Simple text matching on title, description, and tags
    const searchTerm = args.searchTerm.toLowerCase();
    const matchingTopics = allTopics.filter(topic => 
      topic.title.toLowerCase().includes(searchTerm) ||
      topic.description.toLowerCase().includes(searchTerm) ||
      topic.tagIds.some(tag => tag.toLowerCase().includes(searchTerm))
    );
    // Returns filtered and paginated results
  },
});
```

#### Vector Semantic Search

**Search Similar Topics by Term:**
```typescript
// convex/embeddings.ts
export const searchSimilarTopicsByTerm = action({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // 1. Generate embedding for search term using Google Gemini
    const embedding = await generateEmbedding(args.searchTerm);
    
    // 2. Perform vector search
    const vectorResults = await ctx.vectorSearch("embeddings", "by_embedding", {
      vector: embedding,
    });
    
    // 3. Return topics with similarity scores
    return similarTopics.filter(topic => topic.score !== undefined);
  },
});
```

### Topics API

**Get Trending Topics:**
```typescript
// convex/topics.ts
export const getTrendingTopics = query({
  args: {
    limit: v.optional(v.number()),
    categoryId: v.optional(v.id("categories")),
  },
  handler: async (ctx, args) => {
    // Dynamic trending algorithm based on engagement metrics
    const topicsWithScores = topics.map((topic) => {
      const ageInDays = (now - topic._creationTime) / (24 * 60 * 60 * 1000);
      const ageFactor = Math.max(0.1, 1 - ageInDays / 30);
      const totalEngagement = topic.viewCount * 1 + topic.likeCount * 5 + topic.shareCount * 10;
      const trendingScore = totalEngagement * ageFactor;
      return { ...topic, trendingScore };
    });
    
    return topicsWithScores
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit);
  },
});
```

**Full-Text Search Topics:**
```typescript
export const searchTopics = query({
  args: {
    searchTerm: v.string(),
    categoryId: v.optional(v.id("categories")),
    difficulty: v.optional(v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Uses Convex search index for fast full-text search
    let searchQuery = ctx.db
      .query("topics")
      .withSearchIndex("search_topics", (q) => {
        let search = q.search("title", args.searchTerm).eq("isPublished", true);
        if (args.categoryId) {
          search = search.eq("categoryId", args.categoryId);
        }
        return search;
      });
    
    const results = await searchQuery.take(limit);
    
    // Filter by difficulty if specified
    if (args.difficulty) {
      return results.filter((topic) => topic.difficulty === args.difficulty);
    }
    
    return results;
  },
});
```

**Get Topic by Slug:**
```typescript
export const getTopicBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const topic = await ctx.db
      .query("topics")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .filter((q) => q.eq(q.field("isPublished"), true))
      .unique();

    if (!topic) return null;

    const blocks = await ctx.db
      .query("blocks")
      .withIndex("by_topic_and_order", (q) => q.eq("topicId", topic._id))
      .order("asc")
      .collect();

    return { topic, blocks };
  },
});
```

#### User Interactions API

**Record User Interaction:**
```typescript
// convex/users.ts
export const recordInteraction = mutation({
  args: {
    userId: v.string(),
    topicId: v.id("topics"),
    interactionType: v.union(
      v.literal("view"),
      v.literal("like"),
      v.literal("save"),
      v.literal("share"),
      v.literal("complete")
    ),
    metadata: v.optional(v.object({
      timeSpent: v.optional(v.number()),
      completionPercentage: v.optional(v.number()),
      shareDestination: v.optional(v.string()),
      notes: v.optional(v.string()),
    })),
  },
  // Records user interaction and triggers reward system
});
```

#### Notifications API

**Get User Notifications:**
```typescript
// convex/notifications.ts
export const getUserNotifications = query({
  args: {
    userId: v.string(),
    includeRead: v.optional(v.boolean()),
    includeArchived: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  // Returns user notifications with filtering options
});
```

**Mark Notification as Read:**
```typescript
export const markNotificationAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
    userId: v.string(),
  },
  // Marks individual notification as read
});
```

### Client-Side Integration

**Using Convex Hooks:**
```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

// Query trending topics
const trendingTopics = useQuery(api.topics.getTrendingTopics, {
  limit: 10
});

// Search topics
const searchResults = useQuery(
  api.topics.searchTopics,
  searchTerm ? { searchTerm, limit: 20 } : "skip"
);

// Record user interaction
const recordInteraction = useMutation(api.users.recordInteraction);

const handleLike = async (topicId: string) => {
  if (session?.user?.id) {
    await recordInteraction({
      userId: session.user.id,
      topicId,
      interactionType: "like"
    });
  }
};
```

### Data Models

#### Topic Structure
```typescript
interface Topic {
  _id: Id<"topics">;
  title: string;
  description: string;
  slug: string;
  categoryId?: Id<"categories">;
  tagIds: Id<"tags">[];
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedReadTime: number;
  isPublished: boolean;
  isTrending: boolean;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  createdBy?: string; // Better Auth user ID
  lastUpdated: number;
  isAIGenerated: boolean;
  generationPrompt?: string;
  sources?: string[];
  metadata?: {
    wordCount: number;
    readingLevel: string;
    estimatedTime?: number;
    exerciseCount?: number;
  };
}
```

#### Block Structure
```typescript
interface Block {
  _id: Id<"blocks">;
  topicId: Id<"topics">;
  content: TextBlock | ExerciseBlock | MediaBlock | CodeBlock;
  order: number;
}

type TextBlock = {
  type: "text";
  data: {
    content: {
      text: string;
      formatting?: any;
    };
  };
};

type ExerciseBlock = {
  type: "exercise";
  data: {
    exerciseType: "multiple_choice" | "fill_in_blank" | "drag_drop" | "true_false" | "short_answer" | "reflection";
    question: string;
    options?: { id: string; text: string; }[];
    correctAnswer: string;
    explanation?: string;
    hints?: string[];
    points?: number;
  };
};
```

### Real-Time Features

Convex provides real-time updates for:
- **Live Notifications**: New notifications appear instantly
- **Topic Metrics**: View counts, likes, and shares update in real-time
- **User Interactions**: Social features sync across devices
- **Content Updates**: New topics and blocks appear without refresh

## Security Considerations

- Sessions expire after inactivity
- HTTPS required in production
- CSRF protection enabled by default
- Secure cookie settings
- SQL injection protection via parameterized queries
- Search queries sanitized and rate-limited
- User-specific content generation tracking