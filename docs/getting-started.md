# Getting Started

This guide will help you set up the WSIC project for local development.

## Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL database
- Google OAuth credentials
- Convex account (for main data storage)

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
   
   Ensure your PostgreSQL database is running and accessible. Better Auth will automatically create the necessary tables on first run.

5. **Start Development Server**
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

# Database migrations (if needed)
# Better Auth handles migrations automatically
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
│   └── ui/               # Base UI components
├── lib/                  # Utilities and configurations
├── constants/            # Application constants
├── public/               # Static assets
└── docs/                 # Documentation
```

## First Steps

1. Visit `http://localhost:3000` to see the landing page
2. Try the Google sign-in flow at `/login`
3. Explore the protected dashboard at `/user/dashboard`
4. Check the component library in `/components`

## Troubleshooting

### Common Issues

**Database Connection Issues**
- Verify PostgreSQL is running
- Check connection credentials in `.env`
- Ensure database exists and is accessible

**Google OAuth Issues**
- Verify client ID and secret are correct
- Check OAuth redirect URIs in Google Console
- Ensure `NEXT_PUBLIC_BASE_URL` matches your domain

**Build Issues**
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npx tsc --noEmit`