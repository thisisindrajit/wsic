"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Bookmark, Heart } from 'lucide-react';

interface TrendingBlockProps {
    imageUrl: string;
    title: string;
    description: string;
    likes: number;
    shares: number;
}

const Block: React.FC<TrendingBlockProps> = ({
    imageUrl,
    title,
    description,
    likes,
    shares
}) => {
    const [imageError, setImageError] = useState(false);
    return (
        <div className="group relative overflow-hidden rounded-3xl backdrop-blur-xl bg-white/10 dark:bg-black/20 border border-neutral-200 dark:border-neutral-900 hover:bg-white/20 dark:hover:bg-black/30 transition-all w-full shadow-xl">
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent dark:from-black/98 dark:via-black/80 dark:to-transparent" />
            </div>
            {/* Content Overlay */}
            <div className="relative z-10 p-6 h-full flex flex-col justify-end aspect-[2/2.5]">
                <div className="space-y-3">
                    <h3 className="text-2xl/normal font-medium text-white drop-shadow-lg line-clamp-2">{title}</h3>
                    <p className="text-white/90 text-sm leading-relaxed drop-shadow-md line-clamp-2">
                        {description}
                    </p>
                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-white/80">
                        <span><strong className="text-white">{likes}</strong> Likes</span>
                        <span><strong className="text-white">{shares}</strong> Shares</span>
                    </div>
                    <div className="flex items-center gap-2 w-full">
                        <Button className="rounded-full backdrop-blur-md bg-white/20 dark:bg-white/10 border border-white/30 dark:border-white/20 text-white hover:text-white hover:bg-white/30 dark:hover:bg-white/20 hover:border-white/40 dark:hover:border-white/30 transition-all duration-200 shadow-lg touch-manipulation active:scale-95 min-h-[44px] min-w-[44px]"
                            variant="ghost"
                            size="icon"
                        >
                            <Heart className="w-5 h-5 text-white" />
                        </Button>
                        <Button className="rounded-full backdrop-blur-md bg-white/20 dark:bg-white/10 border border-white/30 dark:border-white/20 text-white hover:text-white hover:bg-white/30 dark:hover:bg-white/20 hover:border-white/40 dark:hover:border-white/30 transition-all duration-200 shadow-lg touch-manipulation active:scale-95 min-h-[44px] min-w-[44px]"
                            variant="ghost"
                            size="icon"
                        >
                            <Bookmark className="w-5 h-5 text-white" />
                        </Button>
                        <Button className="flex-1 rounded-full backdrop-blur-md bg-white/20 dark:bg-white/10 border border-white/30 dark:border-white/20 text-white hover:text-white hover:bg-white/30 dark:hover:bg-white/20 hover:border-white/40 dark:hover:border-white/30 transition-all duration-200 shadow-lg touch-manipulation active:scale-95 min-h-[44px]"
                            variant="ghost"
                        >
                            View
                        </Button>
                    </div>
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