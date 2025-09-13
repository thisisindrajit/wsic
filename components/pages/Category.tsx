"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import TopicGrid from "@/components/content/TopicGrid";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import CategoryCard from "../content/CategoryCard";
import { FC } from "react";

interface CategoryPageContentProps {
    slug: string;
}

const Category: FC<CategoryPageContentProps> = ({ slug }) => {
    // Get category details
    const category = useQuery(api.categories.getCategoryBySlug, { slug });

    if (category === undefined) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    if (category === null) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4 mt-3 mb-6">
                    <Link href="/user/explore">
                        <Button variant="secondary" size="sm" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Explore
                        </Button>
                    </Link>
                </div>
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">Category not found</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            {/* Header */}
            <div className="flex items-center gap-4 mt-3 mb-6">
                <Link href="/user/explore">
                    <Button variant="secondary" size="sm" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Explore
                    </Button>
                </Link>
            </div>

            {/* Category Card */}
            <CategoryCard category={category} />

            {/* Topics Grid */}
            <div>
                <h2 className="text-xl font-medium mb-4">Topics in this category</h2>
                <TopicGrid categoryId={category._id} />
            </div>
        </div>
    );
}

export default Category;