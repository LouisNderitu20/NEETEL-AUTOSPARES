import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

import { checkRateLimit } from "@/lib/rate-limit";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES || "15", 10) * 60,
    updateAge: Math.min(
      5 * 60,
      Math.floor((parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES || "15", 10) * 60) / 3)
    ),
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = (credentials.email as string).trim().toLowerCase();

        
        const rateLimitResult = await checkRateLimit(`login:${email}`, {
          limit: 5,
          windowMs: 60 * 1000,
        });

        if (!rateLimitResult.success) {
          console.warn(`[Security Alert] Rate limit exceeded for login attempt on email: ${email}`);
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user || !user.isActive) {
            return null;
          }

          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!isValid) {
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
          };
        } catch (error) {
          console.error("Error in authorize:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.avatar = (user as any).avatar;
      }
      if (token?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { isActive: true, role: true, avatar: true },
        });
        if (!dbUser || !dbUser.isActive) {
          return {} as any;
        }
        token.role = dbUser.role;
        token.avatar = dbUser.avatar;
      }
      return token;
    },
    async session({ session, token }) {
      if (!token || !token.id) {
        return null as any;
      }
      session.user.id = token.id as string;
      session.user.role = token.role as UserRole;
      session.user.avatar = token.avatar as string | null;
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (user?.id) {
        try {
          
          await prisma.sessionLog.updateMany({
            where: { userId: user.id, logoutAt: null },
            data: { logoutAt: new Date() },
          });

          await prisma.sessionLog.create({
            data: {
              userId: user.id,
              loginAt: new Date(),
            },
          });
        } catch (e) {
          console.error("Failed to log sign in event:", e);
        }
      }
    },
    async signOut(message) {
      try {
        const userId = ("token" in message && (message.token as any)?.id) || ("session" in message && (message.session as any)?.user?.id);
        if (userId) {
          const latest = await prisma.sessionLog.findFirst({
            where: { userId: userId as string, logoutAt: null },
            orderBy: { loginAt: "desc" },
          });
          if (latest) {
            await prisma.sessionLog.update({
              where: { id: latest.id },
              data: { logoutAt: new Date() },
            });
          }
        }
      } catch (e) {
        console.error("Failed to log sign out event:", e);
      }
    },
  },
});
