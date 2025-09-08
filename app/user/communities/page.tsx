import { Metadata } from "next";
import { APP_NAME, APP_SHORT_NAME } from "@/constants/common";

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: `Communities - ${APP_NAME}`,
        description: `This is the ${APP_SHORT_NAME} communities page`,
    };
}

const CommunitiesPage = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl xs:text-4xl lg:text-4xl/normal font-light">Communities</h1>
                <p className="text-muted-foreground">Connect with like-minded learners</p>
            </div>

            <div className="text-center py-12">
                <p className="text-muted-foreground">Communities feature coming soon...</p>
            </div>
        </div>
    );
};

export default CommunitiesPage;