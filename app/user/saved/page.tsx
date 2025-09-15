import { Saved } from "@/components/pages";
import { APP_NAME, APP_SHORT_NAME } from "@/constants/common";
import { auth } from "@/lib/auth";
import { Metadata } from "next";
import { headers } from "next/headers";

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
    return <Saved />;
};

export default SavedPage;