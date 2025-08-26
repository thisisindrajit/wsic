# Configuration Documentation

This document covers all configuration aspects of the WSIC application, including environment variables, build configuration, and deployment settings.

## Environment Variables

### Required Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Database Configuration (PostgreSQL for auth)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=wsic_auth
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password

# Convex Configuration (main application data)
CONVEX_DEPLOYMENT=your_convex_deployment_url

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Application Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Environment Variable Details

**Database Variables:**
- `POSTGRES_HOST`: PostgreSQL server hostname
- `POSTGRES_PORT`: PostgreSQL server port (default: 5432)
- `POSTGRES_DATABASE`: Database name for auth tables
- `POSTGRES_USER`: Database username
- `POSTGRES_PASSWORD`: Database password

**OAuth Variables:**
- `GOOGLE_CLIENT_ID`: Google OAuth client ID from Google Console
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- Required for Google sign-in functionality

**Application Variables:**
- `NEXT_PUBLIC_BASE_URL`: Base URL for the application (used by Better Auth)

### Development vs Production

**Development:**
```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000
POSTGRES_HOST=localhost
```

**Production:**
```env
NEXT_PUBLIC_BASE_URL=https://your-domain.com
POSTGRES_HOST=your-production-db-host
```

## Next.js Configuration

### next.config.ts

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
```

**Configuration Options:**
- `images.remotePatterns`: Allows loading images from any HTTPS domain
- Future configurations can be added as needed

### TypeScript Configuration

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Key Features:**
- Path mapping with `@/*` alias
- Strict TypeScript checking
- Next.js plugin integration
- Incremental compilation

## Styling Configuration

### Tailwind CSS Configuration

**postcss.config.mjs:**
```javascript
const config = {
  plugins: ["@tailwindcss/postcss"],
};

export default config;
```

### Shadcn/ui Configuration

**components.json:**
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

**Configuration Details:**
- Style: "new-york" variant
- RSC: React Server Components enabled
- Base color: neutral theme
- CSS variables: enabled for theming
- Icon library: Lucide React

## ESLint Configuration

**eslint.config.mjs:**
```javascript
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
```

**Features:**
- Next.js recommended rules
- TypeScript support
- Core Web Vitals checks

## Build Configuration

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

**Script Details:**
- `dev`: Start development server with hot reload
- `build`: Create production build
- `start`: Start production server
- `lint`: Run ESLint checks

### Build Optimization

**Production Build Features:**
- Automatic code splitting
- Image optimization
- CSS minification
- JavaScript minification
- Tree shaking for unused code

## Database Configuration

### Better Auth Database Setup

Better Auth automatically creates required tables:

```typescript
// lib/auth.ts
export const auth = betterAuth({
  database: new Pool({
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
    database: process.env.POSTGRES_DATABASE,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    ssl: true, // Required for production
  }),
  // ... other configuration
});
```

**Database Tables Created:**
- `user`: User account information
- `session`: Active user sessions
- `account`: OAuth provider accounts
- `verification`: Email verification (if enabled)

### Convex Configuration

Convex handles the main application data with real-time synchronization.

**Setup:**
1. Create Convex project at https://convex.dev
2. Get deployment URL
3. Add to environment variables

## Security Configuration

### Authentication Security

**Session Configuration:**
```typescript
session: {
  cookieCache: {
    enabled: true,
    maxAge: 10 * 60, // 10 minutes
  },
},
```

**OAuth Security:**
- HTTPS required in production
- Secure cookie settings
- CSRF protection enabled
- State parameter validation

### Content Security Policy

Consider adding CSP headers for enhanced security:

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
          }
        ]
      }
    ]
  }
}
```

## Deployment Configuration

### Vercel Deployment

**vercel.json (optional):**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "functions": {
    "app/api/auth/[...all]/route.ts": {
      "maxDuration": 30
    }
  }
}
```

### Environment Variables for Production

**Required for deployment:**
- All database credentials
- Google OAuth credentials
- Production base URL
- SSL certificates (handled by platform)

### Performance Configuration

**Next.js Performance Features:**
- Automatic static optimization
- Image optimization with WebP/AVIF
- Font optimization
- Bundle analyzer (can be added)

**Monitoring:**
- Core Web Vitals tracking
- Error boundary implementation
- Performance monitoring (can be added)

## Development Tools Configuration

### VS Code Settings

**Recommended .vscode/settings.json:**
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

### Git Configuration

**.gitignore highlights:**
```
# Environment variables
.env
.env.local
.env.production

# Build outputs
.next/
out/

# Dependencies
node_modules/

# Database
*.db
*.sqlite

# Logs
*.log
```

This configuration ensures a secure, performant, and maintainable application setup.