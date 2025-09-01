"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Bookmark, Heart, Clock, Eye } from 'lucide-react';
import { DIFFICULTY_COLORS } from '@/constants/common';

interface TrendingBlockProps {
    imageUrl?: string;
    title: string;
    description: string;
    likes: number;
    shares: number;
    difficulty?: string;
    estimatedReadTime?: number;
    viewCount?: number;
}

const formatCount = (count: number): string => {
    if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
};

const getDifficultyPillStyle = (difficulty: string) => {
    return DIFFICULTY_COLORS[difficulty as keyof typeof DIFFICULTY_COLORS]?.pill || 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
};

const Block: React.FC<TrendingBlockProps> = ({
    imageUrl,
    title,
    description,
    likes,
    shares,
    difficulty,
    estimatedReadTime,
    viewCount
}) => {
    const [imageError, setImageError] = useState(false);
    return (
        <div
            className="group relative overflow-hidden rounded-3xl backdrop-blur-xl bg-white/10 dark:bg-black/20 border border-neutral-200 dark:border-neutral-900 hover:bg-white/20 dark:hover:bg-black/30 transition-all w-full shadow-xl cursor-pointer"
        >
            {/* Full Background Image with Overlay */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden">
                {!imageError && imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-400 group-hover:scale-110"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-teal-400 via-teal-500 to-teal-600 dark:from-teal-500 dark:via-teal-600 dark:to-teal-700 transition-transform duration-400 group-hover:scale-110" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/98 via-black/85 to-transparent dark:from-black/98 dark:via-black/80 dark:to-transparent" />
            </div>
            {/* Content Overlay */}
            <div className="relative z-10 p-6 h-full flex flex-col gap-3 justify-end aspect-[2/2.5]">
                <h3 className="text-2xl/normal font-medium text-white drop-shadow-lg line-clamp-2">{title}</h3>

                <p className="text-white/90 text-sm leading-relaxed drop-shadow-md line-clamp-2">
                    {description}
                </p>

                {/* Enhanced Stats with icons */}
                {(estimatedReadTime || viewCount) && (
                    <div className="flex items-center gap-2 text-sm text-white/80">
                        {estimatedReadTime && (
                            <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{estimatedReadTime} min</span>
                            </div>
                        )}
                        {viewCount && (
                            <div className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                <span>{formatCount(viewCount)}</span>
                            </div>
                        )}
                        {/* Difficulty badge */}
                        {difficulty && (
                            <div className="flex items-start">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold drop-shadow-lg ${getDifficultyPillStyle(difficulty)}`}>
                                    {difficulty.toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Likes and Shares */}
                <div className="flex items-center gap-2 text-sm text-white/80">
                    <span><strong className="text-white">{formatCount(likes)}</strong> Likes</span>
                    <span><strong className="text-white">{formatCount(shares)}</strong> Shares</span>
                </div>

                <div className="flex items-center gap-2 w-full mt-2">
                    <Button
                        className="rounded-full backdrop-blur-md bg-white/20 dark:bg-white/10 border border-white/30 dark:border-white/20 text-white hover:text-white hover:bg-white/30 dark:hover:bg-white/20 hover:border-white/40 dark:hover:border-white/30 transition-all duration-200 shadow-lg touch-manipulation active:scale-95 min-h-[44px] min-w-[44px]"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            // Handle like action
                        }}
                    >
                        <Heart className="w-5 h-5 text-white" />
                    </Button>
                    <Button
                        className="rounded-full backdrop-blur-md bg-white/20 dark:bg-white/10 border border-white/30 dark:border-white/20 text-white hover:text-white hover:bg-white/30 dark:hover:bg-white/20 hover:border-white/40 dark:hover:border-white/30 transition-all duration-200 shadow-lg touch-manipulation active:scale-95 min-h-[44px] min-w-[44px]"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            // Handle bookmark action
                        }}
                    >
                        <Bookmark className="w-5 h-5 text-white" />
                    </Button>
                    <Button
                        className="flex-1 rounded-full backdrop-blur-md bg-white/20 dark:bg-white/10 border border-white/30 dark:border-white/20 text-white hover:text-white hover:bg-white/30 dark:hover:bg-white/20 hover:border-white/40 dark:hover:border-white/30 transition-all duration-200 shadow-lg touch-manipulation active:scale-95 min-h-[44px]"
                        variant="ghost"
                    >
                        View
                    </Button>
                </div>
            </div>
            {/* Enhanced glassmorphism glow for both light and dark modes */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 via-transparent to-white/10 dark:from-white/10 dark:via-transparent dark:to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            {/* Additional rim light effect */}
            <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/20 dark:ring-white/10 group-hover:ring-white/30 dark:group-hover:ring-white/20 transition-all duration-300 pointer-events-none" />
        </div>
    );
};

export default Block;