import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { APP_NAME, APP_SHORT_NAME } from "@/constants/common";

export async function generateMetadata(): Promise<Metadata> {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    return {
        title: `${session?.user.name}'s Notes - ${APP_NAME}`,
        description: `This is the ${APP_SHORT_NAME} notes for ${session?.user.name}`,
    };
}

const NotesPage = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl xs:text-4xl lg:text-4xl/normal font-light">Notes</h1>
                <p className="text-muted-foreground">Your personal notes</p>
            </div>

            <div className="text-center py-12">
                <p className="text-muted-foreground">Notes feature coming soon...</p>
            </div>
        </div>
    );
};

export default NotesPage;