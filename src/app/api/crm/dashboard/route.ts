import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-guards"

const stages = ["LEAD", "CONTACT", "PROPOSAL", "NEGOTIATION", "WON", "LOST"] as const
const taskStatuses = ["OPEN", "IN_PROGRESS", "DONE", "CANCELED"] as const

export async function GET(request: Request) {
  try {
    const session = await requireRole(["ADMIN", "RECEPTION"])
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const stage = searchParams.get("dealStage")
    const taskStatus = searchParams.get("taskStatus")
    const period = searchParams.get("period")

    const periodDays = Number(period)
    const hasPeriod = Number.isFinite(periodDays) && periodDays > 0
    const periodStart = hasPeriod
      ? new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)
      : null

    const dealWhere: Prisma.CrmDealWhereInput = {
      ...(stage && stage !== "ALL" && stages.includes(stage as any) ? { stage: stage as any } : {}),
      ...(periodStart ? { OR: [{ expectedCloseDate: { gte: periodStart } }, { createdAt: { gte: periodStart } }] } : {}),
    }

    const taskWhere: Prisma.CrmTaskWhereInput = {
      ...(taskStatus && taskStatus !== "ALL" && taskStatuses.includes(taskStatus as any)
        ? { status: taskStatus as any }
        : {}),
      ...(periodStart ? { OR: [{ dueDate: { gte: periodStart } }, { createdAt: { gte: periodStart } }] } : {}),
    }

    const activityWhere: Prisma.CrmActivityWhereInput = {
      ...(periodStart ? { createdAt: { gte: periodStart } } : {}),
    }

    const [
      deals,
      tasks,
      activities,
      clients,
      dealsTotal,
      openDeals,
      wonDeals,
      tasksOpen,
      tasksDueSoon,
      activitiesToday,
      pipelineValue,
    ] = await Promise.all([
      prisma.crmDeal.findMany({
        where: dealWhere,
        take: 30,
        orderBy: { createdAt: "desc" },
        include: {
          client: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { tasks: true, activities: true },
          },
        },
      }),
      prisma.crmTask.findMany({
        where: taskWhere,
        take: 30,
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        include: {
          client: { select: { id: true, name: true } },
          deal: { select: { id: true, title: true } },
        },
      }),
      prisma.crmActivity.findMany({
        where: activityWhere,
        take: 40,
        orderBy: { createdAt: "desc" },
        include: {
          client: { select: { id: true, name: true } },
          deal: { select: { id: true, title: true } },
        },
      }),
      prisma.client.findMany({
        take: 200,
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
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
      summary: {
        dealsTotal,
        openDeals,
        wonDeals,
        tasksOpen,
        tasksDueSoon,
        activitiesToday,
        pipelineValue: pipelineValue._sum.value ?? 0,
      },
      deals,
      tasks,
      activities,
      clients,
    })
  } catch {
    return NextResponse.json({ error: "Erro ao carregar dashboard CRM" }, { status: 500 })
  }
}
