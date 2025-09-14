import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/lib/auth-client";

// Hook for user's created topics with pagination using Convex's native usePaginatedQuery
export function useUserTopics({
  pageSize = 6,
  enabled = true,
}: {
  pageSize?: number;
  enabled?: boolean;
} = {}) {
  const { data: session } = useSession();
  
  const paginatedResult = usePaginatedQuery(
    api.users.getUserTopics,
    session?.user?.id && enabled ? { userId: session.user.id } : "skip",
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

// Hook for user's saved topics with pagination using Convex's native usePaginatedQuery
export function useSavedTopics({
  pageSize = 6,
  enabled = true,
}: {
  pageSize?: number;
  enabled?: boolean;
} = {}) {
  const { data: session } = useSession();
  
  const paginatedResult = usePaginatedQuery(
    api.users.getSavedTopics,
    session?.user?.id && enabled ? { userId: session.user.id } : "skip",
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