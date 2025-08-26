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
├── page.tsx               # Landing page with search and trending blocks
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
- `page.tsx`: Landing page with search functionality and trending blocks
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
└── common.ts              # App name, descriptions, callback URLs
```

**Exports:**
- `APP_SHORT_NAME`: "WSIC"
- `APP_NAME`: "Why Should I Care"
- `APP_DESCRIPTION`: Application description
- `CALLBACK_URL`: "/user/dashboard"
- `NEW_USER_CALLBACK_URL`: "/user/dashboard?newUser=1"

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

**Constants Update:**
- Added proper APP_DESCRIPTION to replace TODO placeholder
- Description now reflects the application's purpose and functionality

**Component Enhancements:**
- Block component now features glassmorphism design with backdrop blur effects
- SuggestedTopics component includes default topics and customizable props
- Enhanced hover animations and visual effects across components

**Configuration Updates:**
- TypeScript target updated to ES2017
- PostCSS configuration simplified for Tailwind CSS 4
- All configuration files aligned with latest Next.js 15 standards