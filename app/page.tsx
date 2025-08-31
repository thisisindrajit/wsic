import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CALLBACK_URL } from "@/constants/common";
import { Home } from "@/components/pages";

const HomePage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // If user is authenticated, navigate to dashboard page
  if (session) {
    redirect(CALLBACK_URL);
  }

  return <Home />;
};

export default HomePage;