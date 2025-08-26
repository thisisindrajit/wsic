# Technology Stack

## Framework & Runtime
- **Next.js 15.4.6** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript 5** - Type safety and development experience
- **Node.js** - Runtime environment

## Styling & UI
- **Tailwind CSS 4** - Utility-first CSS framework
- **Radix UI** - Headless component primitives
- **Lucide React** - Icon library
- **Class Variance Authority (CVA)** - Component variant management
- **Geist Font** - Typography from Vercel

## Authentication & Database
- **Better Auth** - Modern authentication library
- **PostgreSQL** - Auth sessions and analytics data storage
- **Convex** - Main application entities and real-time sync
- **Google OAuth** - Social authentication provider

## Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Sonner** - Toast notifications

## Common Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Environment Setup
- Copy `.env.example` to `.env` and configure:
  - PostgreSQL connection details (for auth)
  - Convex deployment URL (for main data)
  - Google OAuth credentials
  - Base URL for authentication

## Architecture Notes
- Uses App Router with server components by default
- Middleware handles route protection for `/user/*` paths
- Dual database architecture:
  - PostgreSQL: Better Auth sessions and analytics data
  - Convex: Main entities (topics, blocks, user interactions) with real-time sync
- Anonymous search triggers authentication requirement for block generation