import { Profile } from "@/components/pages";
import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { APP_NAME, APP_SHORT_NAME } from "@/constants/common";

export async function generateMetadata(): Promise<Metadata> {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    return {
        title: `${session?.user.name}'s Profile - ${APP_NAME}`,
        description: `This is the ${APP_SHORT_NAME} profile for ${session?.user.name}`,
    };
}

const ProfilePage = () => {
    return <Profile />
};

export default ProfilePage;