import { Metadata } from "next";
import { APP_NAME } from "@/constants/common";
import Category from "@/components/pages/Category";

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  // Convert slug to title case for metadata
  const { slug: categoryName } = (await params)

  categoryName.split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    title: `Explore ${categoryName} - ${APP_NAME}`,
    description: `Explore topics in ${categoryName} category`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = (await params)

  return <Category slug={slug} />;
}