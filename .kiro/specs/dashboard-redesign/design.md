# Design Document

## Overview

The dashboard redesign transforms the current simple user dashboard into a comprehensive 3-column grid layout that provides easy navigation, topic search functionality, and trending content discovery. The design maintains the application's minimal aesthetic while significantly improving user experience and engagement.

The layout consists of:
- **Left Sidebar**: Navigation menu with key user actions
- **Center Content**: Primary topic search interface with "Why Should I Care" functionality
- **Right Sidebar**: Subscription options and trending content

## Architecture

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│                        TopBar                               │
├──────────┬─────────────────────────────────┬────────────────┤
│          │                                 │                │
│   Left   │           Center                │     Right      │
│ Sidebar  │          Content                │   Sidebar      │
│          │                                 │                │
│ - Home   │  "Why Should I Care about"      │ - Subscribe    │
│ - Explore│   [Input Field] [Go Button]    │   to Premium   │
│ - Saved  │                                 │                │
│ - Courses│   Suggested Topics:             │ - What's       │
│ - Profile│   [Topic Pills]                 │   Happening    │
│          │                                 │   (Trending)   │
└──────────┴─────────────────────────────────┴────────────────┘
│                        Footer                               │
└─────────────────────────────────────────────────────────────┘
```

### Responsive Behavior
- **Desktop (lg+)**: Full 3-column layout with fixed sidebar widths
- **Tablet (md)**: Collapsible left sidebar, center content takes more space
- **Mobile (sm)**: Single column stack with collapsible navigation

## Components and Interfaces

### 1. Dashboard Layout Component
**File**: `app/user/dashboard/page.tsx`

**Props**: None (uses session from auth)

**Structure**:
```typescript
interface DashboardProps {
  // No props - uses server-side session
}
```

### 2. Navigation Sidebar Component
**File**: `components/NavigationSidebar.tsx`

**Props**:
```typescript
interface NavigationSidebarProps {
  currentPath?: string;
  className?: string;
}
```

**Navigation Items**:
- Home (dashboard) - `/user/dashboard`
- Explore - `/explore` 
- Saved - `/user/saved`
- My Courses - `/user/courses`
- Profile - `/user/profile`

### 3. Topic Search Component
**File**: `components/TopicSearch.tsx`

**Props**:
```typescript
interface TopicSearchProps {
  onSearch?: (topic: string) => void;
  className?: string;
}
```

**Features**:
- Large "Why Should I Care about" heading
- Input field with placeholder "type in any topic..."
- Green arrow/go button
- Suggested topics pills below

### 4. Subscription Card Component
**File**: `components/SubscriptionCard.tsx`

**Props**:
```typescript
interface SubscriptionCardProps {
  className?: string;
}
```

### 5. Trending Topics Component
**File**: `components/TrendingTopics.tsx`

**Props**:
```typescript
interface TrendingTopicsProps {
  className?: string;
}

interface TrendingTopic {
  category: string;
  name: string;
  blockCount: string;
  trend: 'trending' | 'rising' | 'stable';
}
```

## Data Models

### Navigation Item
```typescript
interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  isActive?: boolean;
}
```

### Trending Topic
```typescript
interface TrendingTopic {
  id: string;
  category: string;
  name: string;
  blockCount: string;
  trend: 'trending' | 'rising' | 'stable';
}
```

### Suggested Topic
```typescript
interface SuggestedTopic {
  id: string;
  name: string;
  category?: string;
}
```

## Error Handling

### Search Functionality
- **Empty Input**: Disable go button, show validation message
- **Network Errors**: Show toast notification with retry option
- **Authentication Errors**: Redirect to login page

### Navigation
- **Invalid Routes**: Show 404 page or redirect to dashboard
- **Permission Errors**: Show access denied message

### Data Loading
- **Loading States**: Show skeleton components for trending topics
- **Failed Requests**: Show error state with retry button
- **Empty States**: Show appropriate empty state messages

## Testing Strategy

### Unit Tests
1. **Navigation Sidebar**
   - Renders all navigation items correctly
   - Highlights active navigation item
   - Handles click events properly

2. **Topic Search Component**
   - Input field accepts text input
   - Go button triggers search function
   - Suggested topics render and are clickable
   - Form validation works correctly

3. **Subscription Card**
   - Renders subscription information
   - Subscribe button triggers correct action

4. **Trending Topics**
   - Displays trending topics with correct data
   - Handles loading and error states
   - Topic click navigation works

### Integration Tests
1. **Dashboard Layout**
   - All three columns render correctly
   - Responsive behavior works across breakpoints
   - Components communicate properly

2. **Search Flow**
   - Topic search triggers correct API calls
   - Results are displayed appropriately
   - Error handling works end-to-end

### Visual Tests
1. **Layout Consistency**
   - Matches design specifications
   - Maintains minimal aesthetic
   - Proper spacing and typography

2. **Responsive Design**
   - Works across all device sizes
   - Navigation collapses appropriately
   - Content remains accessible

## Styling Guidelines

### Color Scheme
- **Primary Accent**: Teal (`teal-500`, `teal-600`)
- **Background**: System background colors
- **Text**: System foreground colors
- **Borders**: Subtle system border colors

### Typography
- **Headings**: Geist font, appropriate weights
- **Body Text**: Light to normal font weights
- **Interactive Elements**: Medium font weight

### Spacing
- **Grid Gaps**: `gap-6` for main layout
- **Component Padding**: `p-4` to `p-6` standard
- **Element Margins**: `mb-4`, `mt-6` for vertical rhythm

### Interactive States
- **Hover Effects**: Subtle scale and color transitions
- **Focus States**: Teal ring with appropriate opacity
- **Active States**: Slightly darker background/border

## Implementation Notes

### Reusable Patterns
- Leverage existing `SuggestedTopics` component logic
- Use established button and input component variants
- Follow existing responsive design patterns from homepage

### Performance Considerations
- Lazy load trending topics data
- Implement proper loading states
- Use React.memo for static components

### Accessibility
- Proper ARIA labels for navigation
- Keyboard navigation support
- Screen reader friendly structure
- Focus management for interactive elements