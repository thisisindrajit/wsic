# Hooks Reference

This document provides comprehensive information about the custom React hooks used in the WSIC application.

## Overview

WSIC uses custom hooks to encapsulate data fetching, state management, and user interactions. These hooks integrate with Convex for real-time data synchronization and React Query for caching and performance optimization.

## Data Fetching Hooks

### useTrendingTopics

**Location**: `hooks/useTrendingTopics.ts`

Hook for fetching trending topics with automatic caching and background updates.

```typescript
import { useTrendingTopics, useTrendingUpdate } from "@/hooks/useTrendingTopics";

function TrendingSection() {
  const { data: trendingTopics, isLoading, isError } = useTrendingTopics({
    categoryId: undefined,
    limit: 5
  });
  
  const { updateTrending } = useTrendingUpdate();

  if (isLoading) return <div>Loading trending topics...</div>;
  if (isError) return <div>Error loading trending topics</div>;

  return (
    <div>
      {trendingTopics?.map(topic => (
        <Block key={topic._id} {...topic} />
      ))}
      <button onClick={updateTrending}>Refresh Trending</button>
    </div>
  );
}
```

**Parameters:**
- `categoryId?: Id<"categories">` - Optional category filter
- `limit?: number` - Number of topics to fetch (default: 5)

**Returns:**
- `data` - Array of trending topics with calculated trending scores
- `isLoading` - Loading state boolean
- `isError` - Error state boolean
- `error` - Error object if request failed

**Features:**
- **React Query Integration**: Automatic caching with 2-minute stale time
- **Background Updates**: Refetches data when window regains focus (disabled)
- **Garbage Collection**: 10-minute cache retention
- **Error Handling**: Graceful error states with toast notifications
- **Manual Updates**: `useTrendingUpdate` hook for triggering algorithm recalculation

**Trending Algorithm:**
The hook fetches topics with calculated trending scores based on:
- **Age Factor**: Newer topics get a boost (30-day decay)
- **Engagement Metrics**: Views (1x), likes (5x), shares (10x)
- **Formula**: `(viewCount * 1 + likeCount * 5 + shareCount * 10) * ageFactor`

### useTopic

**Location**: `hooks/useTopic.ts`

Hook for fetching individual topic data with blocks and category information.

```typescript
import { useTopic } from "@/hooks/useTopic";

function TopicPage({ topicId }: { topicId: Id<"topics"> }) {
  const { data: topicData, isLoading, isError } = useTopic(topicId);

  if (isLoading) return <div>Loading topic...</div>;
  if (isError || !topicData) return <div>Topic not found</div>;

  const { topic, blocks, category } = topicData;

  return (
    <div>
      <h1>{topic.title}</h1>
      <p>{topic.description}</p>
      {category && <span>Category: {category.name}</span>}
      
      {blocks.map(block => (
        <div key={block._id}>
          {/* Render block content based on type */}
        </div>
      ))}
    </div>
  );
}
```

**Parameters:**
- `topicId: Id<"topics">` - Topic ID to fetch

**Returns:**
- `data` - Object containing topic, blocks, and category data
- `isLoading` - Loading state boolean
- `isError` - Error state boolean

**Data Structure:**
```typescript
{
  topic: {
    _id: Id<"topics">;
    title: string;
    description: string;
    slug: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    estimatedReadTime: number;
    viewCount: number;
    likeCount: number;
    shareCount: number;
    // ... other topic fields
  };
  blocks: Array<{
    _id: Id<"blocks">;
    type: "information" | "activity";
    content: BlockContent;
    order: number;
  }>;
  category: {
    _id: Id<"categories">;
    name: string;
    slug: string;
    description?: string;
    // ... other category fields
  } | null;
}
```

### useTopics

**Location**: `hooks/useTopics.ts`

Hook for fetching paginated topics with filtering options.

```typescript
import { useTopics } from "@/hooks/useTopics";

function TopicsList() {
  const { 
    data: topicsPage, 
    isLoading, 
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useTopics({
    categoryId: undefined,
    difficulty: "beginner",
    limit: 20
  });

  return (
    <div>
      {topicsPage?.pages.map(page => 
        page.page.map(topic => (
          <Block key={topic._id} {...topic} />
        ))
      )}
      
      {hasNextPage && (
        <button 
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

**Parameters:**
- `categoryId?: Id<"categories">` - Optional category filter
- `difficulty?: "beginner" | "intermediate" | "advanced"` - Optional difficulty filter
- `limit?: number` - Topics per page (default: 20)

**Returns:**
- `data` - Paginated topics data
- `fetchNextPage` - Function to load next page
- `hasNextPage` - Boolean indicating if more pages available
- `isFetchingNextPage` - Loading state for pagination

### useUserTopics

**Location**: `hooks/useUserTopics.ts`

Hook for fetching user-specific topics (saved, liked, created).

```typescript
import { useUserTopics } from "@/hooks/useUserTopics";

function UserDashboard({ userId }: { userId: string }) {
  const { data: savedTopics } = useUserTopics(userId, "saved");
  const { data: likedTopics } = useUserTopics(userId, "liked");
  const { data: createdTopics } = useUserTopics(userId, "created");

  return (
    <div>
      <section>
        <h2>Saved Topics</h2>
        {savedTopics?.map(topic => (
          <Block key={topic._id} {...topic} />
        ))}
      </section>
      
      <section>
        <h2>Liked Topics</h2>
        {likedTopics?.map(topic => (
          <Block key={topic._id} {...topic} />
        ))}
      </section>
    </div>
  );
}
```

**Parameters:**
- `userId: string` - Better Auth user ID
- `type: "saved" | "liked" | "created"` - Type of user topics to fetch

## Interaction Hooks

### useTopicInteractions

**Location**: `hooks/useTopicInteractions.ts`

Hook for managing user interactions with topics (like, save, share).

```typescript
import { useTopicInteractions } from "@/hooks/useTopicInteractions";

function InteractiveBlock({ topicId }: { topicId: Id<"topics"> }) {
  const { interactions, handleLike, handleSave, handleShare } = useTopicInteractions(topicId);

  const onLike = async () => {
    const result = await handleLike();
    if (result) {
      console.log(`New like count: ${result.newCount}`);
    }
  };

  const onSave = async () => {
    const result = await handleSave();
    if (result) {
      console.log(`Topic ${result.saved ? 'saved' : 'unsaved'}`);
    }
  };

  const onShare = async (platform: string) => {
    const result = await handleShare(platform);
    if (result) {
      console.log(`New share count: ${result.newCount}`);
    }
  };

  return (
    <div>
      <button 
        onClick={onLike}
        className={interactions?.hasLiked ? "liked" : ""}
      >
        {interactions?.hasLiked ? "❤️" : "🤍"} Like
      </button>
      
      <button 
        onClick={onSave}
        className={interactions?.hasSaved ? "saved" : ""}
      >
        {interactions?.hasSaved ? "📌" : "📍"} Save
      </button>
      
      <button onClick={() => onShare("twitter")}>
        Share on Twitter
      </button>
    </div>
  );
}
```

**Parameters:**
- `topicId: Id<"topics">` - Topic ID for interactions

**Returns:**
- `interactions` - Current user interaction state
- `handleLike` - Function to toggle like status
- `handleSave` - Function to toggle save status
- `handleShare` - Function to record share interaction

**Interaction State:**
```typescript
{
  hasLiked: boolean;
  hasSaved: boolean;
  hasShared: boolean;
  lastInteraction?: Date;
}
```

**Return Values:**
```typescript
// handleLike return
{
  success: boolean;
  newCount: number;
  liked: boolean;
}

// handleSave return
{
  success: boolean;
  saved: boolean;
}

// handleShare return
{
  success: boolean;
  newCount: number;
  platform: string;
}
```

**Features:**
- **Optimistic Updates**: Immediate UI feedback before server confirmation
- **Error Recovery**: Automatic retry on failure with rollback
- **Authentication Handling**: Graceful handling of unauthenticated users
- **Real-time Sync**: Updates reflect across all components immediately
- **Platform Tracking**: Records which platform was used for sharing

## UI Hooks

### useTopBarVisibility

**Location**: `hooks/useTopBarVisibility.ts`

Hook for managing TopBar visibility based on scroll position.

```typescript
import { useTopBarVisibility } from "@/hooks/useTopBarVisibility";

function Layout({ children }: { children: React.ReactNode }) {
  const isTopBarVisible = useTopBarVisibility();

  return (
    <div>
      <div 
        className={`fixed top-0 w-full transition-transform ${
          isTopBarVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <TopBar />
      </div>
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
}
```

**Returns:**
- `boolean` - Whether TopBar should be visible

**Features:**
- **Scroll Detection**: Monitors scroll direction and position
- **Threshold-based**: Uses configurable scroll threshold from constants
- **Performance Optimized**: Debounced scroll events
- **Smooth Transitions**: Works with CSS transitions for smooth show/hide

**Configuration:**
```typescript
// constants/common.ts
export const TOPBAR_SCROLL_THRESHOLD = 100; // pixels
```

## Hook Patterns

### Error Handling

All hooks implement consistent error handling:

```typescript
const { data, isLoading, isError, error } = useCustomHook();

if (isLoading) return <LoadingSpinner />;
if (isError) return <ErrorMessage error={error} />;
if (!data) return <EmptyState />;

return <DataComponent data={data} />;
```

### Optimistic Updates

Interaction hooks use optimistic updates for better UX:

```typescript
const handleAction = async () => {
  // 1. Update UI immediately
  setLocalState(newState);
  
  try {
    // 2. Send request to server
    const result = await serverAction();
    
    // 3. Update with server response
    setLocalState(result);
  } catch (error) {
    // 4. Rollback on error
    setLocalState(previousState);
    showErrorToast(error);
  }
};
```

### Caching Strategy

Data fetching hooks use React Query for intelligent caching:

```typescript
const query = useQuery({
  queryKey: ["resource", id, filters],
  queryFn: () => fetchResource(id, filters),
  staleTime: 1000 * 60 * 2, // 2 minutes
  gcTime: 1000 * 60 * 10,   // 10 minutes
  refetchOnWindowFocus: false,
});
```

### Real-time Updates

Hooks integrate with Convex for real-time data synchronization:

```typescript
// Convex queries automatically update when data changes
const topics = useQuery(api.topics.getTrendingTopics, { limit: 10 });

// No manual refetching needed - updates happen automatically
```

## Performance Considerations

### Memoization

Hooks use proper dependency arrays and memoization:

```typescript
const memoizedCallback = useCallback((id: string) => {
  return performAction(id);
}, [dependency]);

const memoizedValue = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);
```

### Debouncing

UI hooks implement debouncing for performance:

```typescript
const debouncedScrollHandler = useMemo(
  () => debounce(handleScroll, 100),
  []
);
```

### Conditional Fetching

Data hooks support conditional fetching:

```typescript
const { data } = useQuery(
  api.topics.getById,
  topicId ? { topicId } : "skip"
);
```

This hooks architecture provides a clean separation of concerns, excellent performance, and a great developer experience while maintaining real-time data synchronization throughout the application.