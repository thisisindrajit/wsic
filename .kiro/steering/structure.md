# Project Structure

## Root Level

- **`.env`** - Environment variables (not committed)
- **`middleware.ts`** - Next.js middleware for route protection
- **`package.json`** - Dependencies and scripts
- **`tsconfig.json`** - TypeScript configuration
- **`next.config.ts`** - Next.js configuration
- **`components.json`** - Shadcn/ui component configuration

## Core Directories

### `/app` - Next.js App Router

- **`layout.tsx`** - Root layout with TopBar, Footer, and Toaster
- **`page.tsx`** - Landing page with search and trending topics
- **`globals.css`** - Global styles and Tailwind imports
- **`/api/auth/[...all]/`** - Better Auth API routes
- **`/login/`** - Authentication pages
- **`/user/dashboard/`** - Protected user dashboard

### `/components` - Reusable UI Components

- **`/ui/`** - Base UI components (Button, Input, Avatar, etc.)
- **Component files** - Feature-specific components (TopBar, Footer, Block, etc.)

### `/lib` - Utility Libraries

- **`auth.ts`** - Better Auth server configuration
- **`auth-client.ts`** - Client-side auth utilities and hooks
- **`utils.ts`** - General utility functions (cn helper, etc.)

### `/constants` - Application Constants

- **`common.ts`** - App name, descriptions, callback URLs

### `/public` - Static Assets

- **`/favicons/`** - App icons and manifest files
- **`logo.png`** - Application logo

## File Naming Conventions

- **React components**: PascalCase (e.g., `TopBar.tsx`, `GoogleSignInButton.tsx`)
- **Pages**: lowercase with hyphens for routes (e.g., `page.tsx`)
- **Utilities**: camelCase (e.g., `auth-client.ts`)
- **Constants**: camelCase files, UPPER_CASE exports

## Import Patterns

- Use `@/` alias for absolute imports from project root
- Components import from `@/components/`
- Utilities import from `@/lib/`
- Constants import from `@/constants/`

## Route Structure

- `/` - Public landing page
- `/login` - Authentication flow
- `/user/dashboard` - Protected user area (requires auth via middleware)
- `/api/auth/*` - Authentication API endpoints
