"use client";


import { useSession } from "@/lib/auth-client";
import { useSavedTopics } from "@/hooks/useUserTopics";
import { Button } from "@/components/ui/button";
import { Loader2, Bookmark } from "lucide-react";
import Block from "@/components/content/Block";

const SavedPage = () => {
    const { data: session } = useSession();
    const { data: savedTopics, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useSavedTopics();

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
                    
                    {hasNextPage && (
                        <div className="flex justify-center">
                            <Button 
                                onClick={fetchNextPage}
                                variant="outline"
                                className="w-full sm:w-auto"
                                disabled={isFetchingNextPage}
                            >
                                {isFetchingNextPage ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Loading...
                                    </>
                                ) : (
                                    "Load More Saved Topics"
                                )}
                            </Button>
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

export default SavedPage;