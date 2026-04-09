"use client"

import { useCallback, useEffect, useState } from "react"
import { signOut } from "next-auth/react"
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { showError } from "@/utils/toast"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type ReportSummary = {
  kpis?: {
    totalClients?: number
    activeBookings?: number
    invoicesIssued?: number
    occupancyRate?: number
    leadsInPeriod?: number
    openDeals?: number
  }
  charts?: {
    monthlyRevenue?: Array<{ month: string; issued: number; received: number }>
    bookingsByStatus?: Array<{ key: string; status: string; value: number }>
    bookingsByRoom?: Array<{ key: string; room: string; value: number }>
    leadsByStatus?: Array<{ key: string; status: string; value: number }>
  }
  topClients?: Array<{
    clientId: string
    clientName: string
    invoices: number
    issued: number
    received: number
  }>
}

type ReportsTabProps = {
  tableHeadBaseClass: string
  tableCellBaseClass: string
}

const pieColors = ["#0f766e", "#2563eb", "#dc2626", "#f59e0b"]

export function ReportsTab({ tableHeadBaseClass, tableCellBaseClass }: ReportsTabProps) {
  const [periodFilter, setPeriodFilter] = useState("30")
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ReportSummary | null>(null)

  const fetchReportsData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/reports/summary?period=${periodFilter}`)

      if (response.status === 401 || response.status === 403) {
        await signOut({ callbackUrl: "/login" })
        return
      }

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || "Falha ao carregar relatorios")
      }

      setData(payload)
    } catch {
      showError("Erro ao carregar relatorios.")
    } finally {
      setLoading(false)
    }
  }, [periodFilter])

  useEffect(() => {
    fetchReportsData()
  }, [fetchReportsData])

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border border-slate-100 bg-white p-4 shadow-none">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="h-9 w-[190px] rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent className="z-50 rounded-xl border border-slate-200 bg-white shadow-lg">
              <SelectItem value="7">Ultimos 7 dias</SelectItem>
              <SelectItem value="30">Ultimos 30 dias</SelectItem>
              <SelectItem value="90">Ultimos 90 dias</SelectItem>
              <SelectItem value="180">Ultimos 6 meses</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="rounded-xl" onClick={fetchReportsData}>
            Atualizar
          </Button>
          {loading && <span className="text-xs text-slate-500">Atualizando...</span>}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-3xl border border-slate-100 bg-white p-5 shadow-none">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Clientes cadastrados</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{data?.kpis?.totalClients ?? 0}</p>
        </Card>
        <Card className="rounded-3xl border border-slate-100 bg-white p-5 shadow-none">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Reservas ativas</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{data?.kpis?.activeBookings ?? 0}</p>
        </Card>
        <Card className="rounded-3xl border border-slate-100 bg-white p-5 shadow-none">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Faturado no periodo</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {Number(data?.kpis?.invoicesIssued || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </Card>
        <Card className="rounded-3xl border border-slate-100 bg-white p-5 shadow-none">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Taxa de ocupacao</p>
          <p className="mt-2 text-2xl font-semibold text-primary">{Number(data?.kpis?.occupancyRate || 0).toFixed(1)}%</p>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="rounded-3xl border border-slate-100 bg-white p-5 shadow-none xl:col-span-2">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Receita emitida x recebida</h3>
            <p className="text-sm text-slate-500">Evolucao mensal dos ultimos 6 meses.</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.charts?.monthlyRevenue || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
                <Line type="monotone" dataKey="issued" name="Emitido" stroke="#0f766e" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="received" name="Recebido" stroke="#2563eb" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-3xl border border-slate-100 bg-white p-5 shadow-none">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Status de reservas</h3>
            <p className="text-sm text-slate-500">Distribuicao no periodo.</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.charts?.bookingsByStatus || []}
                  dataKey="value"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  label
                >
                  {(data?.charts?.bookingsByStatus || []).map((entry, index) => (
                    <Cell key={entry.key || index} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="rounded-3xl border border-slate-100 bg-white p-5 shadow-none">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Salas mais locadas</h3>
            <p className="text-sm text-slate-500">Quantidade de reservas por sala.</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.charts?.bookingsByRoom || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="room" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#0f766e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-3xl border border-slate-100 bg-white p-5 shadow-none">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Pipeline comercial</h3>
            <p className="text-sm text-slate-500">Leads por status e negocios em aberto.</p>
          </div>
          <div className="space-y-3 text-sm">
            {(data?.charts?.leadsByStatus || []).map((item) => (
              <div key={item.key} className="rounded-xl border border-slate-100 p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium text-slate-700">{item.status}</span>
                  <span className="font-semibold text-slate-900">{item.value}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${Math.min(100, (item.value / Math.max(1, data?.kpis?.leadsInPeriod || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="text-slate-500">Negocios em aberto</div>
              <div className="text-2xl font-semibold text-slate-900">{data?.kpis?.openDeals ?? 0}</div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="rounded-3xl border border-slate-100 bg-white p-5 shadow-none">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Top clientes por faturamento</h3>
            <p className="text-sm text-slate-500">Ranking baseado no periodo selecionado.</p>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-100">
          <Table>
            <TableHeader>
              <TableRow className="border-none bg-slate-50/70">
                <TableHead className={`px-6 ${tableHeadBaseClass}`}>Cliente</TableHead>
                <TableHead className={tableHeadBaseClass}>Faturas</TableHead>
                <TableHead className={tableHeadBaseClass}>Emitido</TableHead>
                <TableHead className={tableHeadBaseClass}>Recebido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.topClients || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-slate-400">Sem dados para o periodo selecionado.</TableCell>
                </TableRow>
              ) : (
                (data?.topClients || []).map((item) => (
                  <TableRow key={item.clientId} className="border-slate-50">
                    <TableCell className={`${tableCellBaseClass} px-6 font-medium text-slate-900`}>{item.clientName}</TableCell>
                    <TableCell className={tableCellBaseClass}>{item.invoices}</TableCell>
                    <TableCell className={tableCellBaseClass}>
                      {Number(item.issued || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </TableCell>
                    <TableCell className={tableCellBaseClass}>
                      {Number(item.received || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
