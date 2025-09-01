"use client"

import TopicSearch from "@/components/features/TopicSearch";
import TopicGrid from "@/components/content/TopicGrid";

const UserDashboard = () => {
    const handleSearch = (topic: string) => {
        // TODO: Implement search functionality
        console.log('Searching for:', topic);
    };

    return (
        <>
            <TopicSearch onSearch={handleSearch} />
            <TopicGrid />
        </>
    );
};

export default UserDashboard;