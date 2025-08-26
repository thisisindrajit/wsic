# WSIC (Why Should I Care) - Documentation

Welcome to the WSIC project documentation. This directory contains comprehensive guides for developers working on the "Why Should I Care" web application.

## Quick Start

1. **[Getting Started](./getting-started.md)** - Setup and installation guide
2. **[Project Structure](./project-structure.md)** - Overview of the codebase organization
3. **[API Reference](./api-reference.md)** - Authentication and API endpoints
4. **[Components](./components.md)** - UI component documentation
5. **[Configuration](./configuration.md)** - Environment and build configuration
6. **[Styling Guide](./styling-guide.md)** - Design system and styling patterns
7. **[Changelog](./CHANGELOG.md)** - Project updates and version history

## Project Overview

WSIC is a Next.js 15 application that helps users discover and understand topics they might not initially find interesting. The platform presents information in an engaging, accessible format to spark curiosity and learning.

### Key Features
- **Topic Search**: Main search interface with "Why Should I Care about" branding
- **Google OAuth Authentication**: Secure sign-in with Better Auth
- **Content Blocks**: Glassmorphism-styled topic cards with engagement metrics
- **Responsive Dashboard**: 3-column grid layout with navigation and trending content
- **Suggested Topics**: Quick access to popular search topics
- **Mobile-First Design**: Responsive layout with mobile bottom navigation
- **Real-Time Sync**: Convex integration for live data updates

### Technology Stack
- **Frontend**: Next.js 15.4.6, React 19.1.0, TypeScript 5
- **Styling**: Tailwind CSS 4, Radix UI components, Class Variance Authority
- **Authentication**: Better Auth 1.3.6 with Google OAuth
- **Database**: PostgreSQL (auth sessions), Convex (main data)
- **Icons**: Lucide React 0.539.0
- **Notifications**: Sonner 2.0.7
- **Utilities**: clsx, tailwind-merge

## Development Workflow

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

## Architecture

The application uses a dual database architecture:
- **PostgreSQL**: Better Auth sessions and analytics data
- **Convex**: Main entities (topics, blocks, user interactions) with real-time sync

Route protection is handled via Next.js middleware for `/user/*` paths.