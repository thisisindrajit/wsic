import Topic from "@/components/pages/Topic";
import { Metadata } from "next";
import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { Id } from "@/convex/_generated/dataModel";
import { APP_NAME } from "@/constants/common";

interface TopicPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: TopicPageProps): Promise<Metadata> {
  // Convert slug to title case for metadata
  const { id } = (await params)

  const data = await fetchQuery(api.topics.getTopicById, {
    topicId: id as Id<"topics">,
  });

  return {
    title: `${data?.topic.title} - ${APP_NAME}`,
    description: `${data?.topic.description}`,
  };
}

const TopicPage = () => {
  return <Topic />;
};

export default TopicPage;