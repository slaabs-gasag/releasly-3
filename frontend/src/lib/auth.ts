import NextAuth from "next-auth";
import AzureAD from "next-auth/providers/azure-ad";
import Credentials from "next-auth/providers/credentials";

const devProvider = Credentials({
  id: "dev",
  name: "Dev Login",
  credentials: {},
  authorize() {
    if (process.env.NEXT_PUBLIC_DEV_AUTH !== "true") return null;
    return {
      id: "dev-user",
      name: "Dev User",
      email: "dev@localhost",
    };
  },
});

const providers =
  process.env.NEXT_PUBLIC_DEV_AUTH === "true"
    ? [AzureAD, devProvider]
    : [AzureAD];

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
});
