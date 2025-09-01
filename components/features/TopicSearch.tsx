"use client"

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { ArrowRight } from 'lucide-react';
import SuggestedTopics from '@/components/content/SuggestedTopics';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TopicSearchProps {
  onSearch?: (topic: string) => void;
  className?: string;
}

const TopicSearch: React.FC<TopicSearchProps> = ({ onSearch, className }) => {
  const [searchTopic, setSearchTopic] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    const trimmedTopic = searchTopic.trim();
    if (!trimmedTopic) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (onSearch) {
        await onSearch(trimmedTopic);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuggestedTopicClick = (topic: string) => {
    setSearchTopic(topic);
    if (onSearch) {
      onSearch(topic);
    }
  };

  const gradientTextClass = "text-transparent bg-clip-text bg-gradient-to-br from-teal-600 to-teal-400";

  return (
    <div className={cn("flex flex-col gap-4 mb-4", className)}>
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="text-2xl xs:text-4xl lg:text-4xl/normal font-light mb-2 xs:mb-3">
          <span className={gradientTextClass}>W</span>hy <span className={gradientTextClass}>S</span>hould <span className={gradientTextClass}>I</span> <span className={gradientTextClass}>C</span>are about
        </div>
        <div className="flex flex-col sm:flex-row items-stretch gap-4 mb-6">
          <Input
            type="text"
            placeholder="type in any topic..."
            value={searchTopic}
            onChange={(e) => setSearchTopic(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              "dark:bg-background h-auto border-x-0 border-t-0 text-2xl/normal xs:text-4xl/normal md:text-4xl/normal lg:text-4xl/normal font-light p-0 focus-visible:ring-none focus-visible:ring-[0px] transition-all touch-manipulation pb-2",
              (isFocused || searchTopic.trim()) ? "border-teal-500 focus-visible:border-teal-500" : ""
            )}
            maxLength={256}
            disabled={isSubmitting}
            autoComplete="off"
            autoCapitalize="words"
            spellCheck="true"
          />
          <Button
            type="submit"
            disabled={!searchTopic.trim() || isSubmitting}
            className="bg-teal-500 flex items-center justify-center m-auto mr-0 size-12 xs:size-14 sm:size-16 text-background hover:bg-teal-500/90 transition-all cursor-pointer border border-teal-500 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            <ArrowRight className="size-5 xs:size-6 sm:size-7" />
          </Button>
        </div>
      </form>
      <div className="text-lg font-light flex flex-col gap-3">
        <div>Suggested topics</div>
        <SuggestedTopics
          topics={[
            "Climate Change",
            "Artificial Intelligence",
            "Mental Health",
            "Cryptocurrency",
            "Space Exploration"
          ]}
          onTopicClick={handleSuggestedTopicClick}
        />
      </div>
    </div>
  );
};

export default TopicSearch;