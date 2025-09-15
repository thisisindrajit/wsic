import SearchResults from "@/components/pages/SearchResults";
import { APP_NAME, APP_SHORT_NAME } from "@/constants/common";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: `Search - ${APP_NAME}`,
        description: `This is the ${APP_SHORT_NAME} search page`,
    };
}

export default function SearchPage() {
  return <SearchResults />;
}