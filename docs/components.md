# Components Documentation

This document provides detailed information about the React components used in the WSIC application.

## Component Architecture

The application follows a component-based architecture with:
- **Base UI Components**: Reusable primitives from Shadcn/ui
- **Feature Components**: Application-specific components
- **Layout Components**: Page structure components

## Base UI Components (`/components/ui/`)

These components are built on top of Radix UI primitives and styled with Tailwind CSS.

### Avatar (`avatar.tsx`)

User profile picture component with fallback support.

```typescript
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

<Avatar className="size-10">
  <AvatarImage src={user.image} />
  <AvatarFallback>{user.name.substring(0, 1)}</AvatarFallback>
</Avatar>
```

**Props:**
- Standard Radix UI Avatar props
- `className`: Additional CSS classes

### Button (`button.tsx`)

Flexible button component with multiple variants and sizes.

```typescript
import { Button } from "@/components/ui/button";

<Button variant="outline" size="lg">
  Click me
</Button>
```

**Variants:**
- `default`: Primary button style
- `destructive`: Red/danger button
- `outline`: Outlined button
- `secondary`: Secondary button style
- `ghost`: Transparent button
- `link`: Link-styled button

**Sizes:**
- `default`: Standard size
- `sm`: Small button
- `lg`: Large button
- `icon`: Square icon button

### Dropdown Menu (`dropdown-menu.tsx`)

Accessible dropdown menu component.

```typescript
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button>Open Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Item 1</DropdownMenuItem>
    <DropdownMenuItem>Item 2</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Input (`input.tsx`)

Form input component with consistent styling.

```typescript
import { Input } from "@/components/ui/input";

<Input 
  type="text" 
  placeholder="Enter text..." 
  className="custom-class"
/>
```

### Separator (`separator.tsx`)

Visual separator component for content sections.

```typescript
import { Separator } from "@/components/ui/separator";

<Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />
```

## Feature Components

### Block (`Block.tsx`)

Content block component for displaying topic information with glassmorphism design.

```typescript
interface TrendingBlockProps {
  imageUrl: string;
  title: string;
  description: string;
  likes: number;
  shares: number;
}

<Block
  imageUrl="https://example.com/image.jpg"
  title="Climate Change"
  description="Understanding global warming effects..."
  likes={2340}
  shares={650}
/>
```

**Features:**
- Full background image with gradient overlay
- Glassmorphism design with backdrop blur
- Social engagement metrics (likes, shares)
- Responsive aspect ratio (2/2.5)
- Hover animations with scale and glow effects
- View button with glassmorphism styling
- Text with drop shadows for readability
- Line clamping for title and description

### GoogleSignInButton (`GoogleSignInButton.tsx`)

Google OAuth sign-in button with loading states and error handling.

```typescript
interface GoogleSignInButtonProps {
  isLoading?: boolean;
  onSignIn?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

<GoogleSignInButton
  onSignIn={() => console.log("Sign-in started")}
  onError={(error) => console.error(error)}
/>
```

**Features:**
- Google branding and icon
- Loading spinner during authentication
- Error handling with user-friendly messages
- Disabled state support
- Hover animations

**Error Types Handled:**
- Network connectivity issues
- OAuth/Google-specific errors
- Popup blocking
- Generic authentication failures

### SuggestedTopics (`SuggestedTopics.tsx`)

Component displaying suggested search topics as interactive buttons.

```typescript
interface SuggestedTopicsProps {
  topics?: string[];
}

<SuggestedTopics 
  topics={["Climate Change", "AI", "Mental Health"]}
/>
```

**Features:**
- Default curated topic suggestions
- Customizable topic list via props
- Interactive button styling with hover effects
- Responsive flexbox layout
- Scale animation on hover
- Teal accent color on hover
- Rounded pill design

**Default Topics:**
- Climate Change
- Artificial Intelligence
- Mental Health
- Cryptocurrency
- Space Exploration

## Layout Components

### TopBar (`TopBar.tsx`)

Main navigation header with authentication state management.

```typescript
interface TopBarProps {
  session: Session | null;
}

<TopBar session={session} />
```

**Features:**
- Logo/brand display
- User authentication status
- User dropdown menu with avatar
- Sign-in/sign-out functionality
- Responsive design

**User Menu Items:**
- User name and email display
- Logout functionality
- Future: Settings, feedback options

### Footer (`Footer.tsx`)

Site footer with branding and links.

```typescript
<Footer />
```

**Features:**
- Large brand display
- Social media links (GitHub, Twitter)
- Responsive typography
- Gradient background

## Component Patterns

### Authentication-Aware Components

Many components adapt based on authentication state:

```typescript
// TopBar shows different content based on session
const showLoginOrUserButton = () => {
  if (session) {
    return <UserDropdown session={session} />;
  } else {
    return <LoginButton />;
  }
};
```

### Error Handling Pattern

Components implement consistent error handling:

```typescript
const [error, setError] = useState<string | null>(null);

const handleError = (errorMessage: string) => {
  setError(errorMessage);
};

const dismissError = () => {
  setError(null);
};

// Error display
{error && (
  <div className="bg-red-50 border border-red-200 text-destructive p-2">
    <span>{error}</span>
    <Button onClick={dismissError}>×</Button>
  </div>
)}
```

### Loading States

Components show loading states during async operations:

```typescript
const [isLoading, setIsLoading] = useState(false);

// In GoogleSignInButton
{isLoading ? (
  <>
    <div className="animate-spin rounded-full h-4 w-4 border-2" />
    <span>Signing in with Google...</span>
  </>
) : (
  <>
    <GoogleIcon />
    <span>Sign in with Google</span>
  </>
)}
```

## Styling Conventions

### Tailwind Classes

Components use consistent Tailwind CSS patterns:

```typescript
// Gradient text effect
const gradientTextClass = "text-transparent bg-clip-text bg-gradient-to-br from-teal-600 to-teal-400";

// Hover animations
className="hover:scale-[1.1] transition-all cursor-pointer"

// Responsive typography
className="text-4xl/normal md:text-5xl/normal xl:text-6xl/normal font-light"
```

### Component Variants

Using Class Variance Authority (CVA) for component variants:

```typescript
import { cva } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        lg: "h-11 rounded-md px-8",
      },
    },
  }
);
```

## Accessibility

Components follow accessibility best practices:

- Semantic HTML elements
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Focus management

```typescript
// Error message with proper ARIA role
<div role="alert" className="error-message">
  {error}
</div>

// Button with accessible label
<Button aria-label="Close error message" onClick={dismissError}>
  ×
</Button>
```

## Performance Considerations

- Components use React.memo() where appropriate
- Lazy loading for heavy components
- Optimized re-renders with proper dependency arrays
- Image optimization with Next.js Image component

## Testing Patterns

Components are designed to be testable:

- Props-based configuration
- Callback functions for interactions
- Predictable state management
- Separation of concerns