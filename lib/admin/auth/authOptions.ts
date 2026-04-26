import type { AuthOptions } from "next-auth";
import type { DefaultSession } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { findUserByEmail, loginUser } from "../db/users";

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

export type SessionUserPayload = {
  id: string;
  name: string;
  email: string;
  role: string;
  organization: string | null;
  isActive: boolean;
};

const allowedGoogleDomain = process.env.ALLOWED_GOOGLE_DOMAIN ?? "sdca.edu.ph";

/**
 * Returns the Google SSO metadata needed by the admin login flow.
 */
export function getGoogleSsoConfig(callbackUrl?: string) {
  const resolvedCallbackUrl = callbackUrl?.trim() ? callbackUrl : "/admin/dashboard";

  return {
    provider: "google" as const,
    allowedDomain: allowedGoogleDomain,
    callbackUrl: resolvedCallbackUrl,
    signInPath: `/api/auth/signin/google?callbackUrl=${encodeURIComponent(resolvedCallbackUrl)}`,
    registerPath: "/register",
    sessionStrategy: "jwt" as const,
  };
}

/**
 * Builds the token and session payload returned by the admin auth routes.
 */
export function buildSessionPayload(user: SessionUserPayload, callbackUrl?: string) {
  return {
    callbackUrl: callbackUrl?.trim() ? callbackUrl : "/admin/dashboard",
    user,
    tokenClaims: {
      sub: user.id,
      role: user.role,
      organization: user.organization,
      isActive: user.isActive,
    },
    session: {
      strategy: "jwt" as const,
      user,
    },
  };
}

/**
 * Returns true when the provided email belongs to the allowed Google Workspace domain.
 */
export function isAllowedGoogleEmail(email: string) {
  return email.trim().toLowerCase().endsWith(`@${allowedGoogleDomain}`);
}

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

        try {
          return await loginUser({
            email: credentials.email,
            password: credentials.password,
          });
        } catch {
          return null;
        }
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

      const email = (profile?.email ?? user.email ?? "").toLowerCase();

      if (!email || !isAllowedGoogleEmail(email)) {
        return false;
      }

      const registeredUser = await findUserByEmail(email);
      return Boolean(
        registeredUser &&
          registeredUser.role === "admin" &&
          registeredUser.isActive !== false,
      );
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


