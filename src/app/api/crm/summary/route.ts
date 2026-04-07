import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-guards"

export async function GET() {
  try {
    const session = await requireRole(["ADMIN", "RECEPTION"])
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const [dealsTotal, openDeals, wonDeals, tasksOpen, tasksDueSoon, activitiesToday, pipelineValue] = await Promise.all([
      prisma.crmDeal.count(),
      prisma.crmDeal.count({ where: { stage: { in: ["LEAD", "CONTACT", "PROPOSAL", "NEGOTIATION"] } } }),
      prisma.crmDeal.count({ where: { stage: "WON" } }),
      prisma.crmTask.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
      prisma.crmTask.count({
        where: {
          status: { in: ["OPEN", "IN_PROGRESS"] },
          dueDate: {
            lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.crmActivity.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.crmDeal.aggregate({
        _sum: {
          value: true,
        },
        where: {
          stage: { in: ["LEAD", "CONTACT", "PROPOSAL", "NEGOTIATION"] },
        },
      }),
    ])

    return NextResponse.json({
      dealsTotal,
      openDeals,
      wonDeals,
      tasksOpen,
      tasksDueSoon,
      activitiesToday,
      pipelineValue: pipelineValue._sum.value ?? 0,
    })
  } catch {
    return NextResponse.json({ error: "Erro ao carregar resumo CRM" }, { status: 500 })
  }
}
