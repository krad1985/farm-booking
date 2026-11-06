import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        account: { label: "帳號", type: "text" },
        password: { label: "密碼", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.account || !credentials?.password) return null;
        const account = String(credentials.account).trim();
        const password = String(credentials.password);

        // 1. Try find by email
        let user = await prisma.user.findUnique({ where: { email: account } });

        // 2. Try find by phone
        if (!user) {
          user = await prisma.user.findFirst({ where: { phone: account } });
        }

        // 3. Try find by student code
        if (!user) {
          const student = await prisma.student.findFirst({ where: { studentCode: account }, include: { user: true } });
          if (student?.user) {
            user = student.user;
          }
        }

        if (!user || !user.passwordHash || !user.isActive) return null;
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          venueId: user.venueId,
          classroomId: user.classroomId,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.venueId = (user as any).venueId;
        token.classroomId = (user as any).classroomId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).venueId = token.venueId;
        (session.user as any).classroomId = token.classroomId;
      }
      return session;
    },
  },
});
