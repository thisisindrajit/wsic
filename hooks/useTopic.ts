"use client";

import { useQuery } from "@tanstack/react-query";
import { useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export function useTopic(topicId: Id<"topics">) {
  const convex = useConvex();

  return useQuery({
    queryKey: ["topic", topicId],
    queryFn: () => convex.query(api.topics.getTopicById, { topicId }),
    enabled: !!topicId,
    refetchInterval: 1000 * 60 * 2, // 2 minutes
  });
}