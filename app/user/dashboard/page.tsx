"use client"

import NavigationSidebar from "@/components/navigation/NavigationSidebar";
import MobileBottomNavigation from "@/components/navigation/MobileBottomNavigation";
import TopicSearch from "@/components/features/TopicSearch";
import SubscriptionCard from "@/components/features/SubscriptionCard";
import TrendingTopics from "@/components/content/TrendingTopics";
import TopicGrid from "@/components/content/TopicGrid";
import { useTopBarVisibility } from "@/hooks/useTopBarVisibility";
import { cn } from "@/lib/utils";

const UserDashboard = () => {
    const isTopBarVisible = useTopBarVisibility();

    const handleSearch = (topic: string) => {
        // TODO: Implement search functionality
        console.log('Searching for:', topic);
    };

    return (
        <>
            <div className="max-w-6xl m-auto mt-4">
                {/* Responsive layout */}
                <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 md:gap-6">
                    {/* Left Sidebar - Navigation (hidden on mobile and tablet) */}
                    <div className={cn(
                        "hidden lg:block lg:col-span-3 h-[calc(100dvh-8rem)] sticky mt-3 transition-all",
                        isTopBarVisible ? "top-20" : "top-4"
                    )}>
                        <NavigationSidebar />
                    </div>

                    {/* Center Content - Topic Search and Grid */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                        <TopicSearch onSearch={handleSearch} />
                        <TopicGrid />
                    </div>

                    {/* Right Sidebar - Subscription and Trending (hidden on mobile, horizontal on tablet) */}
                    <div className={cn(
                        "hidden lg:block lg:col-span-4 lg:h-[calc(100dvh-8rem)] lg:sticky lg:overflow-auto pr-3 mt-3 transition-all [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-track]:bg-neutral-700 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500",
                        isTopBarVisible ? "top-20" : "top-4"
                    )}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                            <SubscriptionCard />
                            <TrendingTopics />
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <MobileBottomNavigation />
        </>
    );
};

export default UserDashboard;