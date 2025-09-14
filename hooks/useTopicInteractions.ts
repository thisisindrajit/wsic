import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";

export function useTopicInteractions(topicId: Id<"topics">) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  // Get user's current interactions with this topic
  const interactions = useQuery(
    api.users.getUserTopicInteractions,
    userId ? { userId, topicId } : "skip"
  );

  // Mutation for recording interactions
  const recordInteraction = useMutation(api.users.recordInteraction);

  const handleLike = async () => {
    if (!userId) {
      toast.error("Please sign in to like topics");
      return;
    }

    try {
      const result = await recordInteraction({
        userId,
        topicId,
        interactionType: "like",
      });

      if (result.action === "added") {
        toast.success("Topic liked!");
      } else {
        toast.success("Topic unliked");
      }

      return result;
    } catch (error) {
      console.error("Error liking topic:", error);
      toast.error("Failed to like topic");
    }
  };

  const handleSave = async () => {
    if (!userId) {
      toast.error("Please sign in to save topics");
      return;
    }

    try {
      const result = await recordInteraction({
        userId,
        topicId,
        interactionType: "save",
      });

      if (result.action === "added") {
        toast.success("Topic saved!");
      } else {
        toast.success("Topic removed from saved");
      }

      return result;
    } catch (error) {
      console.error("Error saving topic:", error);
      toast.error("Failed to save topic");
    }
  };

  const handleShare = async (destination?: string) => {
    if (!userId) {
      toast.error("Please sign in to share topics");
      return;
    }

    try {
      const result = await recordInteraction({
        userId,
        topicId,
        interactionType: "share",
        metadata: destination ? { shareDestination: destination } : undefined,
      });

      return result;
    } catch (error) {
      console.error("Error sharing topic:", error);
      toast.error("Failed to share topic");
    }
  };

  const handleView = async (timeSpent?: number) => {
    // For views, we should track only authenticated users
    if (userId) {
      try {
        await recordInteraction({
          userId: userId,
          topicId,
          interactionType: "view",
          metadata: timeSpent ? { timeSpent } : undefined,
        });
      } catch (error) {
        console.error("Error recording view:", error);
      }
    }
  };
  
  return {
    interactions,
    handleLike,
    handleSave,
    handleShare,
    handleView,
    isAuthenticated: !!userId,
  };
}
