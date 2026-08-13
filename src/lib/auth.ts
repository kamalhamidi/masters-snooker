import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ensurePlayerProfile, isStaffRole } from "@/lib/player";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: Role;
      avatarUrl?: string | null;
      playerId?: string | null;
      employeeId?: string | null;
    };
  }
  interface User {
    role: Role;
    playerId?: string | null;
    employeeId?: string | null;
    avatarUrl?: string | null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: { player: true, employee: true },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        // Staff & owners play too — ensure a player profile exists at login
        let playerId = user.player?.id ?? null;
        if (!playerId && isStaffRole(user.role)) {
          const player = await ensurePlayerProfile(user.id, user.role);
          playerId = player.id;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
          playerId,
          employeeId: user.employee?.id ?? null,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.playerId = user.playerId;
        token.employeeId = user.employeeId;
        token.avatarUrl = user.avatarUrl;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      session.user.playerId = token.playerId as string | null;
      session.user.employeeId = token.employeeId as string | null;
      session.user.avatarUrl = token.avatarUrl as string | null;

      // Back-fill playerId for staff who logged in before profiles were provisioned
      if (!session.user.playerId && isStaffRole(session.user.role)) {
        const player = await ensurePlayerProfile(session.user.id, session.user.role);
        session.user.playerId = player.id;
        token.playerId = player.id;
      }

      return session;
    },
  },
});

/** Server-side guard: returns session or throws redirect-worthy null. */
export async function requireRole(...roles: Role[]) {
  const session = await auth();
  if (!session?.user || !roles.includes(session.user.role)) return null;
  return session;
}
