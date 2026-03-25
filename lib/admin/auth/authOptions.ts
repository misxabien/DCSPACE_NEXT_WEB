import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import type { AuthOptions } from "next-auth";
import type { DefaultSession } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaClient } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: string;
      organization?: string | null;
      isActive?: boolean;
    };
  }

  interface User {
    id: string;
    role: string;
    organization?: string | null;
    isActive?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    organization?: string | null;
    isActive?: boolean;
  }
}

const globalForPrisma = globalThis as unknown as {
  adminAuthPrisma?: PrismaClient;
};

const prisma = globalForPrisma.adminAuthPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.adminAuthPrisma = prisma;
}

function getModel<T = any>(...names: string[]): T | null {
  const prismaRecord = prisma as unknown as Record<string, T | undefined>;

  for (const name of names) {
    if (prismaRecord[name]) {
      return prismaRecord[name] as T;
    }
  }

  return null;
}

function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedPassword: string) {
  if (!storedPassword.includes(":")) {
    return storedPassword === password;
  }

  const [salt, storedHash] = storedPassword.split(":");
  const candidateHash = scryptSync(password, salt, 64);
  const expectedHash = Buffer.from(storedHash, "hex");

  if (candidateHash.length !== expectedHash.length) {
    return false;
  }

  return timingSafeEqual(candidateHash, expectedHash);
}

const allowedGoogleDomain = process.env.ALLOWED_GOOGLE_DOMAIN ?? "sdca.edu.ph";

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const userModel =
          getModel<any>("user", "users", "accountUser", "accountUsers");

        if (!userModel) {
          return null;
        }

        const user = await userModel.findFirst({
          where: {
            email: credentials.email,
          },
        });

        if (!user || user.isActive === false) {
          return null;
        }

        const storedPassword = user.passwordHash ?? user.password;

        if (!storedPassword) {
          return null;
        }

        if (!verifyPassword(credentials.password, storedPassword)) {
          return null;
        }

        return {
          id: String(user.id),
          name: user.name ?? user.fullName ?? user.email,
          email: user.email,
          role: user.role ?? "student",
          organization: user.organization?.name ?? user.organizationName ?? null,
          isActive: user.isActive ?? true,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: false,
    }),
  ],
  callbacks: {
    async signIn({ account, profile, user }) {
      if (account?.provider !== "google") {
        return true;
      }

      const email = profile?.email ?? user.email;

      if (!email) {
        return false;
      }

      return email.toLowerCase().endsWith(`@${allowedGoogleDomain}`);
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.organization = user.organization ?? null;
        token.isActive = user.isActive ?? true;
      }

      return token as JWT;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role ?? "student";
        session.user.organization = token.organization ?? null;
        session.user.isActive = token.isActive ?? true;
      }

      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
