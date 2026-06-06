import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    ...authConfig.providers,
    Credentials({
      name: "Demo Account",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string) || "demo@cooking.com";
        
        let user = await prisma.user.findUnique({
          where: { email },
        });
        
        if (!user) {
          user = await prisma.user.create({
            data: {
              name: "Chef Gourmet (Demo)",
              email,
              image: "https://lh3.googleusercontent.com/a/default-user",
            },
          });
        }
        
        return user;
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-at-least-32-characters-long",
});
