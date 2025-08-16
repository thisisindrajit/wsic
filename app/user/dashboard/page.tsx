import { APP_NAME, APP_SHORT_NAME } from "@/constants/common";
import { auth } from "@/lib/auth";
import { Metadata } from "next";
import { headers } from "next/headers";

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
            <div>User dashboard</div>
        </>
    );
};

export default UserDashboard;