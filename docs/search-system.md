# Search System Documentation

This document provides comprehensive information about WSIC's advanced search system, which combines traditional text search with semantic vector search for optimal content discovery.

## Overview

WSIC implements a sophisticated dual-search architecture that provides users with both exact matches and semantically similar content. When users search for topics, the system:

1. **Performs immediate text search** for exact matches
2. **Executes semantic vector search** for related content
3. **Categorizes results** by relevance score
4. **Offers topic generation** when no relevant content exists

## Search Architecture

### Dual Search Strategy

The search system employs two complementary approaches:

#### 1. Simple Text Search (`convex/search.ts`)
- **Purpose**: Fast exact matching on titles, descriptions, and tags
- **Implementation**: String-based filtering with case-insensitive matching
- **Performance**: Immediate results with minimal latency
- **Use Case**: Direct topic name searches and keyword matching

#### 2. Vector Semantic Search (`convex/embeddings.ts`)
- **Purpose**: Contextual understanding and semantic similarity
- **Implementation**: Google Gemini embeddings with cosine similarity
- **Performance**: ~500ms latency for embedding generation and search
- **Use Case**: Conceptual searches and related topic discovery

### Search Flow

```mermaid
graph TD
    A[User Search Query] --> B[Simple Text Search]
    A --> C[Vector Semantic Search]
    B --> D[Exact Matches]
    C --> E[Generate Embedding]
    E --> F[Vector Search]
    F --> G[Similar Topics with Scores]
    D --> H[Combine Results]
    G --> H
    H --> I{Results Found?}
    I -->|Yes| J[Display Results]
    I -->|No| K[Show Topic Generation]
    K --> L[/api/queue-topic-request]
    L --> M[QStash Messaging Queue]
    M --> N[generator_api - Render]
    N --> O[Google Cloud Run - AI Agents]
    O --> P[Display Brewing Status]
    
    style L fill:#e1f5fe
    style M fill:#f3e5f5
    style N fill:#e8f5e8
    style O fill:#fff3e0
```

**Topic Generation Infrastructure:**

When no relevant content is found, the system triggers topic generation through:

1. **API Route** (`/api/queue-topic-request`): Queues the generation request
2. **QStash**: Reliable message queue with retry logic
3. **Render Workers**: Long-running Flask API service
4. **Google Cloud Run**: Auto-scaling AI agent platform
5. **Real-time Updates**: User receives brewing status and completion notifications

## Implementation Details

### Simple Text Search

**Function**: `simpleSearchTopics`
**Location**: `convex/search.ts`

```typescript
export const simpleSearchTopics = query({
  args: {
    searchTerm: v.string(),
    difficulty: v.optional(v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    
    // Get all published topics
    const allTopics = await ctx.db
      .query("topics")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .collect();

    // Simple text matching
    const searchTerm = args.searchTerm.toLowerCase();
    const matchingTopics = allTopics.filter(topic => 
      topic.title.toLowerCase().includes(searchTerm) ||
      topic.description.toLowerCase().includes(searchTerm) ||
      topic.tagIds.some(tag => tag.toLowerCase().includes(searchTerm))
    );

    // Filter by difficulty if specified
    const filteredTopics = args.difficulty 
      ? matchingTopics.filter(topic => topic.difficulty === args.difficulty)
      : matchingTopics;

    return filteredTopics.slice(0, limit);
  },
});
```

**Features:**
- Case-insensitive string matching
- Searches title, description, and tags
- Difficulty filtering
- Pagination support
- Immediate results

### Vector Semantic Search

**Function**: `searchSimilarTopicsByTerm`
**Location**: `convex/embeddings.ts`

```typescript
export const searchSimilarTopicsByTerm = action({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    // 1. Generate embedding for search term
    const embedding = await generateEmbedding(args.searchTerm);
    if (!embedding) return [];

    // 2. Perform vector search
    const vectorResults = await ctx.vectorSearch("embeddings", "by_embedding", {
      vector: embedding,
    });

    // 3. Get topic data with similarity scores
    const similarTopics = await ctx.runQuery(
      internal.embeddings.getTopicsByEmbeddingIdsInternal,
      {
        embeddingResults: vectorResults.map((r) => ({
          embeddingId: r._id,
          score: r._score,
        })),
      }
    );

    return similarTopics
      .filter((topic) => topic.score !== undefined)
      .slice(0, limit);
  },
});
```

**Features:**
- Google Gemini embedding generation
- 768-dimensional vector search
- Cosine similarity scoring
- Semantic understanding
- Contextual relevance

### Embedding Generation

**Function**: `generateEmbedding`
**Location**: `convex/embeddings.ts`

```typescript
async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GOOGLE_API_KEY
    });

    const response = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: text,
      config: {
        taskType: "SEMANTIC_SIMILARITY",
        outputDimensionality: 768,
      },
    });

    return response.embeddings?.values()?.next().value?.values ?? null;
  } catch (error) {
    console.error("Failed to generate embedding:", error);
    return null;
  }
}
```

**Configuration:**
- **Model**: `gemini-embedding-001`
- **Task Type**: `SEMANTIC_SIMILARITY`
- **Dimensions**: 768
- **Provider**: Google AI

## Search Results Processing

### Result Categorization

The search system categorizes results based on similarity scores:

1. **Exact Matches**: Results from simple text search
2. **High-Score Similar Topics**: Vector search results with score > 0.85
3. **Related Topics**: Vector search results with score ≤ 0.85

### Score Interpretation

- **Score > 0.8**: Highly relevant, promoted to "Found Topics"
- **Score 0.6-0.8**: Moderately relevant, shown as "Related Topics"
- **Score < 0.6**: Low relevance, filtered out or shown last

### Result Combination Logic

```typescript
// Combine results in SearchResults component
const highScoreSimilar = similarTopics.filter(topic => topic.score > 0.8);
const lowScoreSimilar = similarTopics.filter(topic => topic.score <= 0.8);

const foundTopics = [
  ...(exactMatches || []),
  ...highScoreSimilar.filter(similarTopic =>
    !(exactMatches || []).some(exactTopic => exactTopic._id === similarTopic._id)
  )
];

const shouldShowResults = foundTopics.length > 0;
```

## Client-Side Integration

### SearchResults Component

**Location**: `components/pages/SearchResults.tsx`

The main search interface implements the dual search strategy:

```typescript
const SearchContent = () => {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const topic = searchParams.get("topic") || "";
  let difficulty = searchParams.get("difficulty") || "beginner";
  const [isBrewing, setIsBrewing] = useState(false);
  const [brewingError, setBrewingError] = useState<string | null>(null);

  // Validate difficulty parameter
  if (!["beginner", "intermediate", "advanced"].includes(difficulty)) {
    difficulty = "beginner";
  }

  // Text search for exact matches
  const exactMatches = useQuery(
    api.search.simpleSearchTopics,
    topic ? {
      searchTerm: topic,
      difficulty: difficulty as "beginner" | "intermediate" | "advanced",
      limit: 10,
    } : "skip"
  );

  // Vector search for similar topics using the search term directly
  const [similarTopics, setSimilarTopics] = useState<SimilarTopicsType[]>([]);
  const [vectorLoading, setVectorLoading] = useState(false);
  const searchSimilarTopics = useAction(api.embeddings.searchSimilarTopicsByTerm);

  useEffect(() => {
    const fetchSimilarTopics = async () => {
      if (!topic) return;

      try {
        setVectorLoading(true);
        const results = await searchSimilarTopics({
          searchTerm: topic,
          limit: 10,
        });
        setSimilarTopics(results);
      } catch (err) {
        console.error("Vector search failed:", err);
        setSimilarTopics([]);
      } finally {
        setVectorLoading(false);
      }
    };

    fetchSimilarTopics();
  }, [topic, difficulty, searchSimilarTopics]);

  // Topic generation for missing content
  const startBrewingTopic = async () => {
    setBrewingError(null);

    try {
      if (session?.user) {
        const response = await fetch("/api/queue-topic-request", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topic: topic,
            difficulty: difficulty,
            user_id: session.user.id
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Topic request queued:", data);
        setIsBrewing(true);
      } else {
        throw new Error("User not authenticated");
      }
    } catch (error) {
      console.error("Error queuing topic request:", error);
      setBrewingError("Failed to start brewing topic");
    }
  };
};
```

### Search States

The search interface handles multiple states:

1. **Loading**: Shows spinner during search operations
2. **Results Found**: Displays categorized search results
3. **No Results**: Shows topic generation interface
4. **Brewing**: Displays generation progress
5. **Error**: Shows error message with retry options

## Topic Generation Integration

### Fallback Generation

When no relevant content is found, the system offers topic generation:

```typescript
const startBrewingTopic = async () => {
  try {
    const response = await fetch("/api/queue-topic-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: topic,
        difficulty: difficulty,
        user_id: session.user.id
      })
    });

    if (response.ok) {
      setIsBrewing(true);
    }
  } catch (error) {
    setBrewingError("Failed to start brewing topic");
  }
};
```

### Generation Flow

1. **User searches** for non-existent topic
2. **No results found** in either search method
3. **"Brew Your Topic" interface** appears
4. **User clicks** "Start Brewing Topic"
5. **Request queued** via QStash to generation API
6. **Status updates** shown to user
7. **Completion notification** when topic is ready

## Performance Considerations

### Search Optimization

1. **Parallel Execution**: Text and vector searches run simultaneously
2. **Caching**: Convex provides automatic query caching
3. **Debouncing**: Vector search is debounced to reduce API calls
4. **Pagination**: Results are limited to prevent performance issues

### Embedding Management

1. **Batch Generation**: Embeddings created during topic generation
2. **Storage Optimization**: 768-dimensional vectors stored efficiently
3. **Index Optimization**: Vector index configured for fast similarity search
4. **Cleanup**: Orphaned embeddings removed during topic deletion

## Error Handling

### Search Errors

```typescript
// Text search error handling
if (exactMatches === undefined) {
  // Show loading state
}

// Vector search error handling
try {
  const results = await searchSimilarTopics({ searchTerm: topic });
  setSimilarTopics(results);
} catch (err) {
  console.error("Vector search failed:", err);
  setSimilarTopics([]); // Graceful degradation
}
```

### Embedding Errors

```typescript
async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    // Embedding generation logic
  } catch (error) {
    console.error("Failed to generate embedding:", error);
    return null; // Graceful failure
  }
}
```

## Configuration

### Environment Variables

```bash
# Google AI API key for embeddings
GOOGLE_API_KEY=your_google_ai_api_key

# Convex deployment URL
CONVEX_URL=your_convex_deployment_url

# QStash token for topic generation
QSTASH_TOKEN=your_qstash_token

# Topic generation service URL
TOPIC_GENERATOR_RENDER_URL=your_generation_service_url
```

### Vector Index Configuration

```typescript
// In convex/schema.ts
embeddings: defineTable({
  topicId: v.id("topics"),
  embedding: v.array(v.float64()),
  contentType: v.union(/* ... */),
  difficulty: v.union(/* ... */),
  categoryId: v.optional(v.id("categories")),
})
.vectorIndex("by_embedding", {
  vectorField: "embedding",
  dimensions: 768, // Google Gemini embedding size
  filterFields: ["difficulty", "categoryId", "contentType"],
});
```

## Future Enhancements

### Planned Improvements

1. **Hybrid Scoring**: Combine text and vector search scores
2. **User Personalization**: Personalized search results based on history
3. **Search Analytics**: Track search patterns and improve algorithms
4. **Multi-language Support**: Embeddings for multiple languages
5. **Real-time Indexing**: Immediate embedding generation for new content

### Performance Optimizations

1. **Embedding Caching**: Cache frequently searched embeddings
2. **Incremental Updates**: Update embeddings only when content changes
3. **Search Result Caching**: Cache popular search results
4. **Batch Processing**: Batch embedding generation for efficiency

## Monitoring and Analytics

### Search Metrics

- Search query frequency and patterns
- Result click-through rates
- Topic generation request rates
- Search performance and latency
- Embedding generation success rates

### Error Monitoring

- Failed embedding generations
- Vector search timeouts
- API rate limit exceeded
- Search result quality issues

This search system provides WSIC users with a powerful and intuitive way to discover educational content, combining the precision of text search with the intelligence of semantic understanding.