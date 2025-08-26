# Components Structure

This folder contains all reusable UI components organized by functionality and usage patterns.

## Folder Structure

### `/ui` - Base UI Primitives
Contains low-level, reusable UI components built with Radix UI and styled with Tailwind CSS.
- `avatar.tsx` - User avatar component
- `button.tsx` - Button component with variants
- `dropdown-menu.tsx` - Dropdown menu primitives
- `input.tsx` - Input field component
- `separator.tsx` - Visual separator component

### `/layout` - Layout Components
Components that define the overall page structure and layout.
- `TopBar.tsx` - Main navigation header
- `Footer.tsx` - Site footer

### `/navigation` - Navigation Components
Components specifically for navigation and routing.
- `NavigationSidebar.tsx` - Desktop sidebar navigation
- `MobileBottomNavigation.tsx` - Mobile bottom navigation

### `/content` - Content Components
Components that display and manage content.
- `Block.tsx` - Content block display component
- `TrendingTopics.tsx` - Trending topics display
- `SuggestedTopics.tsx` - Topic suggestions component

### `/features` - Feature-Specific Components
Components that implement specific application features.
- `TopicSearch.tsx` - Topic search functionality
- `SubscriptionCard.tsx` - Subscription management card

### `/auth` - Authentication Components
Components related to user authentication and authorization.
- `GoogleSignInButton.tsx` - Google OAuth sign-in button

## Import Patterns

### Direct Imports (Recommended)
```typescript
import { TopBar } from '@/components/layout/TopBar';
import { Block } from '@/components/content/Block';
import { Button } from '@/components/ui/button';
```

### Barrel Imports (Alternative)
```typescript
import { TopBar, Footer } from '@/components/layout';
import { Block, TrendingTopics } from '@/components/content';
```

### Main Barrel Import (For Multiple Categories)
```typescript
import { TopBar, Block, Button } from '@/components';
```

## Guidelines

1. **Single Responsibility**: Each component should have a single, well-defined purpose
2. **Reusability**: Components should be designed for reuse across different parts of the application
3. **Proper Categorization**: Place components in the folder that best matches their primary function
4. **Export Consistency**: Always export components as both named and default exports where appropriate
5. **Documentation**: Include JSDoc comments for complex components

## Adding New Components

When adding new components:
1. Determine the appropriate category based on the component's primary function
2. Create the component file in the correct subfolder
3. Add the export to the subfolder's `index.ts` file
4. Update the main `components/index.ts` if needed
5. Follow existing naming conventions (PascalCase for files and components)