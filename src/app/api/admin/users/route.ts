import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(["ADMIN", "RECEPTION"]).default("RECEPTION"),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
    }

    const users = await prisma.adminUser.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ data: users })
  } catch {
    return NextResponse.json({ error: "Erro ao buscar usuários" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
    }

    const body = await request.json()
    const payload = createUserSchema.parse(body)

    const email = payload.email.toLowerCase().trim()
    const existingUser = await prisma.adminUser.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: "Já existe usuário com esse e-mail" }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(payload.password, 12)

    const user = await prisma.adminUser.create({
      data: {
        name: payload.name,
        email,
        passwordHash,
        role: payload.role,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: "Falha de validação", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 })
  }
}
