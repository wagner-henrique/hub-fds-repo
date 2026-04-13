import bcrypt from "bcryptjs"
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import { consumeRateLimit, getIpFromHeaderBag } from "@/lib/rate-limit"

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credenciais",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null

        const email = credentials.email.toLowerCase().trim()
        const ip = getIpFromHeaderBag((req as any)?.headers)
        const globalLoginAttempt = consumeRateLimit(`auth-login-ip:${ip}`, 20, 10 * 60_000)
        if (!globalLoginAttempt.ok) return null

        const identityLoginAttempt = consumeRateLimit(`auth-login:${email}:${ip}`, 8, 10 * 60_000)
        if (!identityLoginAttempt.ok) return null

        const user = await prisma.adminUser.findUnique({ where: { email } })
        if (!user || !user.isActive) return null

        const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash)

        if (!isValidPassword) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email
      }
      if (user?.id) {
        token.sub = user.id
      }
      if ((user as any)?.role) {
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = token.email
      }
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      if (session.user && token.role) {
        session.user.role = token.role as "ADMIN" | "RECEPTION"
      }
      return session
    },
  },
}
