"use client";

import { useCategories } from "@/hooks/useTopics";
import CategoryCard from "@/components/content/CategoryCard";
import { Loader2, AlertCircle } from "lucide-react";

export default function ExploreContent() {
    const { data: categories, isLoading, isError } = useCategories();

    if (isError) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl xs:text-4xl lg:text-4xl/normal font-light">Explore</h1>
                    <p className="text-muted-foreground">Discover topics by category</p>
                </div>
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">Failed to load categories</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl xs:text-4xl lg:text-4xl/normal font-light">Explore</h1>
                <p className="text-muted-foreground">Discover topics by category</p>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {categories?.map((category) => (
                        <CategoryCard
                            key={category._id}
                            category={category}
                        />
                    ))}
                </div>
            )}

            {categories && categories.length === 0 && !isLoading && (
                <div className="text-center py-12 text-muted-foreground">
                    <p>No categories found</p>
                </div>
            )}
        </div>
    );
}