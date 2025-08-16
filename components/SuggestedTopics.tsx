"use client"

import React from 'react';
import { Button } from '@/components/ui/button';

interface SuggestedTopicsProps {
    topics?: string[];
}

const SuggestedTopics: React.FC<SuggestedTopicsProps> = ({
    topics = [
        "Climate Change",
        "Artificial Intelligence",
        "Mental Health",
        "Cryptocurrency",
        "Space Exploration"
    ]
}) => {
    return (
        <div className="flex flex-wrap gap-3">
            {topics.map((topic, index) => (
                <Button
                    key={index}
                    variant="outline"
                    className="px-4 py-2 rounded-full text-sm border-foreground hover:border-teal-500 hover:bg-transparent transition-all font-normal cursor-pointer hover:scale-[1.1] hover:shadow-lg"
                >
                    {topic}
                </Button>
            ))}
        </div>
    );
};

export default SuggestedTopics;