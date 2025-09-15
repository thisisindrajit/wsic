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
├── embeddings.ts         # Vector embeddings and semantic search
├── search.ts             # Simple text search functionality
├── seed.ts               # Database seeding functions
├── constants.ts          # Convex-specific constants
├── crons.ts              # Scheduled jobs and maintenance
└── types.ts              # Shared type definitions
```

**Key Files:**
- `schema.ts`: Defines all database tables, indexes, and vector search configuration
- `topics.ts`: Core content queries including trending algorithm and full-text search
- `search.ts`: Simple text-based search with filtering capabilities
- `embeddings.ts`: Vector embeddings management and semantic search using Google Gemini
- `blocks.ts`: Multi-agent generated content blocks (research, quizzes, summaries)
- `notifications.ts`: Real-time notification system with Convex integration
- `users.ts`: User interaction tracking and engagement metrics

### `/generator_api` - Topic Generation Service

```
generator_api/
├── .env                  # Environment variables for Python services
├── .venv/                # Python virtual environment
├── __pycache__/          # Python bytecode cache
├── app.py                # Flask API for topic generation orchestration
└── requirements.txt      # Python dependencies
```

**Key Features:**
- **Topic Validation**: Checks topic appropriateness before generation
- **Multi-Agent Orchestration**: Coordinates research, content creation, and validation
- **Convex Integration**: Stores generated content directly in database
- **Error Handling**: Comprehensive error management and retry logic

### `/agents` - AI Agent Services

```
agents/
├── .venv/                # Shared Python virtual environment
├── topic-checker/        # Topic validation agent
│   ├── .env             # Agent-specific environment variables
│   ├── README.md        # Agent documentation
│   ├── __init__.py      # Python package initialization
│   ├── __pycache__/     # Python bytecode cache
│   ├── agent.py         # Main agent implementation
│   └── requirements.txt # Agent dependencies
└── topic-generator/      # Content generation agent
    ├── .env             # Agent-specific environment variables
    ├── README.md        # Agent documentation
    ├── __init__.py      # Python package initialization
    ├── __pycache__/     # Python bytecode cache
    ├── agent.py         # Main agent implementation
    ├── requirements.txt # Agent dependencies
    └── test_insertion.py # Testing utilities
```

**Agent Architecture:**
- **Topic Checker**: Validates topic appropriateness and educational value
- **Topic Generator**: Creates comprehensive educational content using multi-agent workflow
- **Modular Design**: Each agent is independently deployable and scalable
- **Testing Support**: Comprehensive testing utilities for agent validation

### `/interfaces` - TypeScript Interfaces

```
interfaces/
└── NavigationItem.ts      # Navigation item type definitions
```

### `/hooks` - Custom React Hooks

```
hooks/
├── useTopBarVisibility.ts    # TopBar scroll-based visibility hook
├── useTrendingTopics.ts      # Trending topics data fetching
├── useTopic.ts               # Individual topic data management
├── useTopicInteractions.ts   # User interaction handling (like, save, share)
├── useTopics.ts              # General topics data fetching
└── useUserTopics.ts          # User-specific topic data
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
├── hooks-reference.md     # Custom React hooks documentation
├── search-system.md       # Search system architecture
├── topic-generation.md    # AI-powered content generation
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

**Search System Implementation:**
- **Dual Search Strategy**: Combined text search (`convex/search.ts`) and vector semantic search (`convex/embeddings.ts`)
- **Vector Embeddings**: Google Gemini 768-dimensional embeddings for semantic similarity
- **Smart Result Categorization**: High-score similar topics (>0.8) promoted to main results
- **Topic Generation**: "Brew Your Topic" feature for missing content with QStash integration
- **Real-time Search**: Instant text search with async vector search

**AI-Powered Content Generation:**
- **Multi-Agent Architecture**: 8 specialized agents for content creation pipeline
- **Topic Validation**: Automated appropriateness checking before generation
- **Comprehensive Content**: Research briefs, deep dives, real-world impact, quizzes, summaries
- **Fact Verification**: Automated fact-checking using Google Search API
- **Thumbnail Generation**: Automated image selection using Serper API
- **Flask API**: `generator_api/app.py` orchestrates the generation process

**Enhanced Database Schema:**
- **Vector Search Support**: Convex vector index with 768 dimensions for semantic search
- **Embeddings Table**: Semantic search capabilities with difficulty and category filtering
- **Block Content Types**: 7 different content types from multi-agent generation
- **Notification System**: Real-time notifications with expiration and archiving
- **User Interactions**: Comprehensive tracking of engagement metrics (views, likes, shares)

**Component Enhancements:**
- **SearchResults Component**: Sophisticated search interface with dual strategy and brewing UI
- **Block Component**: Glassmorphism design with interactive buttons and real-time updates
- **TopicSearch Component**: Integrated navigation with difficulty selection and suggested topics
- **Enhanced Navigation**: Responsive sidebar and mobile bottom navigation
- **Real-time Updates**: Convex integration for live data synchronization

**Custom Hooks:**
- **useTrendingTopics**: React Query integration with Convex for trending topics
- **useTopicInteractions**: User interaction handling (like, save, share) with optimistic updates
- **useTopic**: Individual topic data management with real-time updates
- **useTopics**: General topics data fetching with filtering and pagination

**API Integration:**
- **QStash Integration**: Asynchronous topic generation with retry logic (`/api/queue-topic-request`)
- **Google APIs**: Gemini embeddings and search for content generation
- **Serper API**: Image search for thumbnail generation
- **Better Auth**: Secure user authentication with PostgreSQL sessions

**Configuration Updates:**
- **Next.js 15.4.6**: Latest App Router with server components
- **Convex 1.26.2**: Vector search and real-time synchronization
- **React 19.1.0**: Latest React with improved performance
- **TypeScript 5**: Enhanced type safety with strict configuration
- **Tailwind CSS 4**: Modern utility-first styling with custom components
- **@google/genai 1.19.0**: Google AI integration for embeddings
- **@upstash/qstash 2.8.2**: Reliable message queuing for topic generation