import { NextResponse } from "next/server"
import { ContractType, Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { requireRole, requireSession } from "@/lib/auth-guards"
import { contractGenerateSchema, paginationSchema } from "@/lib/validations"

const buildGeneratedContractHtml = (params: {
  contractTitle: string
  clientName: string
  clientDocument: string
  serviceDescription: string
  contractValue: number
  startDate: string
  endDate: string
  city: string
}) => {
  const formattedValue = params.contractValue.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })

  const start = new Date(params.startDate).toLocaleDateString("pt-BR")
  const end = new Date(params.endDate).toLocaleDateString("pt-BR")

  return `
    <div style="max-width: 840px; margin: 0 auto; padding: 40px 28px; font-family: Georgia, 'Times New Roman', serif; color: #0f172a; line-height: 1.55;">
      <h1 style="font-size: 24px; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.08em;">${params.contractTitle}</h1>
      <p>
        <strong>Contratante:</strong> ${params.clientName}<br />
        <strong>Documento:</strong> ${params.clientDocument || "Não informado"}
      </p>
      <p>
        <strong>Objeto:</strong> ${params.serviceDescription}
      </p>
      <p>
        <strong>Vigência:</strong> de ${start} até ${end}
      </p>
      <p>
        <strong>Valor total:</strong> ${formattedValue}
      </p>
      <p style="margin-top: 28px;">
        As partes acordam com os termos aqui descritos, obrigando-se ao cumprimento integral das cláusulas contratuais.
      </p>
      <p style="margin-top: 36px;">${params.city}, ${new Date().toLocaleDateString("pt-BR")}</p>
      <div style="margin-top: 64px; display: grid; grid-template-columns: 1fr 1fr; gap: 28px;">
        <div style="text-align: center;">
          <div style="border-top: 1px solid #94a3b8; padding-top: 8px;">Contratante</div>
        </div>
        <div style="text-align: center;">
          <div style="border-top: 1px solid #94a3b8; padding-top: 8px;">Contratada</div>
        </div>
      </div>
    </div>
  `
}

export async function GET(request: Request) {
  try {
    const session = await requireRole(["ADMIN", "RECEPTION"])
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    const { page, limit } = paginationSchema.parse(queryParams)

    const clientId = searchParams.get("clientId")
    const type = searchParams.get("type")

    const where: Prisma.ContractWhereInput = {
      ...(clientId ? { clientId } : {}),
      ...(type && ["UPLOADED", "GENERATED"].includes(type) ? { type: type as ContractType } : {}),
    }

    const skip = (page - 1) * limit

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          client: {
            select: { id: true, name: true, email: true, cpf: true, cnpj: true },
          },
        },
      }),
      prisma.contract.count({ where }),
    ])

    const safeContracts = contracts.map((contract) => ({
      ...contract,
      fileData: undefined,
      hasFile: Boolean(contract.fileData),
    }))

    return NextResponse.json({
      data: safeContracts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch {
    return NextResponse.json({ error: "Erro ao buscar contratos" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(["ADMIN", "RECEPTION"])
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const currentSession = await requireSession()
    const createdBy = currentSession?.user?.email || null

    const contentType = request.headers.get("content-type") || ""

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      const clientId = String(formData.get("clientId") || "")
      const title = String(formData.get("title") || "Contrato anexado")
      const file = formData.get("file")

      if (!clientId || !(file instanceof File)) {
        return NextResponse.json({ error: "Cliente e arquivo PDF são obrigatórios" }, { status: 400 })
      }

      if (file.type !== "application/pdf") {
        return NextResponse.json({ error: "Envie um arquivo PDF válido" }, { status: 400 })
      }

      const fileBuffer = Buffer.from(await file.arrayBuffer())

      const created = await prisma.contract.create({
        data: {
          title,
          type: ContractType.UPLOADED,
          clientId,
          fileName: file.name,
          mimeType: file.type,
          fileData: fileBuffer,
          createdBy,
        },
      })

      return NextResponse.json({ id: created.id }, { status: 201 })
    }

    const body = await request.json()
    const parsed = contractGenerateSchema.parse(body)

    const client = await prisma.client.findUnique({
      where: { id: parsed.clientId },
      select: { id: true, name: true, cpf: true, cnpj: true },
    })

    if (!client) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
    }

    const generatedHtml = buildGeneratedContractHtml({
      contractTitle: parsed.title,
      clientName: client.name,
      clientDocument: client.cpf || client.cnpj || "",
      serviceDescription: parsed.serviceDescription,
      contractValue: parsed.contractValue,
      startDate: parsed.startDate,
      endDate: parsed.endDate,
      city: parsed.city,
    })

    const created = await prisma.contract.create({
      data: {
        title: parsed.title,
        type: ContractType.GENERATED,
        clientId: parsed.clientId,
        generatedHtml,
        metadata: {
          contractValue: parsed.contractValue,
          serviceDescription: parsed.serviceDescription,
          startDate: parsed.startDate,
          endDate: parsed.endDate,
          city: parsed.city,
        },
        createdBy,
      },
    })

    return NextResponse.json({ id: created.id }, { status: 201 })
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: "Falha de validação", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Erro ao salvar contrato" }, { status: 500 })
  }
}
