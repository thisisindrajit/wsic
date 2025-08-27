"use client"

import NavigationSidebar from "@/components/navigation/NavigationSidebar";
import MobileBottomNavigation from "@/components/navigation/MobileBottomNavigation";
import TopicSearch from "@/components/features/TopicSearch";
import SubscriptionCard from "@/components/features/SubscriptionCard";
import TrendingTopics from "@/components/content/TrendingTopics";
import Block from "@/components/content/Block";

const UserDashboard = () => {
    const handleSearch = (topic: string) => {
        // TODO: Implement search functionality
        console.log('Searching for:', topic);
    };

    return (
        <>
            <div className="max-w-6xl m-auto">
                {/* Responsive layout */}
                <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 md:gap-6">
                    {/* Left Sidebar - Navigation (hidden on mobile and tablet) */}
                    <div className="hidden lg:block lg:col-span-3 h-[calc(100dvh-7rem)] sticky top-4 mt-3">
                        <NavigationSidebar />
                    </div>

                    {/* Center Content - Topic Search */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                        <TopicSearch onSearch={handleSearch} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                            <Block
                                imageUrl="https://blogs.microsoft.com/wp-content/uploads/sites/5/2023/11/GettyImages-1165687569-scaled.jpg"
                                title="Elections"
                                description="Understanding democratic processes, voting systems, and their impact on society."
                                likes={1240}
                                shares={340}
                            />
                            <Block
                                imageUrl="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Eddy_currents_due_to_magnet.svg/960px-Eddy_currents_due_to_magnet.svg.png"
                                title="Eddy Currents"
                                description="Exploring electromagnetic induction and its applications in modern technology."
                                likes={890}
                                shares={180}
                            />
                            <Block
                                imageUrl="https://media.istockphoto.com/id/2157860285/photo/a-conceptual-image-of-climate-change.jpg?s=612x612&w=0&k=20&c=kicaeQNTK1v1gWZF2yX7Lk-xnW9bFrwhCeIiJk8eKrI="
                                title="Climate Change"
                                description="Examining global warming effects and sustainable solutions for our planet."
                                likes={2340}
                                shares={650}
                            />
                            <Block
                                imageUrl="https://media.istockphoto.com/id/1387900612/photo/automation-data-analytic-with-robot-and-digital-visualization-for-big-data-scientist.jpg?s=612x612&w=0&k=20&c=50maOJU6CpVC55mYnUqtff2aiaJZ7KlmMn4jNhWD_eo="
                                title="Artificial Intelligence"
                                description="The future of machine learning and its transformative impact on industries."
                                likes={1890}
                                shares={420}
                            />
                            <Block
                                imageUrl="https://media.istockphoto.com/id/182062885/photo/space-station-in-earth-orbit.jpg?s=612x612&w=0&k=20&c=F_P2YJ3QDbSW2n6dWkh6JNYeQGI1-2q-wOBk9-sw_Xo="
                                title="Space Exploration"
                                description="Discovering the cosmos and humanity's journey beyond Earth's boundaries."
                                likes={1560}
                                shares={380}
                            />
                        </div>
                    </div>

                    {/* Right Sidebar - Subscription and Trending (hidden on mobile, horizontal on tablet) */}
                    <div className="hidden lg:block lg:col-span-4 lg:h-[calc(100dvh-7rem)] lg:sticky lg:top-4 lg:overflow-auto pr-3 mt-3 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-track]:bg-neutral-700 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
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