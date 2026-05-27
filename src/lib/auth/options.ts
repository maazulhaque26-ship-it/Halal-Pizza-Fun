import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "@/lib/db/mongoose";
import { env } from "@/config/env";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          await connectDB();

          // Use raw MongoDB collection to guarantee the password field is
          // retrieved regardless of Mongoose projection defaults.
          const mongoose = (await import("mongoose")).default;
          const db = mongoose.connection.db!;
          const raw = await db.collection("users").findOne(
            { email: credentials.email.toLowerCase().trim() },
            { projection: { _id: 1, name: 1, email: 1, password: 1, role: 1,
                            branchId: 1, permissions: 1, isActive: 1, isArchived: 1 } }
          );

          if (!raw) {
            console.log("[auth] No user found for:", credentials.email);
            return null;
          }

          if (!raw.password) {
            console.log("[auth] User has no password hash — account may have been created without one");
            return null;
          }

          const isMatch = await bcrypt.compare(credentials.password, raw.password as string);
          if (!isMatch) {
            console.log("[auth] Password mismatch for:", credentials.email);
            return null;
          }

          return {
            id: raw._id.toString(),
            name: raw.name as string,
            email: raw.email as string,
            role: raw.role as string,
            branchId: raw.branchId?.toString(),
            permissions: (raw.permissions as string[]) || [],
          };
        } catch (err) {
          console.error("[auth] authorize error:", err);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.branchId = (user as any).branchId;
        token.permissions = (user as any).permissions || [];
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.branchId = token.branchId as string | undefined;
        session.user.permissions = token.permissions as string[];
      }
      return session;
    }
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60,   // Refresh JWT once per day (not every request)
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // Must match session maxAge
  },
  secret: env.NEXTAUTH_SECRET,
};
