import { NextResponse } from "next/server"

import { requireRole } from "@/lib/auth-guards"
import { prisma } from "@/lib/prisma"

const BOOKING_ROOMS = ["reuniao", "treinamento", "coworking", "arapiraca", "auditorio", "sala_arapiraca"]
const OPERATIONAL_SLOTS_PER_DAY = 8

const bookingStatusLabel: Record<string, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  COMPLETED: "Concluido",
}

const leadStatusLabel: Record<string, string> = {
  NEW: "Novo",
  CONTACTED: "Contatado",
  QUALIFIED: "Qualificado",
  LOST: "Perdido",
}

const contractTypeLabel: Record<string, string> = {
  UPLOADED: "PDF anexado",
  GENERATED: "Gerado",
}

const roomLabel: Record<string, string> = {
  reuniao: "Reuniao",
  treinamento: "Treinamento",
  coworking: "Coworking",
  arapiraca: "Arapiraca",
  auditorio: "Auditorio",
  sala_arapiraca: "Sala Arapiraca",
}

const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

export async function GET(request: Request) {
  try {
    const session = await requireRole(["ADMIN", "RECEPTION"])
    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const periodRaw = Number(searchParams.get("period") || "30")
    const periodDays = Number.isFinite(periodRaw) && periodRaw > 0 ? periodRaw : 30

    const now = new Date()
    const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)

    const monthlyWindowStart = new Date(now.getFullYear(), now.getMonth() - 5, 1)

    const [
      totalClients,
      leadsInPeriod,
      openDeals,
      activeBookings,
      contractsInPeriod,
      invoicesOpenAgg,
      invoicesPaidAgg,
      invoicesIssuedAgg,
      bookingsByRoomRaw,
      bookingsByStatusRaw,
      leadsByStatusRaw,
      contractsByTypeRaw,
      invoicesMonthlyRaw,
      topClientsRaw,
    ] = await Promise.all([
      prisma.client.count(),
      prisma.lead.count({ where: { createdAt: { gte: periodStart, lte: now } } }),
      prisma.crmDeal.count({ where: { stage: { in: ["LEAD", "CONTACT", "PROPOSAL", "NEGOTIATION"] } } }),
      prisma.booking.count({
        where: {
          date: { gte: periodStart, lte: now },
          status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
        },
      }),
      prisma.contract.count({ where: { createdAt: { gte: periodStart, lte: now } } }),
      prisma.invoice.aggregate({
        _sum: { balance: true },
        where: { status: { in: ["DRAFT", "ISSUED", "PARTIAL", "OVERDUE"] } },
      }),
      prisma.invoice.aggregate({
        _sum: { paidAmount: true },
        where: { issueDate: { gte: periodStart, lte: now } },
      }),
      prisma.invoice.aggregate({
        _sum: { total: true },
        where: { issueDate: { gte: periodStart, lte: now } },
      }),
      prisma.booking.groupBy({
        by: ["room"],
        _count: { _all: true },
        where: {
          date: { gte: periodStart, lte: now },
          status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
        },
      }),
      prisma.booking.groupBy({
        by: ["status"],
        _count: { _all: true },
        where: { date: { gte: periodStart, lte: now } },
      }),
      prisma.lead.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.contract.groupBy({
        by: ["type"],
        _count: { _all: true },
        where: { createdAt: { gte: periodStart, lte: now } },
      }),
      prisma.invoice.findMany({
        where: { issueDate: { gte: monthlyWindowStart, lte: now } },
        select: { issueDate: true, total: true, paidAmount: true },
      }),
      prisma.invoice.groupBy({
        by: ["clientId"],
        _sum: { total: true, paidAmount: true },
        _count: { _all: true },
        where: { issueDate: { gte: periodStart, lte: now } },
        orderBy: { _sum: { total: "desc" } },
        take: 5,
      }),
    ])

    const occupiedSlots = bookingsByRoomRaw.reduce((acc, item) => acc + item._count._all, 0)
    const daysWindow = Math.max(1, Math.ceil((now.getTime() - periodStart.getTime()) / (24 * 60 * 60 * 1000)))
    const totalSlots = daysWindow * BOOKING_ROOMS.length * OPERATIONAL_SLOTS_PER_DAY
    const occupancyRate = totalSlots > 0 ? Math.min(100, (occupiedSlots / totalSlots) * 100) : 0

    const monthlyMap = new Map<string, { issued: number; received: number }>()
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      monthlyMap.set(monthKey(d), { issued: 0, received: 0 })
    }

    for (const invoice of invoicesMonthlyRaw) {
      const key = monthKey(invoice.issueDate)
      const current = monthlyMap.get(key)
      if (!current) continue
      current.issued += Number(invoice.total || 0)
      current.received += Number(invoice.paidAmount || 0)
    }

    const monthlyRevenue = Array.from(monthlyMap.entries()).map(([key, values]) => {
      const [year, month] = key.split("-")
      const monthLabel = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("pt-BR", {
        month: "short",
      })
      return {
        month: monthLabel,
        issued: Number(values.issued.toFixed(2)),
        received: Number(values.received.toFixed(2)),
      }
    })

    const clientIds = topClientsRaw.map((item) => item.clientId)
    const clients = clientIds.length
      ? await prisma.client.findMany({ where: { id: { in: clientIds } }, select: { id: true, name: true } })
      : []

    const clientNameMap = new Map(clients.map((c) => [c.id, c.name]))

    return NextResponse.json({
      periodDays,
      kpis: {
        totalClients,
        leadsInPeriod,
        openDeals,
        activeBookings,
        occupancyRate: Number(occupancyRate.toFixed(1)),
        invoicesOpen: Number(invoicesOpenAgg._sum.balance || 0),
        invoicesReceived: Number(invoicesPaidAgg._sum.paidAmount || 0),
        invoicesIssued: Number(invoicesIssuedAgg._sum.total || 0),
        contractsInPeriod,
      },
      charts: {
        bookingsByRoom: bookingsByRoomRaw.map((item) => ({
          key: item.room,
          room: roomLabel[item.room] || item.room,
          value: item._count._all,
        })),
        bookingsByStatus: bookingsByStatusRaw.map((item) => ({
          key: item.status,
          status: bookingStatusLabel[item.status] || item.status,
          value: item._count._all,
        })),
        leadsByStatus: leadsByStatusRaw.map((item) => ({
          key: item.status,
          status: leadStatusLabel[item.status] || item.status,
          value: item._count._all,
        })),
        contractsByType: contractsByTypeRaw.map((item) => ({
          key: item.type,
          type: contractTypeLabel[item.type] || item.type,
          value: item._count._all,
        })),
        monthlyRevenue,
      },
      topClients: topClientsRaw.map((item) => ({
        clientId: item.clientId,
        clientName: clientNameMap.get(item.clientId) || "Cliente",
        invoices: item._count._all,
        issued: Number(item._sum.total || 0),
        received: Number(item._sum.paidAmount || 0),
      })),
    })
  } catch {
    return NextResponse.json({ error: "Erro ao carregar relatorios" }, { status: 500 })
  }
}
