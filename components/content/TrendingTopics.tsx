"use client";

import { TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import { useTrendingTopics } from '@/hooks/useTrendingTopics';
import { Id } from '@/convex/_generated/dataModel';
import Link from 'next/link';

interface TrendingTopicsProps {
  className?: string;
  categoryId?: Id<"categories">;
}

interface TrendingTopic {
  _id: Id<"topics">;
  _creationTime: number;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedReadTime: number;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  slug: string;
  categoryId?: Id<"categories">;
  tagIds: Id<"tags">[];
}

const formatCount = (count: number): string => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};



export default function TrendingTopics({ className = '', categoryId }: TrendingTopicsProps) {
  const { data: topics, isLoading, isError } = useTrendingTopics({ categoryId });

  if (isError) {
    return (
      <div className={`border border-border rounded-md p-6 bg-card flex flex-col gap-8 ${className}`}>
        <h3 className="text-lg font-medium">What&apos;s happening</h3>
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>Failed to load trending topics</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`border border-border rounded-md p-6 bg-card flex flex-col gap-8 ${className}`}>
      <h3 className="text-lg font-medium">What&apos;s Trending</h3>

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
              href={`/topic/${topic.slug}`}
              className="group cursor-pointer hover:bg-muted/50 rounded-md px-4 py-2 -m-4 transition-colors touch-manipulation active:bg-muted/70 min-h-[44px] flex items-center"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <div className="text-xs text-muted-foreground">
                    {topic.estimatedReadTime} min read
                  </div>
                  <p className="font-medium text-sm text-foreground group-hover:text-teal-600 transition-colors line-clamp-2">
                    {topic.title}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {formatCount(topic.viewCount)} views
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatCount(topic.likeCount)} likes
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-3">
                  <TrendingUp className="h-3 w-3 text-teal-500" />
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