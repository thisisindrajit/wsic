import { useQuery } from "@tanstack/react-query";
import { useConvex } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";

export function useTrendingTopics({
  categoryId,
}: {
  categoryId?: Id<"categories">;
} = {}) {
  const convex = useConvex();
  
  return useQuery({
    queryKey: ["trending-topics", categoryId],
    queryFn: async () => {
      // Use a direct database query to avoid validator issues
      const topics = await convex.query("topics:getTopics" as any, {
        categoryId: categoryId || undefined,
        difficulty: undefined,
        paginationOpts: {
          cursor: null,
          numItems: 20, // Get more to filter
        }
      });
      
      // Filter for trending topics and limit to 5
      const trendingTopics = topics.page
        .filter((topic: any) => topic.isTrending)
        .slice(0, 5)
        .map((topic: any) => ({
          _id: topic._id,
          _creationTime: topic._creationTime,
          title: topic.title,
          description: topic.description,
          difficulty: topic.difficulty,
          estimatedReadTime: topic.estimatedReadTime,
          viewCount: topic.viewCount,
          likeCount: topic.likeCount,
          shareCount: topic.shareCount,
          slug: topic.slug,
          categoryId: topic.categoryId,
          tagIds: topic.tagIds,
        }));
      
      return trendingTopics;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });
}