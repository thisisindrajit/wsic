"use client"

import React from 'react';
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
    return (
        <div className="group relative overflow-hidden rounded-3xl backdrop-blur-xl bg-background/5 border hover:bg-background/10 transition-all w-full">
            {/* Full Background Image with Overlay */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden">
                <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-400 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/75 to-transparent" />
            </div>
            {/* Content Overlay */}
            <div className="relative z-10 p-6 h-full flex flex-col justify-end aspect-[2/2.5]">
                <div className="space-y-3">
                    <h3 className="text-2xl/normal font-medium text-background drop-shadow-lg line-clamp-2">{title}</h3>
                    <p className="text-background/90 text-sm leading-relaxed drop-shadow-md line-clamp-2">
                        {description}
                    </p>
                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-background/80">
                        <span><strong className="text-background">{likes}</strong> Likes</span>
                        <span><strong className="text-background">{shares}</strong> Shares</span>
                    </div>
                    <div className="flex items-center gap-2 w-full">
                        <Button className="rounded-full backdrop-blur-md bg-background/10 border border-background/20 text-background hover:text-background hover:bg-background/20 hover:border-background/30 transition-all duration-200 shadow-lg touch-manipulation active:scale-95 min-h-[44px] min-w-[44px]"
                            variant="ghost"
                            size="icon"
                        >
                            <Heart className="w-5 h-5 text-background" />
                        </Button>
                        <Button className="rounded-full backdrop-blur-md bg-background/10 border border-background/20 text-background hover:text-background hover:bg-background/20 hover:border-background/30 transition-all duration-200 shadow-lg touch-manipulation active:scale-95 min-h-[44px] min-w-[44px]"
                            variant="ghost"
                            size="icon"
                        >
                            <Bookmark className="w-5 h-5 text-background" />
                        </Button>
                        <Button className="flex-1 rounded-full backdrop-blur-md bg-background/10 border border-background/20 text-background hover:text-background hover:bg-background/20 hover:border-background/30 transition-all duration-200 shadow-lg touch-manipulation active:scale-95 min-h-[44px]"
                            variant="ghost"
                        >
                            View
                        </Button>
                    </div>
                </div>
            </div>
            {/* Additional glassmorphism glow */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-background/10 via-transparent to-background/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>
    );
};

export default Block;