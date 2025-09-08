import TopicSearch from "@/components/features/TopicSearch";
import TopicGrid from "@/components/content/TopicGrid";
import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { APP_NAME, APP_SHORT_NAME } from "@/constants/common";

export async function generateMetadata(): Promise<Metadata> {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    return {
        title: `${session?.user.name}'s Dashboard - ${APP_NAME}`,
        description: `This is the ${APP_SHORT_NAME} dashboard for ${session?.user.name}`,
    };
}

const UserDashboard = () => {
    return (
        <>
            <TopicSearch />
            <TopicGrid />
        </>
    );
};

export default UserDashboard;