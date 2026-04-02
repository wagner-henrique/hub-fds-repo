import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { requireRole } from "@/lib/auth-guards"
import { prisma } from "@/lib/prisma"

const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  role: z.enum(["ADMIN", "RECEPTION"]).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).max(128).optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["ADMIN"])
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const payload = updateUserSchema.parse(body)

    const data: {
      name?: string
      role?: "ADMIN" | "RECEPTION"
      isActive?: boolean
      passwordHash?: string
    } = {}

    if (payload.name !== undefined) data.name = payload.name
    if (payload.role !== undefined) data.role = payload.role
    if (payload.isActive !== undefined) data.isActive = payload.isActive
    if (payload.password) data.passwordHash = await bcrypt.hash(payload.password, 12)

    const updatedUser = await prisma.adminUser.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: "Falha de validação", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Erro ao atualizar usuário" }, { status: 500 })
  }
}
