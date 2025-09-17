"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";
import { APP_SHORT_NAME, TOPBAR_SCROLL_THRESHOLD } from "@/constants/common";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, Bookmark, Loader2, Share } from "lucide-react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useTopicInteractions } from "@/hooks/useTopicInteractions";
import { ShareDialog } from "@/components/ui/share-dialog";
import { Id } from "@/convex/_generated/dataModel";
import { formatLikes, formatShares } from "@/lib/format";
import SimilarTopics from "@/components/content/SimilarTopics";
import { useTopic } from "@/hooks/useTopic";

export default function TopicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const topicId = params.id as Id<"topics">;
  const { data: topicData, isLoading, error } = useTopic(topicId);

  // Topic interactions
  const { interactions, handleLike, handleSave, handleShare, handleView, isAuthenticated } = useTopicInteractions(topicId);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState<number | null>(null);
  const [localShareCount, setLocalShareCount] = useState<number | null>(null);

  // Record view when layout mounts - use a ref to prevent multiple calls
  const viewRecorded = useRef(false);

  useEffect(() => {
    if (topicId && !viewRecorded.current && isAuthenticated) {
      handleView();
      viewRecorded.current = true;
    }
  }, [topicId, isAuthenticated, handleView]);

  // Track scroll states for sidebar height calculations
  const [isAtTop, setIsAtTop] = useState<boolean>(true);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [lastScrollY, setLastScrollY] = useState<number>(0);

  useEffect(() => {
    const currentScrollY = window.scrollY;
    setLastScrollY(currentScrollY);
    setIsAtTop(currentScrollY < TOPBAR_SCROLL_THRESHOLD);

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Check if we're at the top
      setIsAtTop(currentScrollY < TOPBAR_SCROLL_THRESHOLD);

      // Only apply show/hide logic when not at top
      if (currentScrollY >= TOPBAR_SCROLL_THRESHOLD) {
        // Show TopBar when scrolling up
        if (currentScrollY < lastScrollY) {
          setIsVisible(true);
        }
        // Hide TopBar when scrolling down (but only after 100px to avoid flickering)
        else if (currentScrollY > lastScrollY && currentScrollY > 100) {
          setIsVisible(false);
        }
      } else {
        // Always visible when at top
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  useEffect(() => {
    // Scroll to top on page load
    window.scrollTo(0, 0);
  }, [pathname]);

  // Calculate sidebar height based on scroll state
  const getSidebarHeight = () => {
    if (isAtTop) {
      return "h-[calc(100dvh-8rem)]"; // At top
    } else if (isVisible) {
      return "h-[calc(100dvh-6rem)]"; // Not at top but topbar visible
    } else {
      return "h-[calc(100dvh-2rem)]"; // Not at top and topbar not visible
    }
  };

  const getSidebarTop = () => {
    if (isAtTop || isVisible) {
      return "top-20"; // At top (or) Not at top but topbar visible
    } else {
      return "top-4"; // Not at top and topbar not visible
    }
  };

  // Handle interactions
  const handleLikeClick = async () => {
    const result = await handleLike();
    if (result) {
      setLocalLikeCount(result.newCount);
    }
  };

  const handleSaveClick = async () => {
    await handleSave();
  };

  const handleShareClick = () => {
    setShareDialogOpen(true);
  };

  const onShareComplete = async (platform: string) => {
    const result = await handleShare(platform);
    if (result) {
      setLocalShareCount(result.newCount);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !topicData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">Topic not found</p>
          <p className="text-muted-foreground mb-4">The topic you are looking for does not exist or has been removed.</p>
          <Button onClick={() => router.push("/")}>
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const shareOptions = {
    title: topicData?.topic.title ?? `${APP_SHORT_NAME} topic`,
    text: topicData?.topic.description ?? "Check out this interesting topic!",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}${pathname}`,
  };

  return (
    <>
      <div className="w-full lg:max-w-6xl lg:mx-auto mt-4">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 md:gap-6 lg:px-4">
          {/* Left Sidebar - Actions */}
          <div className={cn(
            "hidden lg:flex lg:flex-col lg:col-span-3 lg:justify-between sticky transition-all mt-3",
            getSidebarTop(),
            getSidebarHeight()
          )}>
            <Button
              variant="secondary"
              onClick={() => router.push("/user/dashboard")}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>

            <div className="space-y-2">
              <Button
                variant="outline"
                className={cn(
                  "w-full border-destructive text-destructive hover:bg-destructive hover:text-white dark:border-red-400 dark:text-red-400 dark:hover:bg-red-400 dark:hover:text-black",
                  interactions?.hasLiked && "bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300"
                )}
                onClick={handleLikeClick}
              >
                <Heart className={cn("h-4 w-4", interactions?.hasLiked && "fill-current")} />
                {localLikeCount !== null ? formatLikes(localLikeCount) : (interactions?.hasLiked ? "Liked" : "Like")}
              </Button>
              <Button
                variant="outline"
                className={cn(
                  "w-full border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-400 dark:hover:text-black",
                  interactions?.hasSaved && "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950 dark:border-orange-800 dark:text-orange-300"
                )}
                onClick={handleSaveClick}
              >
                <Bookmark className={cn("h-4 w-4", interactions?.hasSaved && "fill-current")} />
                {interactions?.hasSaved ? "Saved" : "Save"}
              </Button>
              <Button variant="outline" className="w-full" onClick={handleShareClick}>
                <Share className="h-4 w-4" />
                {localShareCount !== null ? formatShares(localShareCount) : 'Share'}
              </Button>
            </div>
          </div>

          {/* Center Content */}
          <div className="flex flex-col gap-6 min-h-[calc(100dvh-8rem)] lg:col-span-5">
            {children}
          </div>

          {/* Right Sidebar - Similar Topics */}
          <div className={cn(
            "hidden lg:block lg:col-span-4 lg:sticky lg:overflow-auto pr-3 transition-all mt-3 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-track]:bg-neutral-700 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500",
            getSidebarTop(),
            getSidebarHeight()
          )}>
            <SimilarTopics />
          </div>
        </div>
      </div>

      {/* Mobile Actions Bar */}
      <div className="lg:hidden sticky bottom-4 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-full border border-foreground/50 p-2 w-full shadow-xl">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.push("/user/dashboard")}
            className="rounded-full"
          >
            <ArrowLeft className="size-5" />
            Back to Home
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className={cn(interactions?.hasLiked && "text-destructive")}
              onClick={handleLikeClick}
            >
              <Heart className={cn("size-5", interactions?.hasLiked && "fill-current")} />
            </Button>
            <Button
              variant="ghost"
              className={cn(interactions?.hasSaved && "text-orange-500")}
              onClick={handleSaveClick}
            >
              <Bookmark className={cn("size-5", interactions?.hasSaved && "fill-current")} />
            </Button>
            <Button
              variant="ghost"
              onClick={handleShareClick}>
              <Share className="size-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Share Dialog */}
      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        shareOptions={shareOptions}
        onShare={onShareComplete}
      />
    </>
  );
}