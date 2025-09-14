"use client";

import { useState, useEffect } from 'react';
import { TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import Link from 'next/link';
import { formatViews, formatLikes } from '@/lib/format';

interface SimilarTopicsProps {
  className?: string;
}

interface SimilarTopic {
  _id: Id<"topics">;
  title: string;
  slug: string;
  estimatedReadTime: number;
  viewCount: number;
  likeCount: number;
  difficulty: string;
}

export default function SimilarTopics({ className = '' }: SimilarTopicsProps) {
  const params = useParams();
  const topicId = params.id as Id<"topics">;
  
  const [similarTopics, setSimilarTopics] = useState<SimilarTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  
  const getSimilarTopics = useAction(api.embeddings.getSimilarTopics);

  useEffect(() => {
    const fetchSimilarTopics = async () => {
      if (!topicId) return;
      
      try {
        setIsLoading(true);
        setIsError(false);
        const topics = await getSimilarTopics({ topicId });
        setSimilarTopics(topics);
      } catch (error) {
        console.error('Error fetching similar topics:', error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSimilarTopics();
  }, [topicId, getSimilarTopics]);

  if (isError) {
    return (
      <div className={`border border-border rounded-md p-6 bg-card flex flex-col gap-8 ${className}`}>
        <h3 className="text-lg font-medium">Similar Topics</h3>
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>Failed to load similar topics</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`border border-border rounded-md p-6 bg-card flex flex-col gap-8 ${className}`}>
      <h3 className="text-lg font-medium">Similar Topics</h3>

      <div className="flex flex-col gap-10">
        {isLoading ? (
          // Loading state
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : similarTopics && similarTopics.length > 0 ? (
          // Topics list
          similarTopics.map((topic) => (
            <Link
              key={topic._id}
              href={`/topic/${topic._id}`}
              className="group cursor-pointer hover:bg-muted/50 rounded-md px-4 py-2 -m-4 transition-colors touch-manipulation active:bg-muted/70 min-h-[44px] flex items-center"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <div className="text-xs text-muted-foreground">
                    {topic.estimatedReadTime} min read • {topic.difficulty}
                  </div>
                  <p className="font-medium text-sm text-foreground group-hover:underline line-clamp-2">
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
            <p>No similar topics found</p>
          </div>
        )}
      </div>
    </div>
  );
}