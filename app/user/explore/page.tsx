import { Metadata } from "next";
import { APP_NAME, APP_SHORT_NAME } from "@/constants/common";
import ExploreContent from "@/components/pages/ExploreContent";

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: `Explore - ${APP_NAME}`,
        description: `This is the ${APP_SHORT_NAME} explore page - discover trending topics by category`,
    };
}

const ExplorePage = () => {
    return <ExploreContent />;
};

export default ExplorePage;