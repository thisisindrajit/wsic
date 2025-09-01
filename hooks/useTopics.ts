import { useConvexInfiniteQuery } from "./useConvexInfiniteQuery";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Hook for all topics (no filters)
export function useAllTopics({
  pageSize = 6,
  enabled = true,
}: {
  pageSize?: number;
  enabled?: boolean;
} = {}) {
  return useConvexInfiniteQuery({
    queryKey: ["topics", "all"],
    queryFn: api.topics.getTopics,
    args: {
      categoryId: undefined,
      difficulty: undefined,
    },
    pageSize,
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook for topics by category
export function useTopicsByCategory({
  categoryId,
  pageSize = 6,
  enabled = true,
}: {
  categoryId: Id<"categories">;
  pageSize?: number;
  enabled?: boolean;
}) {
  return useConvexInfiniteQuery({
    queryKey: ["topics", "category", categoryId],
    queryFn: api.topics.getTopics,
    args: {
      categoryId,
      difficulty: undefined,
    },
    pageSize,
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook for topics by difficulty
export function useTopicsByDifficulty({
  difficulty,
  pageSize = 6,
  enabled = true,
}: {
  difficulty: "beginner" | "intermediate" | "advanced";
  pageSize?: number;
  enabled?: boolean;
}) {
  return useConvexInfiniteQuery({
    queryKey: ["topics", "difficulty", difficulty],
    queryFn: api.topics.getTopics,
    args: {
      categoryId: undefined,
      difficulty,
    },
    pageSize,
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook for topics by both category and difficulty
export function useTopicsByCategoryAndDifficulty({
  categoryId,
  difficulty,
  pageSize = 6,
  enabled = true,
}: {
  categoryId: Id<"categories">;
  difficulty: "beginner" | "intermediate" | "advanced";
  pageSize?: number;
  enabled?: boolean;
}) {
  return useConvexInfiniteQuery({
    queryKey: ["topics", "category", categoryId, "difficulty", difficulty],
    queryFn: api.topics.getTopics,
    args: {
      categoryId,
      difficulty,
    },
    pageSize,
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Main hook that determines which specific hook to use based on provided parameters
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
  if (categoryId && difficulty) {
    return useTopicsByCategoryAndDifficulty({
      categoryId,
      difficulty,
      pageSize,
      enabled,
    });
  } else if (categoryId) {
    return useTopicsByCategory({ categoryId, pageSize, enabled });
  } else if (difficulty) {
    return useTopicsByDifficulty({ difficulty, pageSize, enabled });
  } else {
    return useAllTopics({ pageSize, enabled });
  }
}
