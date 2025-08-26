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

## Topic Search API

### Search Functionality

The TopicSearch component handles client-side search operations with plans for backend integration.

**Current Implementation:**
```typescript
const handleSearch = (topic: string) => {
  // TODO: Implement search functionality
  console.log('Searching for:', topic);
};
```

**Planned API Endpoints:**

**Search Topics:**
```
POST /api/search/topics
Content-Type: application/json

{
  "query": "climate change",
  "userId": "user_id_here" // Optional for personalization
}
```

**Response:**
```typescript
interface SearchResponse {
  results: {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    relevanceScore: number;
    tags: string[];
  }[];
  suggestions: string[];
  totalResults: number;
}
```

**Generate Content Block:**
```
POST /api/content/generate
Content-Type: application/json

{
  "topic": "artificial intelligence",
  "userId": "user_id_here"
}
```

**Client-Side Integration:**
```typescript
const handleSearch = async (topic: string) => {
  setIsSubmitting(true);
  
  try {
    const response = await fetch('/api/search/topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: topic })
    });
    
    const results = await response.json();
    // Handle search results
  } catch (error) {
    console.error('Search error:', error);
  } finally {
    setIsSubmitting(false);
  }
};
```

## Security Considerations

- Sessions expire after inactivity
- HTTPS required in production
- CSRF protection enabled by default
- Secure cookie settings
- SQL injection protection via parameterized queries
- Search queries sanitized and rate-limited
- User-specific content generation tracking