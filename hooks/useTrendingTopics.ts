import { useQuery } from "@tanstack/react-query";
import { useConvex, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

export function useTrendingTopics({
  categoryId,
  limit = 5,
}: {
  categoryId?: Id<"categories">;
  limit?: number;
} = {}) {
  const convex = useConvex();
  
  const query = useQuery({
    queryKey: ["trending-topics", categoryId, limit],
    queryFn: async () => {
      // Use the new getTrendingTopics query
      const topics = await convex.query(api.topics.getTrendingTopics, {
        categoryId: categoryId || undefined,
        limit,
      });
      
      return topics;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });

  return query;
}

export function useTrendingUpdate() {
  const triggerUpdate = useMutation(api.topics.triggerTrendingUpdate);

  const updateTrending = async () => {
    try {
      await triggerUpdate({});
      toast.success("Trending topics updated successfully!");
      return true;
    } catch (error) {
      console.error("Error updating trending topics:", error);
      toast.error("Failed to update trending topics");
      return false;
    }
  };

  return { updateTrending };
}