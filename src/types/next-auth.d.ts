import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id?: string
      role?: "ADMIN" | "RECEPTION"
    } & DefaultSession["user"]
  }

  interface User {
    role?: "ADMIN" | "RECEPTION"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "ADMIN" | "RECEPTION"
  }
}
