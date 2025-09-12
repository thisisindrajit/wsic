import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Hook for paginated topics with filters using Convex's native usePaginatedQuery
export function useTopics({
  categoryId,
  difficulty,
  pageSize = 6,
  enabled = true,
}: {
  categoryId?: Id<"categories">;
  difficulty?: "beginner" | "intermediate" | "advanced";
  pageSize?: number;
  enabled?: boolean;
} = {}) {
  const paginatedResult = usePaginatedQuery(
    api.topics.getTopics,
    enabled ? { categoryId, difficulty } : "skip",
    { initialNumItems: pageSize }
  );

  return {
    data: paginatedResult.results,
    isLoading: paginatedResult.status === "LoadingFirstPage",
    isError: false, // Convex handles errors internally
    hasNextPage:
      paginatedResult.status === "CanLoadMore" ||
      paginatedResult.status === "LoadingMore",
    fetchNextPage: () => paginatedResult.loadMore(pageSize),
    isFetchingNextPage: paginatedResult.status === "LoadingMore",
  };
}

// Hook for trending topics
export function useTrendingTopics({
  categoryId,
  limit = 10,
  enabled = true,
}: {
  categoryId?: Id<"categories">;
  limit?: number;
  enabled?: boolean;
} = {}) {
  const data = useQuery(
    api.topics.getTrendingTopics,
    enabled ? { categoryId, limit } : "skip"
  );

  return {
    data,
    isLoading: data === undefined,
    isError: false, // Convex handles errors internally
  };
}

// Hook for searching topics
export function useSearchTopics({
  searchTerm,
  categoryId,
  difficulty,
  limit = 20,
  enabled = true,
}: {
  searchTerm: string;
  categoryId?: Id<"categories">;
  difficulty?: "beginner" | "intermediate" | "advanced";
  limit?: number;
  enabled?: boolean;
}) {
  const data = useQuery(
    api.topics.searchTopics,
    enabled && searchTerm.length > 0
      ? { searchTerm, categoryId, difficulty, limit }
      : "skip"
  );

  return {
    data,
    isLoading: data === undefined,
    isError: false, // Convex handles errors internally
  };
}

// Hook for categories
export function useCategories({
  enabled = true,
}: {
  enabled?: boolean;
} = {}) {
  const data = useQuery(api.categories.getCategories, enabled ? {} : "skip");

  return {
    data,
    isLoading: data === undefined,
    isError: false, // Convex handles errors internally
  };
}
