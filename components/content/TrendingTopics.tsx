"use client";

import { TrendingUp, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useTrendingTopics, useTrendingUpdate } from '@/hooks/useTrendingTopics';
import { Button } from '@/components/ui/button';
import { formatViews, formatLikes } from '@/lib/format';
import { Id } from '@/convex/_generated/dataModel';
import Link from 'next/link';
import { useState } from 'react';

interface TrendingTopicsProps {
  className?: string;
  categoryId?: Id<"categories">;
}

interface TrendingTopic {
  _id: Id<"topics">;
  _creationTime: number;
  title: string;
  description: string;
  imageUrl?: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedReadTime: number;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  slug: string;
  categoryId?: Id<"categories">;
  tagIds: string[];
}

export default function TrendingTopics({ className = '', categoryId }: TrendingTopicsProps) {
  const { data: topics, isLoading, isError, refetch } = useTrendingTopics({ categoryId });
  const { updateTrending } = useTrendingUpdate();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRefresh = async () => {
    setIsUpdating(true);
    const success = await updateTrending();
    if (success) {
      // Refetch the trending topics after successful update
      await refetch();
    }
    setIsUpdating(false);
  };

  if (isError) {
    return (
      <div className={`border border-border rounded-md p-6 bg-card flex flex-col gap-8 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">{`What's Trending`}</h3>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isUpdating}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>Failed to load trending topics</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`border border-border rounded-md p-6 bg-card flex flex-col gap-8 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{`What's Trending`}</h3>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={isUpdating}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="flex flex-col gap-10">
        {isLoading ? (
          // Loading state
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : topics && topics.length > 0 ? (
          // Topics list
          topics.map((topic: TrendingTopic) => (
            <Link
              key={topic._id}
              href={`/topic/${topic._id}`}
              className="group cursor-pointer hover:bg-muted/50 rounded-md px-4 py-2 -m-4 transition-colors touch-manipulation active:bg-muted/70 min-h-[44px] flex items-center"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <div className="text-xs text-muted-foreground">
                    {topic.estimatedReadTime} min read
                  </div>
                  <p className="font-medium text-sm text-foreground group-hover:underline line-clamp-1 capitalize">
                    {topic.title}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {formatViews(topic.viewCount)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatLikes(topic.likeCount)}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <TrendingUp className="size-4 text-teal-500" />
                </div>
              </div>
            </Link>
          ))
        ) : (
          // No topics found
          <div className="text-center py-8 text-muted-foreground">
            <p>No trending topics found</p>
          </div>
        )}
      </div>
    </div>
  );
}