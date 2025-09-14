"use client";

import { useTopics } from '@/hooks/useTopics';
import { useEffect, useRef } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Id, Doc } from '@/convex/_generated/dataModel';
import Block from '@/components/content/Block';

interface TopicGridProps {
  categoryId?: Id<"categories">;
  difficulty?: "beginner" | "intermediate" | "advanced";
  className?: string;
}

type Topic = Doc<"topics">;

export default function TopicGrid({ categoryId, difficulty, className = '' }: TopicGridProps) {
  const {
    data: topics,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useTopics({ categoryId, difficulty, pageSize: 5 });

  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isError) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Failed to load topics</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {isLoading && topics.length === 0 ? (
        // Initial loading state
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            {topics.map((topic: Topic) => (
              <Block
                key={topic._id}
                id={topic._id}
                imageUrl={topic.imageUrl}
                title={topic.title}
                description={topic.description}
                likes={topic.likeCount}
                shares={topic.shareCount}
                difficulty={topic.difficulty}
                estimatedReadTime={topic.estimatedReadTime}
                viewCount={topic.viewCount}
              />
            ))}
          </div>

          {/* Load more trigger */}
          {hasNextPage && (
            <div ref={loadMoreRef} className="flex items-center justify-center py-8">
              {isFetchingNextPage && (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              )}
            </div>
          )}

          {topics.length === 0 && !isLoading && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No topics found</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}