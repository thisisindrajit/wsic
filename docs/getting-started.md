# Getting Started

This guide will help you set up the WSIC project for local development.

## Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL database (for Better Auth sessions)
- Google OAuth credentials
- Convex account (for main application data)
- Convex CLI installed globally: `npm install -g convex`

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd wsic
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Copy the environment template and configure your variables:
   ```bash
   cp .env.example .env
   ```

   Configure the following environment variables in `.env`:

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

4. **Database Setup**
   
   **PostgreSQL (Better Auth):**
   Ensure your PostgreSQL database is running and accessible. Better Auth will automatically create the necessary tables on first run.

   **Convex Setup:**
   ```bash
   # Initialize Convex project (if not already done)
   npx convex dev
   
   # This will:
   # 1. Create a new Convex project (if needed)
   # 2. Deploy your schema and functions
   # 3. Generate type-safe API files
   # 4. Start the development server
   ```

   Follow the Convex setup prompts to create your deployment and get your deployment URL.

5. **Seed Development Data (Optional)**
   ```bash
   # Seed the database with sample categories, tags, and topics
   npx convex run seed:seedDatabase
   ```

6. **Start Development Server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## Development Commands

```bash
# Development
npm run dev          # Start development server on port 3000
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Convex Development
npx convex dev       # Start Convex development server
npx convex deploy    # Deploy schema and functions to Convex
npx convex dashboard # Open Convex dashboard in browser

# Database Operations
# Better Auth handles PostgreSQL migrations automatically
# Convex handles schema migrations automatically on deploy
```

## Project Structure Overview

```
wsic/
├── app/                    # Next.js App Router
│   ├── api/auth/          # Authentication API routes
│   ├── login/             # Login pages
│   ├── user/dashboard/    # Protected user area
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── layout/           # Layout components
│   ├── auth/             # Authentication components
│   └── features/         # Feature-specific components
├── convex/               # Convex database functions
│   ├── schema.ts         # Database schema
│   ├── topics.ts         # Topic management
│   ├── users.ts          # User interactions
│   └── notifications.ts  # Notification system
├── lib/                  # Utilities and configurations
├── constants/            # Application constants
├── providers/            # React context providers
├── hooks/                # Custom React hooks
├── interfaces/           # TypeScript interfaces
├── public/               # Static assets
└── docs/                 # Documentation
```

## First Steps

1. Visit `http://localhost:3000` to see the landing page with search interface
2. Try the Google sign-in flow at `/login`
3. Explore the protected dashboard at `/user/dashboard` with real-time features
4. Check the Convex dashboard to see your database tables and functions
5. Test the notification system and user interactions
6. Explore the component library in `/components`

## Troubleshooting

### Common Issues

**Database Connection Issues**
- Verify PostgreSQL is running
- Check connection credentials in `.env`
- Ensure database exists and is accessible

**Convex Issues**
- Ensure Convex CLI is installed: `npm install -g convex`
- Check Convex deployment URL in `.env`
- Verify schema deployment: `npx convex deploy`
- Check Convex dashboard for function errors

**Google OAuth Issues**
- Verify client ID and secret are correct
- Check OAuth redirect URIs in Google Console
- Ensure `NEXT_PUBLIC_BASE_URL` matches your domain

**Build Issues**
- Clear `.next` folder: `rm -rf .next`
- Clear Convex cache: `rm -rf .convex`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npx tsc --noEmit`
- Redeploy Convex functions: `npx convex deploy`

**Real-Time Features Not Working**
- Ensure Convex development server is running: `npx convex dev`
- Check browser console for WebSocket connection errors
- Verify Convex deployment URL is correct
- Check network connectivity and firewall settings