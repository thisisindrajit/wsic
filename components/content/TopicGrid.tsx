"use client";

import { useTopics } from '@/hooks/useTopics';
import { useEffect, useRef } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Id } from '@/convex/_generated/dataModel';
import Block from '@/components/content/Block';
import Link from 'next/link';

interface TopicGridProps {
  categoryId?: Id<"categories">;
  difficulty?: "beginner" | "intermediate" | "advanced";
  className?: string;
}

// Placeholder images for topics
const getTopicImage = (title: string): string => {
  const images = {
    'artificial intelligence': 'https://media.istockphoto.com/id/1387900612/photo/automation-data-analytic-with-robot-and-digital-visualization-for-big-data-scientist.jpg?s=612x612&w=0&k=20&c=50maOJU6CpVC55mYnUqtff2aiaJZ7KlmMn4jNhWD_eo=',
    'quantum physics': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Eddy_currents_due_to_magnet.svg/960px-Eddy_currents_due_to_magnet.svg.png',
    'climate change': 'https://media.istockphoto.com/id/2157860285/photo/a-conceptual-image-of-climate-change.jpg?s=612x612&w=0&k=20&c=kicaeQNTK1v1gWZF2yX7Lk-xnW9bFrwhCeIiJk8eKrI=',
    'space exploration': 'https://media.istockphoto.com/id/182062885/photo/space-station-in-earth-orbit.jpg?s=612x612&w=0&k=20&c=F_P2YJ3QDbSW2n6dWkh6JNYeQGI1-2q-wOBk9-sw_Xo=',
    'renaissance art': 'https://blogs.microsoft.com/wp-content/uploads/sites/5/2023/11/GettyImages-1165687569-scaled.jpg',
  };

  const key = title.toLowerCase();
  return images[key as keyof typeof images] || 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=250&fit=crop';
};

export default function TopicGrid({ categoryId, difficulty, className = '' }: TopicGridProps) {
  const {
    data: topics,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useTopics({ categoryId, difficulty, pageSize: 6 });

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
            {topics.map((topic) => (
              <Link
                key={topic._id}
                href={`/topic/${topic.slug}`}
                className="block"
              >
                <Block
                  imageUrl={getTopicImage(topic.title)}
                  title={topic.title}
                  description={topic.description}
                  likes={topic.likeCount}
                  shares={topic.shareCount}
                  difficulty={topic.difficulty}
                  estimatedReadTime={topic.estimatedReadTime}
                  viewCount={topic.viewCount}
                  slug={topic.slug}
                />
              </Link>
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