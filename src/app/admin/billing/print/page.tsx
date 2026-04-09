"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"

type InvoiceItem = {
  description?: string
  quantity?: number
  unitPrice?: number
  total?: number
}

export default function BillingPrintPage() {
  const searchParams = useSearchParams()
  const id = searchParams.get("id")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [invoice, setInvoice] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setError("Fatura não informada.")
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/billing/invoices/${id}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data?.error || "Falha ao carregar fatura")
        }

        setInvoice(data)
      } catch (err: any) {
        setError(err?.message || "Erro ao carregar fatura")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id])

  const items = useMemo(() => {
    if (!invoice?.items) return []
    if (Array.isArray(invoice.items)) return invoice.items as InvoiceItem[]
    return []
  }, [invoice])

  return (
    <main className="min-h-screen bg-white px-4 py-6 print:p-0">
      <div className="mx-auto mb-6 flex max-w-5xl justify-end gap-2 print:hidden">
        <button
          type="button"
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
          onClick={() => window.open(`/api/billing/invoices/${id}/pdf`, "_blank")}
        >
          Exportar PDF
        </button>
        <button
          type="button"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
          onClick={() => window.print()}
        >
          Imprimir
        </button>
      </div>

      {loading ? (
        <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 p-6 text-slate-500">Carregando fatura...</div>
      ) : error ? (
        <div className="mx-auto max-w-5xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-600">{error}</div>
      ) : (
        <article className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm print:border-none print:shadow-none print:p-0">
          <header className="mb-8 flex items-start justify-between border-b border-slate-200 pb-5">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">FATURA</h1>
              <p className="mt-1 text-sm text-slate-500">HUB FDS</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-700">Nº {invoice.number}</p>
              <p className="text-xs text-slate-500">Emissão: {new Date(invoice.issueDate).toLocaleDateString("pt-BR")}</p>
              <p className="text-xs text-slate-500">Vencimento: {new Date(invoice.dueDate).toLocaleDateString("pt-BR")}</p>
            </div>
          </header>

          <section className="mb-8 grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Dados do cliente</h2>
              <p className="text-sm font-semibold text-slate-900">{invoice?.client?.name || "-"}</p>
              <p className="text-sm text-slate-700">{invoice?.client?.email || "-"}</p>
              {invoice?.client?.phone && <p className="text-sm text-slate-700">{invoice.client.phone}</p>}
              {invoice?.client?.address && <p className="text-sm text-slate-700">{invoice.client.address}</p>}
              {(invoice?.client?.cpf || invoice?.client?.cnpj) && (
                <p className="text-sm text-slate-700">
                  Documento: {invoice.client.cpf || invoice.client.cnpj}
                </p>
              )}
            </div>
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Detalhes</h2>
              <p className="text-sm text-slate-700">Título: {invoice.title}</p>
              <p className="text-sm text-slate-700">Status: {invoice.status}</p>
              {invoice.referenceCode && <p className="text-sm text-slate-700">Referência: {invoice.referenceCode}</p>}
              {invoice.paymentMethod && <p className="text-sm text-slate-700">Forma de pagamento: {invoice.paymentMethod}</p>}
              {invoice.pixCode && <p className="break-all text-xs text-slate-700">PIX copia e cola: {invoice.pixCode}</p>}
              {invoice.barcode && <p className="break-all text-xs text-slate-700">Código de barras: {invoice.barcode}</p>}
            </div>
          </section>

          <section className="mb-8 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Descrição</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600">Qtd</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600">Valor unit.</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td className="px-4 py-3 text-slate-500" colSpan={4}>Sem itens detalhados.</td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={index} className="border-t border-slate-100">
                      <td className="px-4 py-3 text-slate-800">{item.description || "-"}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{Number(item.quantity || 0).toLocaleString("pt-BR")}</td>
                      <td className="px-4 py-3 text-right text-slate-700">
                        {Number(item.unitPrice || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">
                        {Number(item.total || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>

          <section className="ml-auto grid max-w-sm gap-2 text-sm">
            <div className="flex items-center justify-between text-slate-700">
              <span>Subtotal</span>
              <span>{Number(invoice.subtotal || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
            </div>
            <div className="flex items-center justify-between text-slate-700">
              <span>Desconto</span>
              <span>- {Number(invoice.discount || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
            </div>
            <div className="flex items-center justify-between text-slate-700">
              <span>Taxas</span>
              <span>{Number(invoice.tax || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
              <span>Total</span>
              <span>{Number(invoice.total || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
            </div>
            <div className="flex items-center justify-between text-slate-700">
              <span>Pago</span>
              <span>{Number(invoice.paidAmount || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
            </div>
            <div className="flex items-center justify-between text-red-600">
              <span>Saldo</span>
              <span>{Number(invoice.balance || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
            </div>
          </section>

          {invoice.notes && (
            <section className="mt-8 border-t border-slate-200 pt-4">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Observações</h3>
              <p className="text-sm text-slate-700">{invoice.notes}</p>
            </section>
          )}
        </article>
      )}
    </main>
  )
}
