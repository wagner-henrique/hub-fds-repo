"use client"

import { Calendar as CalendarIcon, Clock, Edit3, Trash2, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type DashboardTabProps = {
  bookings: any[]
  leads: any[]
  tableHeadBaseClass: string
  tableCellBaseClass: string
  bookingStatusLabels: Record<string, string>
  onEditBooking: (item: any) => void
  onDeleteBooking: (id: string) => void
}

const formatCurrencyBRL = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function DashboardTab({
  bookings,
  leads,
  tableHeadBaseClass,
  tableCellBaseClass,
  bookingStatusLabels,
  onEditBooking,
  onDeleteBooking,
}: DashboardTabProps) {
  return (
    <>
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border border-slate-100 bg-white p-6 shadow-none">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Total de Reservas</p>
              <h3 className="text-4xl font-semibold text-slate-900">{bookings.length}</h3>
            </div>
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <CalendarIcon size={24} />
            </div>
          </div>
          <p className="text-xs text-slate-400">Dados da pagina atual</p>
        </Card>

        <Card className="rounded-3xl border border-slate-100 bg-white p-6 shadow-none">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Novos Leads</p>
              <h3 className="text-4xl font-semibold text-slate-900">{leads.length}</h3>
            </div>
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <Users size={24} />
            </div>
          </div>
          <p className="text-xs text-slate-400">Total captado</p>
        </Card>

        <Card className="rounded-3xl border border-slate-100 bg-white p-6 shadow-none">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Taxa de Conversao</p>
              <h3 className="text-4xl font-semibold text-slate-900">24%</h3>
            </div>
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <Clock size={24} />
            </div>
          </div>
          <p className="text-xs text-slate-400">Media de fechamento</p>
        </Card>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-xl font-semibold text-slate-900">Agendamentos Recentes</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-none bg-slate-50/70">
              <TableHead className={`px-8 ${tableHeadBaseClass}`}>Cliente</TableHead>
              <TableHead className={tableHeadBaseClass}>Data</TableHead>
              <TableHead className={tableHeadBaseClass}>Horario</TableHead>
              <TableHead className={tableHeadBaseClass}>Pagamento</TableHead>
              <TableHead className={tableHeadBaseClass}>Status</TableHead>
              <TableHead className={`px-8 text-right ${tableHeadBaseClass}`}>Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-20 text-center font-medium text-slate-400">
                  Nenhum agendamento encontrado.
                </TableCell>
              </TableRow>
            ) : (
              bookings.slice(0, 5).map((item: any) => (
                <TableRow key={item.id} className="border-slate-50 transition-colors hover:bg-slate-50/50">
                  <TableCell className={`${tableCellBaseClass} px-8`}>
                    <div className="font-bold text-slate-900">{item.name}</div>
                    <div className="text-xs text-slate-400">{item.email}</div>
                  </TableCell>
                  <TableCell className={`${tableCellBaseClass} font-medium text-slate-600`}>
                    {new Date(item.date).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className={`${tableCellBaseClass} font-bold text-primary`}>{item.time}</TableCell>
                  <TableCell className={tableCellBaseClass}>
                    {item.paymentSummary ? (
                      <div className="space-y-1">
                        <Badge className="rounded-lg px-3 py-1 font-bold bg-slate-700">
                          Pago: {item.paymentSummary.coveragePercent}%
                        </Badge>
                        <p className="text-xs text-slate-600">Valor pago: {formatCurrencyBRL(item.paymentSummary.paidAmount)}</p>
                        <p className="text-xs text-slate-500">Falta: {formatCurrencyBRL(item.paymentSummary.remainingAmount)}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Sem informação de pagamento</span>
                    )}
                  </TableCell>
                  <TableCell className={tableCellBaseClass}>
                    <Badge
                      className={`rounded-lg px-3 py-1 font-bold ${
                        item.status === "CONFIRMED" ? "bg-primary" : item.status === "CANCELLED" ? "bg-red-500" : "bg-amber-500"
                      }`}
                    >
                      {bookingStatusLabels[item.status] || item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className={`${tableCellBaseClass} px-8 text-right`}>
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="ghost" onClick={() => onEditBooking(item)}>
                        <Edit3 size={18} className="text-primary" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-red-500" onClick={() => onDeleteBooking(item.id)}>
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
