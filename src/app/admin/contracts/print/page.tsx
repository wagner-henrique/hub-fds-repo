"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

export default function ContractPrintPage() {
  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [html, setHtml] = useState("")

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setError("Contrato não informado.")
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/contracts/${id}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data?.error || "Falha ao carregar contrato")
        }

        if (data?.type !== "GENERATED" || !data?.generatedHtml) {
          throw new Error("Este contrato não é imprimível por este formato")
        }

        setHtml(data.generatedHtml)
      } catch (err: any) {
        setError(err?.message || "Erro ao carregar contrato")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id])

  return (
    <main className="min-h-screen bg-white px-4 py-6 print:p-0">
      <div className="mx-auto mb-6 flex max-w-5xl justify-end print:hidden">
        <button
          type="button"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
          onClick={() => window.print()}
        >
          Imprimir
        </button>
      </div>

      {loading ? (
        <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 p-6 text-slate-500">Carregando contrato...</div>
      ) : error ? (
        <div className="mx-auto max-w-5xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-600">{error}</div>
      ) : (
        <article className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:border-none print:shadow-none print:p-0">
          <iframe
            className="h-[70vh] w-full rounded-xl border border-slate-200 print:h-auto print:min-h-[90vh]"
            title="Contrato"
            sandbox=""
            referrerPolicy="no-referrer"
            srcDoc={html}
          />
        </article>
      )}
    </main>
  )
}
