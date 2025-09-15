"use client"

import SuggestedTopics from "@/components/content/SuggestedTopics";
import Block from "@/components/content/Block";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mouse, Loader2, AlertCircle, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTrendingTopics } from "@/hooks/useTrendingTopics";
import SelectHolder from "../content/SelectHolder";
import { Id } from "@/convex/_generated/dataModel";

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

const Home = () => {
  const [searchTopic, setSearchTopic] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [difficulty, setDifficulty] = useState('Beginner');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const gradientTextClass = "text-transparent bg-clip-text bg-gradient-to-br from-teal-600 to-teal-400";

  // Get trending topics
  const { data: trendingTopics, isLoading: trendingLoading, isError: trendingError } = useTrendingTopics({ limit: 5 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTopic = searchTopic.trim();
    if (!trimmedTopic) return;

    setIsSubmitting(true);
    
    // Navigate to search page with topic and difficulty as search params
    const searchParams = new URLSearchParams({
      topic: trimmedTopic,
      difficulty: difficulty.toLowerCase()
    });
    
    router.push(`/user/search?${searchParams.toString()}`);
  };

  const handleSuggestedTopicClick = (topic: string) => {
    setSearchTopic(topic);
    // Auto-submit when clicking suggested topic
    const searchParams = new URLSearchParams({
      topic: topic,
      difficulty: difficulty.toLowerCase()
    });
    router.push(`/user/search?${searchParams.toString()}`);
  };

  const handleClearInput = () => {
    setSearchTopic('');
  };

  return (
    <>
      {/* Search box */}
      <div className="flex flex-col items-center justify-center flex-1 py-12 min-h-[calc(100dvh-5rem)] relative">
        <div className="flex flex-col sm:max-w-[90%] lg:max-w-[80%] xl:max-w-[70%] pb-24">
          <div className="text-4xl/normal md:text-5xl/normal xl:text-6xl/normal font-light">
            <span className={gradientTextClass}>W</span>hy <span className={gradientTextClass}>S</span>hould <span className={gradientTextClass}>I</span> <span className={gradientTextClass}>C</span>are about
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="flex flex-col md:flex-row items-stretch gap-4 mb-8">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="type in any topic..."
                  value={searchTopic}
                  onChange={(e) => setSearchTopic(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className={cn(
                    "dark:bg-background h-auto border-x-0 border-t-0 text-4xl/normal md:text-5xl/normal xl:text-6xl/normal font-light p-0 pr-12 pb-2 focus-visible:ring-none focus-visible:ring-[0px] transition-all",
                    (isFocused || searchTopic.trim()) ? "border-teal-500 focus-visible:border-teal-500" : ""
                  )}
                  maxLength={256}
                  autoComplete="off"
                  autoCapitalize="words"
                  spellCheck="true"
                />
                {searchTopic.trim() && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearInput}
                    className="absolute right-0 top-1/2 -translate-y-1/2 h-10 w-10 p-0 hover:bg-transparent text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="size-8" />
                  </Button>
                )}
              </div>
              <Button
                type="submit"
                disabled={!searchTopic.trim() || isSubmitting}
                className="hidden bg-teal-500 md:flex items-center justify-center h-14 md:h-auto mr-0 w-14 md:w-20 xl:w-24 text-background hover:bg-teal-500/90 transition-all cursor-pointer border border-teal-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-teal-500"
              >
                <ArrowRight className="size-6 md:size-8 xl:size-10" />
              </Button>
              <div className="md:hidden flex items-baseline justify-between w-full">
                <SelectHolder
                  label="Difficulty"
                  placeholder="Select difficulty"
                  values={["Beginner", "Intermediate", "Advanced"]}
                  onValueChange={(value: string) => setDifficulty(value)}
                />
                <Button
                  type="submit"
                  disabled={!searchTopic.trim() || isSubmitting}
                  className="bg-teal-500 flex items-center justify-center h-14 w-14 text-background hover:bg-teal-500/90 transition-all cursor-pointer border border-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowRight className="size-6" />
                </Button>
              </div>
            </div>
            <SelectHolder
              label="Difficulty"
              placeholder="Select difficulty"
              values={["Beginner", "Intermediate", "Advanced"]}
              onValueChange={(value: string) => setDifficulty(value)}
              className="hidden md:block"
            />
          </form>
          <div className="mt-4 md:mt-10 text-lg font-light flex flex-col gap-3">
            <div>Suggested topics</div>
            <SuggestedTopics onTopicClick={handleSuggestedTopicClick} />
          </div>
        </div>
        {/* Scroll indicator */}
        <div
          className="hidden md:flex absolute bottom-8 left-1/2 transform -translate-x-1/2 items-center gap-2 animate-bounce cursor-pointer text-neutral-500"
          onClick={() => {
            document.getElementById('trending-topics')?.scrollIntoView({
              behavior: 'smooth'
            });
          }}
        >
          <Mouse className="size-5" />
          <span className="text-sm font-medium">Trending topics</span>
        </div>
      </div>
      {/* Trending Topics */}
      <div id="trending-topics" className="flex flex-col gap-4 py-8">
        <div className="flex items-center justify-between">
          <div className="text-2xl/normal font-medium">
            <span className="font-light uppercase">Trending</span> Topics
          </div>
        </div>

        {/* Trending Topics Grid */}
        <div className="w-full">
          {trendingLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : trendingError ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>Failed to load trending topics</span>
            </div>
          ) : trendingTopics && trendingTopics.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {trendingTopics.slice(0, 5).map((topic: TrendingTopic) => (
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
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No trending topics found</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Home;