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

## Convex API Integration

WSIC uses Convex for real-time data management and API operations. The application integrates with Convex through React hooks and server functions.

### Convex Functions

#### Topics API

**Search Topics:**
```typescript
// convex/topics.ts
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
  // Returns array of topic objects with metadata
});
```

**Get Trending Topics:**
```typescript
export const getTrendingTopics = query({
  args: {
    limit: v.optional(v.number()),
    categoryId: v.optional(v.id("categories")),
  },
  // Returns trending topics for homepage display
});
```

**Get Topic by Slug:**
```typescript
export const getTopicBySlug = query({
  args: { slug: v.string() },
  // Returns topic with associated blocks for detailed view
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