# Project Structure

This document provides a detailed overview of the WSIC project structure and organization.

## Root Level Files

```
wsic/
├── .env                    # Environment variables (not committed)
├── .gitignore             # Git ignore patterns
├── middleware.ts          # Next.js middleware for route protection
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── next.config.ts         # Next.js configuration
├── components.json        # Shadcn/ui component configuration
├── postcss.config.mjs     # PostCSS configuration
├── eslint.config.mjs      # ESLint configuration
└── README.md              # Project overview
```

## Core Directories

### `/app` - Next.js App Router

The main application structure using Next.js 15 App Router:

```
app/
├── layout.tsx             # Root layout with TopBar, Footer, Toaster
├── page.tsx               # Landing page with search and trending topics
├── globals.css            # Global styles and Tailwind imports
├── favicon.ico            # App favicon
├── api/
│   └── auth/
│       └── [...all]/
│           └── route.ts   # Better Auth API routes
├── login/
│   ├── layout.tsx         # Login layout with auth redirect
│   └── page.tsx           # Login page with Google OAuth
└── user/
    └── dashboard/
        ├── layout.tsx     # Dashboard layout wrapper
        └── page.tsx       # Protected user dashboard with 3-column grid
```

**Key Files:**
- `layout.tsx`: Root layout that includes TopBar, Footer, and Toaster components
- `page.tsx`: Landing page with search functionality and trending topics
- `globals.css`: Global styles including Tailwind CSS imports (moved to end of imports in layout.tsx)

### `/components` - Reusable UI Components

Component library organized by functionality and usage patterns:

```
components/
├── ui/                    # Base UI components (Shadcn/ui)
│   ├── avatar.tsx         # User avatar component
│   ├── button.tsx         # Button variants
│   ├── dropdown-menu.tsx  # Dropdown menu primitives
│   ├── input.tsx          # Input field component
│   └── separator.tsx      # Visual separator
├── layout/                # Layout components
│   ├── TopBar.tsx         # Navigation header
│   └── Footer.tsx         # Site footer
├── navigation/            # Navigation components
│   ├── NavigationSidebar.tsx      # Desktop sidebar navigation
│   └── MobileBottomNavigation.tsx # Mobile bottom navigation
├── content/               # Content display components
│   ├── Block.tsx          # Content block component
│   ├── TrendingTopics.tsx # Trending topics display
│   └── SuggestedTopics.tsx # Topic suggestions component
├── features/              # Feature-specific components
│   ├── TopicSearch.tsx    # Main topic search functionality
│   └── SubscriptionCard.tsx # Subscription management card
├── auth/                  # Authentication components
│   └── GoogleSignInButton.tsx # Google OAuth sign-in button
├── index.ts               # Main component exports
└── README.md              # Component structure documentation
```

**Component Categories:**
- **UI Components**: Base components from Shadcn/ui library
- **Layout Components**: Page structure and layout components
- **Navigation Components**: Sidebar and mobile navigation
- **Content Components**: Content display and management
- **Feature Components**: Application-specific functionality
- **Auth Components**: Authentication-related components

### `/lib` - Utility Libraries

Core utilities and configurations:

```
lib/
├── auth.ts                # Better Auth server configuration
├── auth-client.ts         # Client-side auth utilities and hooks
└── utils.ts               # General utility functions (cn helper, etc.)
```

**Key Files:**
- `auth.ts`: Server-side Better Auth configuration with PostgreSQL
- `auth-client.ts`: Client-side auth hooks and utilities
- `utils.ts`: Utility functions including Tailwind class merging

### `/constants` - Application Constants

```
constants/
└── common.ts              # App name, descriptions, callback URLs, navigation
```

**Exports:**
- `APP_SHORT_NAME`: "WSIC"
- `APP_NAME`: "Why Should I Care"
- `APP_DESCRIPTION`: Application description
- `CALLBACK_URL`: "/user/dashboard"
- `NEW_USER_CALLBACK_URL`: "/user/dashboard?newUser=1"
- `TOPBAR_SCROLL_THRESHOLD`: Scroll threshold for TopBar visibility
- `navigationItems`: Desktop navigation configuration
- `mobileNavigationItems`: Mobile navigation configuration

### `/convex` - Convex Database Functions

```
convex/
├── _generated/            # Auto-generated Convex files
│   ├── api.d.ts          # API type definitions
│   ├── api.js            # API client
│   ├── dataModel.d.ts    # Data model types
│   ├── server.d.ts       # Server function types
│   └── server.js         # Server runtime
├── schema.ts             # Database schema definition
├── blocks.ts             # Block content management
├── categories.ts         # Category management
├── topics.ts             # Topic queries and mutations
├── users.ts              # User interaction tracking
├── notifications.ts      # Notification system
├── rewards.ts            # Gamification and rewards
├── recommendations.ts    # Content recommendation engine
├── search.ts             # Search functionality
├── tags.ts               # Tag management
├── seed.ts               # Database seeding functions
├── constants.ts          # Convex-specific constants
└── index.ts              # Main exports
```

**Key Files:**
- `schema.ts`: Defines all database tables, indexes, and relationships
- `topics.ts`: Core content queries including search and trending topics
- `users.ts`: User interaction tracking and engagement metrics
- `notifications.ts`: Real-time notification system with Convex integration
- `blocks.ts`: Content block management for topics (text, exercises, media, code)

### `/interfaces` - TypeScript Interfaces

```
interfaces/
└── NavigationItem.ts      # Navigation item type definitions
```

### `/hooks` - Custom React Hooks

```
hooks/
└── useTopBarVisibility.ts # TopBar scroll-based visibility hook
```

### `/providers` - React Context Providers

```
providers/
├── ConvexClientProvider.tsx # Convex client configuration
└── ThemeProvider.tsx        # Theme management provider
```

### `/public` - Static Assets

```
public/
├── favicons/              # App icons and manifest files
│   ├── apple-touch-icon.png
│   ├── favicon-96x96.png
│   ├── favicon.ico
│   ├── favicon.svg
│   ├── site.webmanifest
│   ├── web-app-manifest-192x192.png
│   └── web-app-manifest-512x512.png
└── logo.png               # Application logo
```

### `/docs` - Documentation

```
docs/
├── README.md              # Documentation overview
├── getting-started.md     # Setup and installation guide
├── project-structure.md   # This file
├── api-reference.md       # API endpoints and authentication
├── components.md          # Component documentation
└── configuration.md       # Environment and build configuration
```

## File Naming Conventions

- **React Components**: PascalCase (e.g., `TopBar.tsx`, `GoogleSignInButton.tsx`)
- **Pages**: lowercase with hyphens for routes (e.g., `page.tsx`)
- **Utilities**: camelCase (e.g., `auth-client.ts`)
- **Constants**: camelCase files, UPPER_CASE exports

## Import Patterns

The project uses TypeScript path mapping for clean imports:

```typescript
// Use @/ alias for absolute imports from project root
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { APP_NAME } from "@/constants/common";
```

**Import Aliases:**
- `@/components/` - UI and feature components
- `@/lib/` - Utilities and configurations
- `@/constants/` - Application constants
- `@/app/` - App router pages and layouts

## Route Structure

```
/                          # Public landing page
├── /login                 # Authentication flow
├── /user/dashboard        # Protected user area (requires auth)
└── /api/auth/*           # Authentication API endpoints
```

**Route Protection:**
- `/user/*` routes are protected by middleware
- Unauthenticated users are redirected to `/login`
- Authenticated users on `/` or `/login` are redirected to `/user/dashboard`

## Recent Changes

**Convex Integration:**
- Comprehensive database schema with 12+ tables for topics, blocks, users, notifications
- Real-time notification system with unread count and mark-as-read functionality
- User interaction tracking for likes, saves, shares, and completions
- Gamification system with rewards and achievement notifications
- Full-text search capabilities with filtering and categorization
- Content generation request tracking and status management

**Component Enhancements:**
- Block component now features glassmorphism design with backdrop blur effects
- SuggestedTopics component includes default topics and customizable props
- Notification component with real-time Convex integration and dropdown interface
- Enhanced hover animations and visual effects across components
- MetaThemeAndBgColor component for dynamic browser UI theming

**Configuration Updates:**
- TypeScript target updated to ES2017
- PostCSS configuration simplified for Tailwind CSS 4
- All configuration files aligned with latest Next.js 15 standards
- Convex 1.26.2 integration with type-safe API generation

**Navigation System:**
- Comprehensive navigation constants with desktop and mobile configurations
- NavigationSidebar and MobileBottomNavigation components
- TopBar visibility hook for scroll-based interactions