import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { APP_NAME, APP_SHORT_NAME } from "@/constants/common";

export async function generateMetadata(): Promise<Metadata> {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    return {
        title: `${session?.user.name}'s Saved Topics - ${APP_NAME}`,
        description: `This is the ${APP_SHORT_NAME} saved topics for ${session?.user.name}`,
    };
}

const SavedPage = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl xs:text-4xl lg:text-4xl/normal font-light">Saved</h1>
                <p className="text-muted-foreground">Your bookmarked topics</p>
            </div>

            <div className="text-center py-12">
                <p className="text-muted-foreground">Saved content feature coming soon...</p>
            </div>
        </div>
    );
};

export default SavedPage;