import { createAuthClient } from "better-auth/react";
import { auth } from "./auth";

const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
});

export const { signIn, signUp, signOut, useSession } = authClient;
export type Session = typeof auth.$Infer.Session;