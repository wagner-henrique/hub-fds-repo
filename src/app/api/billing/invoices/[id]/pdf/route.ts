import { Prisma } from "@prisma/client"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"

import { requireRole } from "@/lib/auth-guards"
import { prisma } from "@/lib/prisma"

type InvoiceItem = {
  description?: string
  quantity?: number
  unitPrice?: number
  total?: number
}

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

const formatDate = (value?: Date | string | null) => {
  if (!value) return "-"
  return new Date(value).toLocaleDateString("pt-BR")
}

const asItems = (value: unknown): InvoiceItem[] => {
  if (!Array.isArray(value)) return []
  return value
}

const drawLine = (
  page: any,
  text: string,
  x: number,
  y: number,
  size = 10,
  color = rgb(0.2, 0.24, 0.31)
) => {
  page.drawText(text, { x, y, size, color })
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["ADMIN", "RECEPTION"])
    if (!session) {
      return Response.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            name: true,
            email: true,
            phone: true,
            cpf: true,
            cnpj: true,
            address: true,
          },
        },
      },
    })

    if (!invoice) {
      return Response.json({ error: "Fatura não encontrada" }, { status: 404 })
    }

    const items = asItems(invoice.items)
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595.28, 841.89])
    const { width, height } = page.getSize()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    let y = height - 48

    page.drawRectangle({ x: 40, y: y - 8, width: width - 80, height: 56, color: rgb(0.96, 0.97, 0.98) })
    page.drawText("FATURA", { x: 50, y: y + 18, size: 20, font: bold, color: rgb(0.1, 0.14, 0.2) })
    page.drawText("HUB FDS", { x: 50, y: y + 4, size: 11, font, color: rgb(0.33, 0.39, 0.47) })

    page.drawText(`No ${invoice.number}`, { x: width - 220, y: y + 18, size: 11, font: bold, color: rgb(0.1, 0.14, 0.2) })
    page.drawText(`Emissao: ${formatDate(invoice.issueDate)}`, { x: width - 220, y: y + 4, size: 10, font, color: rgb(0.33, 0.39, 0.47) })
    page.drawText(`Vencimento: ${formatDate(invoice.dueDate)}`, { x: width - 220, y: y - 10, size: 10, font, color: rgb(0.33, 0.39, 0.47) })

    y -= 42

    page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 1, color: rgb(0.86, 0.89, 0.92) })
    y -= 26

    page.drawText("DADOS DO CLIENTE", { x: 50, y, size: 10, font: bold, color: rgb(0.33, 0.39, 0.47) })
    page.drawText("DETALHES", { x: width / 2 + 10, y, size: 10, font: bold, color: rgb(0.33, 0.39, 0.47) })
    y -= 16

    drawLine(page, invoice.client.name || "-", 50, y, 11, rgb(0.1, 0.14, 0.2))
    drawLine(page, `Titulo: ${invoice.title}`, width / 2 + 10, y, 10)
    y -= 14
    drawLine(page, invoice.client.email || "-", 50, y)
    drawLine(page, `Status: ${invoice.status}`, width / 2 + 10, y)
    y -= 14
    if (invoice.client.phone) drawLine(page, invoice.client.phone, 50, y)
    if (invoice.referenceCode) drawLine(page, `Referencia: ${invoice.referenceCode}`, width / 2 + 10, y)
    y -= 14
    if (invoice.client.address) drawLine(page, invoice.client.address, 50, y)
    if (invoice.paymentMethod) drawLine(page, `Pagamento: ${invoice.paymentMethod}`, width / 2 + 10, y)
    y -= 14
    if (invoice.client.cpf || invoice.client.cnpj) {
      drawLine(page, `Documento: ${invoice.client.cpf || invoice.client.cnpj}`, 50, y)
      y -= 14
    }
    if (invoice.pixCode) {
      drawLine(page, `PIX: ${invoice.pixCode}`.slice(0, 120), 50, y)
      y -= 14
    }
    if (invoice.barcode) {
      drawLine(page, `Cod. barras: ${invoice.barcode}`.slice(0, 120), 50, y)
      y -= 14
    }

    y -= 12

    page.drawRectangle({ x: 40, y: y - 4, width: width - 80, height: 24, color: rgb(0.97, 0.98, 0.99) })
    page.drawText("Descricao", { x: 50, y: y + 4, size: 10, font: bold, color: rgb(0.33, 0.39, 0.47) })
    page.drawText("Qtd", { x: width - 230, y: y + 4, size: 10, font: bold, color: rgb(0.33, 0.39, 0.47) })
    page.drawText("Unitario", { x: width - 180, y: y + 4, size: 10, font: bold, color: rgb(0.33, 0.39, 0.47) })
    page.drawText("Total", { x: width - 110, y: y + 4, size: 10, font: bold, color: rgb(0.33, 0.39, 0.47) })
    y -= 24

    const safeItems = items.length
      ? items
      : [{ description: invoice.title, quantity: 1, unitPrice: invoice.subtotal, total: invoice.subtotal }]

    for (const item of safeItems) {
      if (y < 170) break
      const desc = (item.description || "-").slice(0, 48)
      drawLine(page, desc, 50, y)
      drawLine(page, Number(item.quantity || 0).toLocaleString("pt-BR"), width - 230, y)
      drawLine(page, formatCurrency(Number(item.unitPrice || 0)), width - 180, y)
      drawLine(page, formatCurrency(Number(item.total || 0)), width - 110, y, 10, rgb(0.1, 0.14, 0.2))
      y -= 16
    }

    const summaryX = width - 220
    y = Math.max(y - 20, 150)

    drawLine(page, `Subtotal: ${formatCurrency(invoice.subtotal)}`, summaryX, y)
    y -= 14
    drawLine(page, `Desconto: - ${formatCurrency(invoice.discount)}`, summaryX, y)
    y -= 14
    drawLine(page, `Taxas: ${formatCurrency(invoice.tax)}`, summaryX, y)
    y -= 18
    page.drawText(`TOTAL: ${formatCurrency(invoice.total)}`, { x: summaryX, y, size: 12, font: bold, color: rgb(0.1, 0.14, 0.2) })
    y -= 16
    drawLine(page, `Pago: ${formatCurrency(invoice.paidAmount)}`, summaryX, y)
    y -= 14
    page.drawText(`Saldo: ${formatCurrency(invoice.balance)}`, { x: summaryX, y, size: 11, font: bold, color: rgb(0.72, 0.11, 0.11) })

    if (invoice.notes) {
      const notes = invoice.notes.slice(0, 300)
      page.drawText("Observacoes", { x: 50, y: 96, size: 10, font: bold, color: rgb(0.33, 0.39, 0.47) })
      page.drawText(notes, { x: 50, y: 80, size: 9, font, color: rgb(0.2, 0.24, 0.31), maxWidth: width - 100, lineHeight: 11 })
    }

    const pdfBytes = await pdfDoc.save()
    const fileName = `${invoice.number}.pdf`

    return new Response(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2021" || error.code === "P2022")) {
      return Response.json({ error: "Banco não atualizado para faturamento. Execute prisma db push." }, { status: 503 })
    }

    return Response.json({ error: "Erro ao gerar PDF da fatura" }, { status: 500 })
  }
}
