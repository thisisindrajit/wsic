"use client";

import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle, Clock, Coffee, ArrowLeft } from "lucide-react";
import Block from "@/components/content/Block";
import { Button } from "@/components/ui/button";
import SelectHolder from "@/components/content/SelectHolder";
import { Id } from "@/convex/_generated/dataModel";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";

type SimilarTopicsType = {
  _id: Id<"topics">;
  title: string;
  description: string;
  slug: string;
  imageUrl?: string;
  estimatedReadTime: number;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  score: number;
}

const SearchContent = () => {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const topic = searchParams.get("topic") || "";
  const urlDifficulty = searchParams.get("difficulty") || "beginner";
  const [isBrewing, setIsBrewing] = useState(false);
  const [brewingError, setBrewingError] = useState<string | null>(null);

  // State for difficulty selection
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">(
    ["beginner", "intermediate", "advanced"].includes(urlDifficulty)
      ? urlDifficulty as "beginner" | "intermediate" | "advanced"
      : "beginner"
  );

  // Handle difficulty change
  const handleDifficultyChange = (newDifficulty: "beginner" | "intermediate" | "advanced") => {
    setDifficulty(newDifficulty);
    // Update URL without page reload
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set("difficulty", newDifficulty);
    router.replace(`/user/search?${newSearchParams.toString()}`, { scroll: false });
  };

  // Text search for full-text search approximate matches
  const fullTextMatches = useQuery(
    api.search.simpleSearchTopics,
    topic ? {
      searchTerm: topic,
      difficulty: difficulty,
      limit: 5,
    } : "skip"
  ) ?? [];

  // Vector search for similar topics using the search term directly
  const [similarTopics, setSimilarTopics] = useState<SimilarTopicsType[]>([]);
  const [vectorLoading, setVectorLoading] = useState(false);
  const searchSimilarTopics = useAction(api.embeddings.searchSimilarTopicsByTerm);

  useEffect(() => {
    const fetchSimilarTopics = async () => {
      if (!topic) return;

      try {
        setVectorLoading(true);
        const results = await searchSimilarTopics({
          searchTerm: topic,
          limit: 10,
        });
        setSimilarTopics(results);
      } catch (err) {
        console.error("Vector search failed:", err);
        setSimilarTopics([]);
      } finally {
        setVectorLoading(false);
      }
    };

    fetchSimilarTopics();
  }, [topic, searchSimilarTopics]);

  const isLoading = (fullTextMatches === undefined) || vectorLoading;

  // PART 1

  // Finding out only exact matches (topic name and difficulty)
  const exactMatches = fullTextMatches.filter(t => t.title.toLowerCase() === topic.toLowerCase()
  && t.difficulty.toLowerCase() === difficulty.toLowerCase());

  // Similarity score results that have higher priority
  const highScoreSimilar = similarTopics.filter(t => t.score > Number(process.env.NEXT_PUBLIC_SIMILARITY_SCORE || 0.85) 
  && t.difficulty.toLowerCase() === difficulty.toLowerCase());

  // Combining results
  const foundTopics = [
    ...exactMatches,
    ...highScoreSimilar.filter(st =>
      // Removing topics that are already part of the first array
      !exactMatches.some(t => t._id === st._id)
    )
  ];

  // PART 2

  // Moving non-exact matches from search results to related topics
  const relatedTopics = [
    ...fullTextMatches.filter(ft => !exactMatches.some(t => t._id === ft._id) 
    // Removing topics that are already part of the found topics array
    && !foundTopics.some(t => t._id === ft._id)),
    ...similarTopics.filter(st => !highScoreSimilar.some(t => t._id === st._id) 
    // Removing topics that are already part of the first array
    && !fullTextMatches.some(t => t._id === st._id)
    // Removing topics that are already part of the found topics array
    && !foundTopics.some(t => t._id === st._id)
    ) 
  ];

  /*
  const lowScoreSimilar = [
    // Remove found results that are shown in search results
    ...relatedTopics.filter(topic => !foundTopics.some(foundTopic => foundTopic._id === topic._id)),
    // Add low-score similar topics that aren't already used anywhere
    ...similarTopics.filter(topic =>
      topic.score <= Number(process.env.NEXT_PUBLIC_SIMILARITY_SCORE || 0.85) &&
      !foundTopics.some(foundTopic => foundTopic._id === topic._id)
    )
  ];
  */

  const shouldShowResults = foundTopics.length > 0;

  const startBrewingTopic = async () => {
    setBrewingError(null);

    // Create POST request to /api/queue-topic-request
    try {
      if (session?.user) {
        const response = await fetch("/api/queue-topic-request", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topic: topic,
            difficulty: difficulty,
            user_id: session.user.id
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Topic request queued:", data);
        setIsBrewing(true);
      } else {
        throw new Error("User not authenticated");
      }
    } catch (error) {
      console.error("Error queuing topic request:", error);
      setBrewingError("Failed to start brewing topic");
    }
  }

  if (!topic) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl mb-2">No search topic provided</h2>
        <p className="text-muted-foreground">Please go back and enter a topic to search for.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500 mb-4" />
        <h2 className="text-xl mb-2">{`Searching for "${topic}"`}</h2>
        <p className="text-muted-foreground">Finding the best content for you...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Back to Home Button */}
      <div className="mb-6">
        <Link href="/user/dashboard">
          <Button variant="secondary" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      {/* Search Header */}
      <div className="mb-10">
        <h1 className="text-3xl/normal mb-6">
          {`Search Results for "${topic}"`}
        </h1>
        <SelectHolder
          label="Difficulty"
          placeholder="Select difficulty"
          values={["beginner", "intermediate", "advanced"]}
          onValueChange={handleDifficultyChange}
          defaultValue={difficulty}
          className="w-40"
        />
      </div>

      {shouldShowResults ? (
        <div className="space-y-12">
          {/* Found Topics */}
          <section>
            <h2 className="text-2xl mb-4">Search Results</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {foundTopics.map((topic) => (
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
          </section>

          {/* Related Topics */}
          {relatedTopics.length > 0 && (
            <div>
              <h2 className="text-2xl mb-4">Related Topics</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                {relatedTopics.slice(0, 10).map((topic) => (
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
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* No Results - Show Brewing Message */}
          <div className="mx-auto text-center">
            <div className="mt-12 mb-6">
              <Coffee className="h-16 w-16 mx-auto text-teal-500 mb-4" />
              <h2 className="text-2xl mb-4">Brew Your Topic</h2>
              <p className="text-muted-foreground mb-4">
                {`We don't have content for "${topic}" for ${difficulty} difficulty yet, but we can start to brew it for you!`}
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Estimated time: 3-4 minutes</span>
              </div>
            </div>

            {!isBrewing && !brewingError ? (
              <Button
                className="mb-6"
                onClick={startBrewingTopic}
              >
                Start Brewing Topic
              </Button>
            ) : isBrewing ? (
              <div className="mb-6">
                <div className="flex items-center justify-center gap-2 text-teal-600 mb-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="">Brewing started!</span>
                </div>
                <p className="text-muted-foreground mb-4">
                  {`Your topic is now being brewed. You'll be notified when it's ready.`}
                </p>
                <Link href="/user/explore">
                  <Button
                    variant="outline"
                  >
                    Explore trending topics
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="mb-6">
                <div className="flex items-center justify-center gap-2 text-red-600 mb-4">
                  <AlertCircle className="h-5 w-5" />
                  <span className="">Brewing failed</span>
                </div>
                <p className="text-muted-foreground mb-4">
                  {brewingError || "Something went wrong while starting to brew your topic."}
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={() => {
                      setBrewingError(null);
                      startBrewingTopic();
                    }}
                  >
                    Try Again
                  </Button>
                  <Link href="/user/explore">
                    <Button
                      variant="outline"
                    >
                      Explore trending topics
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Show Similar Topics if Available */}
          {relatedTopics.length > 0 && (
            <section className="mt-12">
              <h3 className="text-xl mb-4">You might like these</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                {relatedTopics.slice(0, 10).map((topic) => (
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
            </section>
          )}
        </div>
      )}
    </div>
  );
};

const SearchResults = () => {
  return (
    <div className="mt-3">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500 mb-4" />
          <p className="text-muted-foreground">Loading search...</p>
        </div>
      }>
        <SearchContent />
      </Suspense>
    </div>
  );
};

export default SearchResults;