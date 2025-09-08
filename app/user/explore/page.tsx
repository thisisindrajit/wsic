import { Metadata } from "next";
import { APP_NAME, APP_SHORT_NAME } from "@/constants/common";

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: `Explore - ${APP_NAME}`,
        description: `This is the ${APP_SHORT_NAME} explore page`,
    };
}

const ExplorePage = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl xs:text-4xl lg:text-4xl/normal font-light">Explore</h1>
                <p className="text-muted-foreground">Discover trending topics</p>
            </div>

            <div className="text-center py-12">
                <p className="text-muted-foreground">Explore feature coming soon...</p>
            </div>
        </div>
    );
};

export default ExplorePage;