"use client";

import { useSession } from "@/lib/auth-client";
import { useSavedTopics } from "@/hooks/useUserTopics";
import { useEffect, useRef } from "react";
import { Loader2, Bookmark } from "lucide-react";
import Block from "@/components/content/Block";

const Saved = () => {
    const { data: session } = useSession();
    const { data: savedTopics, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useSavedTopics();
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

    if (!session?.user?.id) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl xs:text-4xl lg:text-4xl/normal font-light">Saved</h1>
                    <p className="text-muted-foreground">Your bookmarked topics</p>
                </div>
                <div className="text-center py-12">
                    <p className="text-muted-foreground">Please sign in to view your saved topics</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl xs:text-4xl lg:text-4xl/normal font-light">Saved</h1>
                    <p className="text-muted-foreground">Your bookmarked topics</p>
                </div>
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl xs:text-4xl lg:text-4xl/normal font-light">Saved</h1>
                <p className="text-muted-foreground">Your bookmarked topics</p>
            </div>

            {savedTopics && savedTopics.length > 0 ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                        {savedTopics.map((topic) => (
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
                </div>
            ) : (
                <div className="text-center py-12">
                    <Bookmark className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">No saved topics yet</p>
                    <p className="text-sm text-muted-foreground">
                        Start exploring topics and save the ones you find interesting!
                    </p>
                </div>
            )}
        </div>
    );
};

export default Saved;