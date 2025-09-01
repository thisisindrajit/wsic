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

### TopicSearch (`TopicSearch.tsx`)

Main search component for topic exploration with "Why Should I Care about" branding.

```typescript
interface TopicSearchProps {
  onSearch?: (topic: string) => void;
  className?: string;
}

<TopicSearch 
  onSearch={(topic) => console.log('Searching for:', topic)}
  className="custom-class"
/>
```

**Features:**
- Branded "Why Should I Care about" heading with gradient text effects
- Large, responsive input field with custom styling
- Submit button with arrow icon and loading states
- Form validation (prevents empty submissions)
- Integrated suggested topics component
- Async search handling with error management
- Responsive design for mobile and desktop
- Touch-optimized interactions
- Auto-capitalization and spell-check enabled

**Styling Details:**
- Gradient text effects on key letters (W, S, I, C)
- Borderless input with bottom border focus states
- Teal color scheme matching app branding
- Responsive typography scaling (4xl → 5xl → 6xl)
- Custom focus states with teal accent colors
- Disabled states with opacity and cursor changes

**Form Behavior:**
- Prevents submission of empty/whitespace-only searches
- Shows loading state during async operations
- Calls onSearch callback with trimmed topic string
- Integrates with SuggestedTopics for quick topic selection
- Supports both form submission and suggested topic clicks

**Implementation Notes:**
- The `onSearch` callback is currently synchronous but wrapped in async/await for future API integration
- TypeScript may show a hint about `await` having no effect - this is intentional for forward compatibility
- Error handling is implemented for future async search operations

### Notification (`Notification.tsx`)

Real-time notification system with dropdown interface and Convex integration.

```typescript
interface NotificationButtonProps {
  userId: string | undefined;
}

<Notification userId={session?.user?.id} />
```

**Features:**
- Real-time notification updates via Convex
- Unread notification count badge
- Dropdown interface with notification list
- Mark individual notifications as read
- Mark all notifications as read
- Time-based notification formatting ("2h ago", "Just now")
- Automatic filtering of expired notifications
- Responsive design with mobile optimization

**Convex Integration:**
- Uses `useQuery` for real-time notification fetching
- Uses `useMutation` for marking notifications as read
- Automatically updates when new notifications arrive
- Handles notification expiration and archiving

**Notification Display:**
- Shows title, message, and timestamp
- Visual indicator for unread notifications (blue dot)
- Truncated content with line clamping
- Smooth animations and hover effects
- Error handling with toast notifications

### ThemeToggle (`ThemeToggle.tsx`)

Theme switching component with system preference support.

```typescript
<ThemeToggle />
```

**Features:**
- Light, dark, and system theme options
- Animated icon transitions
- Dropdown menu interface
- Persistent theme selection
- System preference detection
- Smooth theme transitions

**Theme Integration:**
- Uses `next-themes` for theme management
- Integrates with `MetaThemeAndBgColor` for browser UI theming
- Supports CSS custom properties for theme colors
- Maintains theme state across page reloads

### MetaThemeAndBgColor (`MetaThemeAndBgColor.tsx`)

Dynamic meta tag management for browser UI theming.

```typescript
<MetaThemeAndBgColor />
```

**Features:**
- Dynamic theme-color meta tag updates
- Background-color meta tag management
- Responsive to theme changes
- Browser UI color synchronization
- Mobile browser address bar theming

**Implementation:**
- Uses `useLayoutEffect` for immediate DOM updates
- Removes existing meta tags before adding new ones
- Converts theme colors to hex values for browser compatibility
- Supports both light and dark theme colors

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

Component displaying suggested search topics as interactive buttons with click handling.

```typescript
interface SuggestedTopicsProps {
  topics: string[];
  onTopicClick?: (topic: string) => void;
}

<SuggestedTopics 
  topics={["Climate Change", "AI", "Mental Health"]}
  onTopicClick={(topic) => handleTopicSelection(topic)}
/>
```

**Features:**
- Customizable topic list via props
- Click handler for topic selection
- Interactive button styling with hover effects
- Responsive flexbox layout with wrapping
- Scale animation on hover
- Teal accent color on hover
- Rounded pill design
- Integration with TopicSearch component

**Usage in TopicSearch:**
- Automatically populates search input when topic is clicked
- Triggers search callback immediately on topic selection
- Provides quick access to popular topics
- Enhances user experience with suggested content

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

## Page Implementations

### Home Page (`/app/page.tsx` & `components/pages/Home.tsx`)

The landing page implementation with search interface and trending content.

```typescript
const Home = () => {
  const [searchTopic, setSearchTopic] = useState('');
  const gradientTextClass = "text-transparent bg-clip-text bg-gradient-to-br from-teal-600 to-teal-400";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTopic = searchTopic.trim();
    if (!trimmedTopic) return;
    // Handle search logic here
    console.log('Searching for:', trimmedTopic);
  };

  return (
    <>
      {/* Main search interface */}
      <div className="flex flex-col items-center justify-center flex-1 py-12 min-h-[calc(100dvh-5rem)] relative">
        <div className="flex flex-col sm:max-w-[90%] lg:max-w-[80%] xl:max-w-[70%] pb-24">
          <div className="text-4xl/normal md:text-5xl/normal xl:text-6xl/normal font-light">
            <span className={gradientTextClass}>W</span>hy <span className={gradientTextClass}>S</span>hould <span className={gradientTextClass}>I</span> <span className={gradientTextClass}>C</span>are about
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row items-stretch gap-4">
            <Input
              type="text"
              placeholder="type in any topic..."
              value={searchTopic}
              onChange={(e) => setSearchTopic(e.target.value)}
              className="dark:bg-background h-auto border-x-0 border-t-0 border-foreground text-4xl/normal md:text-5xl/normal xl:text-6xl/normal font-light p-0 pb-2 focus-visible:ring-none focus-visible:ring-[0px] focus-visible:border-teal-500 focus-visible:text-teal-500 transition-all"
              maxLength={256}
              autoComplete="off"
              autoCapitalize="words"
              spellCheck="true"
            />
            <Button
              type="submit"
              disabled={!searchTopic.trim()}
              className="bg-teal-500 flex items-center justify-center self-end md:self-auto h-14 md:h-auto mr-0 w-14 md:w-20 xl:w-24 text-background hover:bg-teal-500/90 transition-all cursor-pointer border border-teal-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-teal-500"
            >
              <ArrowRight className="size-6 md:size-8 xl:size-10" />
            </Button>
          </form>
          <div className="mt-4 md:mt-10 text-lg font-light flex flex-col gap-3">
            <div>Suggested topics</div>
            <SuggestedTopics onTopicClick={handleSuggestedTopicClick} />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="hidden md:flex absolute bottom-8 left-1/2 transform -translate-x-1/2 items-center gap-2 animate-bounce cursor-pointer text-neutral-500">
          <Mouse className="size-5" />
          <span className="text-sm font-medium">Trending topics</span>
        </div>
      </div>
      
      {/* Trending Topics Grid */}
      <div id="trending-topics" className="flex flex-col gap-4">
        <div className="text-2xl/normal font-medium">
          <span className="font-light uppercase">Trending</span> Topics
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 justify-items-center">
          {/* Block components with sample data */}
        </div>
      </div>
    </>
  );
};
```

**Layout Features:**
- Full-height hero section with centered search interface
- Responsive typography scaling (4xl → 5xl → 6xl)
- Gradient text effects on brand letters (W, S, I, C)
- Custom input styling with borderless design and focus states
- Responsive button sizing and positioning
- Smooth scroll indicator with mouse icon
- Grid-based trending topics section

**Interactive Elements:**
- Form validation preventing empty submissions
- Suggested topics integration with click handlers
- Smooth scrolling to trending section
- Responsive design for mobile and desktop
- Touch-optimized interactions

**User Flow:**
- Anonymous users can browse and search
- Search attempts trigger authentication requirement
- Trending topics provide quick exploration options
- Responsive design ensures mobile-first experience

### User Dashboard (`/user/dashboard/page.tsx`)

Protected user dashboard with personalized content and navigation.

```typescript
const UserDashboard = () => {
  const handleSearch = (topic: string) => {
    // TODO: Implement search functionality with Convex
    console.log('Searching for:', topic);
  };

  return (
    <div className="max-w-6xl m-auto pb-24 md:pb-0">
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 md:gap-6">
        {/* Left: Navigation Sidebar (desktop only) */}
        <div className="hidden lg:block lg:col-span-3">
          <NavigationSidebar />
        </div>
        
        {/* Center: Topic Search and Content Blocks */}
        <div className="lg:col-span-5">
          <TopicSearch onSearch={handleSearch} />
          {/* Content blocks and user-specific content */}
        </div>
        
        {/* Right: Subscription and Trending (responsive) */}
        <div className="hidden md:block lg:col-span-4">
          <SubscriptionCard />
          <TrendingTopics />
        </div>
      </div>
    </div>
  );
};
```

**Layout Features:**
- Responsive 12-column grid system
- Mobile-first design with progressive enhancement
- Sticky sidebar navigation on desktop
- Mobile bottom navigation overlay
- Responsive content reorganization for tablet/mobile
- Custom scrollbar styling for sidebar overflow

**Responsive Behavior:**
- **Mobile**: Single column with bottom navigation
- **Tablet**: Two-column layout (center + right sidebar horizontal)
- **Desktop**: Three-column layout with sticky sidebars

**Authentication Integration:**
- Protected route via middleware
- Session-based content personalization
- User-specific notifications and interactions
- Convex integration for real-time updates

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