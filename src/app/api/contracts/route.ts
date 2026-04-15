import { NextResponse } from "next/server"
import { ContractType, Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { requireRole, requireSession } from "@/lib/auth-guards"
import { contractGenerateSchema, paginationSchema } from "@/lib/validations"

const MAX_CONTRACT_FILE_BYTES = 10 * 1024 * 1024

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

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
  const contractTitle = escapeHtml(params.contractTitle)
  const clientName = escapeHtml(params.clientName)
  const clientDocument = escapeHtml(params.clientDocument || "Não informado")
  const serviceDescription = escapeHtml(params.serviceDescription)
  const city = escapeHtml(params.city)
  const today = new Date().toLocaleDateString("pt-BR")

  return `
    <div style="max-width: 900px; margin: 0 auto; padding: 36px 26px; font-family: Georgia, 'Times New Roman', serif; color: #0f172a; line-height: 1.6;">
      <header style="margin-bottom: 24px; border-bottom: 1px solid #cbd5e1; padding-bottom: 14px;">
        <p style="margin: 0; font-size: 12px; color: #475569;">Rua Olavo Bilac, 210 – Centro, Arapiraca/AL (82) 98116-1290 • Instagram: @fdscoworking</p>
        <h1 style="margin: 12px 0 0; font-size: 24px; text-transform: uppercase; letter-spacing: 0.06em;">${contractTitle}</h1>
      </header>

      <p>
        Pelo presente instrumento particular, de um lado a empresa FDS COWORKING,
        Pessoa Jurídica de Direito Privado, inscrita no CNPJ sob o nº 29169293000117,
        situada na Rua Olavo Bilac, nº 210, Centro, Arapiraca, Alagoas, CEP: 57300-370,
        neste ato representada por ALISSON GUIMARÃES PEREIRA DO NASCIMENTO SILVA,
        Advogado e Diretor Executivo, residente e domiciliado nesta cidade de Arapiraca/AL,
        doravante denominada CONTRATADA, e de outro lado;
      </p>
      <p>
        Do outro, <strong>${clientName}</strong>, pessoa jurídica de direito privado,
        inscrita sob o documento nº <strong>${clientDocument}</strong>, doravante denominada
        simplesmente CONTRATANTE, os quais têm entre si como justo e contratado o que segue:
      </p>

      <h2 style="margin: 22px 0 8px; font-size: 17px;">1. CLÁUSULA PRIMEIRA – DO OBJETO</h2>
      <p style="margin: 0;">
        1.1. A CONTRATADA, legítima possuidora do imóvel, por este instrumento,
        cede à CONTRATANTE espaço/sala comercial livre e desembaraçado de
        quaisquer ônus reais e em perfeitas condições de higiene e conservação, de
        uso comercial, situado na Rua Olavo Bilac, nº 210, Centro, CEP: 57300-390,
        Arapiraca/AL, pelo prazo com início em <strong>${start}</strong> e término
        em <strong>${end}</strong>, com valor mensal de <strong>${formattedValue}</strong>.
      </p>
      <p style="margin-top: 8px;">
        1.2. O kit contratado é composto dos seguintes serviços: <strong>${serviceDescription}</strong>.
      </p>

      <h2 style="margin: 22px 0 8px; font-size: 17px;">2. CLAÚSULA SEGUNDA – DOS PAGAMENTOS</h2>
      <p style="margin: 0;">
        2.1. O pagamento das mensalidades será feito via pix ou transferência
        bancária, no dia pactuado entre as partes, sob pena de incorrer a CONTRATANTE
        em multa de 2% (dois por cento) sobre o valor da mensalidade, mais 1% (um
        por cento) de correção monetária, em caso da não regularização na data de
        vencimento.
      </p>
      <p style="margin-top: 8px;">
        2.2. Independente da data de assinatura, a vigência do contrato tem início
        a partir da data de início contratual, quando do pagamento da primeira parcela.
      </p>
      <p style="margin-top: 8px;">
        2.3. As despesas decorrentes de consumo de água, luz e gás, ficam a cargo
        da CONTRATADA, cabendo-lhe efetuar diretamente esses pagamentos nas devidas épocas.
      </p>

      <h2 style="margin: 22px 0 8px; font-size: 17px;">3. CLÁUSULA TERCEIRA - PERÍODO DE VIGÊNCIA CONTRATUAL</h2>
      <p style="margin: 0;">
        Parágrafo único. A validade do contrato de locação observará o período
        contratado entre as partes, a contar da assinatura deste contrato.
        A renovação contratual dependerá de concordância de ambas as partes.
      </p>

      <h2 style="margin: 22px 0 8px; font-size: 17px;">4. CLÁUSULA QUARTA – HORÁRIO DE FUNCIONAMENTO</h2>
      <p style="margin: 0;">
        4.1. Fica assegurado à CONTRATANTE a utilização do espaço de
        segunda à sexta, das 08:00 às 18:00, com tolerância máxima até às 19:00h,
        e em casos excepcionais estender esse horário até as 22h00, e aos sábados,
        das 08:00 às 12:00, sem tolerância.
      </p>

      <h2 style="margin: 22px 0 8px; font-size: 17px;">5. CLÁUSULA QUINTA – RESPONSABILIDADES</h2>
      <p style="margin: 0;">
        5.1. A CONTRATADA não se responsabilizará por acidentes ocorridos com
        a CONTRATANTE no interior de seu estabelecimento, seja por mau uso dos
        equipamentos que disponibiliza, seja por problemas de saúde dos
        CONTRATANTES ou discussão.
      </p>
      <p style="margin-top: 8px;">
        5.2. A CONTRATADA não se responsabiliza pela guarda de pertences da
        CONTRATANTE que sejam deixados nas dependências da CONTRATADA.
      </p>
      <p style="margin-top: 8px;">
        5.3. Qualquer relação contratual entre a CONTRATANTE e terceiros, no
        interior do estabelecimento da CONTRATADA, não gera a esta qualquer
        responsabilidade solidária ou sequer subsidiária.
      </p>

      <h2 style="margin: 22px 0 8px; font-size: 17px;">6. CLÁUSULA SEXTA – OBRIGAÇÕES E PENALIDADES</h2>
      <p style="margin: 0;">
        6.1. A CONTRATANTE se responsabiliza pelo uso e zelo dos bens móveis
        da CONTRATADA, devendo indenizá-la pela má utilização do espaço ou
        objeto de composição do ambiente contratado em locação.
      </p>
      <p style="margin-top: 8px;">
        6.2. Quaisquer prejuízos materiais, decorrentes de danos ao
        estabelecimento, bem como eventuais danos à honra objetiva da
        CONTRATADA, serão ressarcidos pela CONTRATANTE, na forma da lei, ou
        em eventual AÇÃO DE RESPONSABILIDADE CIVIL POR DANOS SEJA
        MATERIAIS ou MORAIS, decorrentes de atos da CONTRATANTE, sem
        prejuízo da RESPONSABILIDADE CRIMINAL, em havendo dolo na
        execução do ato danoso.
      </p>

      <h2 style="margin: 22px 0 8px; font-size: 17px;">7. CLÁUSULA SÉTIMA – CESSÃO</h2>
      <p style="margin: 0;">
        Parágrafo único: Os direitos e obrigações decorrentes deste CONTRATO
        não poderão ser cedidos ou transferidos para terceiros sem a prévia e
        expressa autorização escrita da outra PARTE. Salvo, por procuração ou
        ordem judicial.
      </p>

      <h2 style="margin: 22px 0 8px; font-size: 17px;">8. CLÁUSULA OITAVA – RESCISÃO E MULTA</h2>
      <p style="margin: 0;">8.1. O presente contrato será rescindido automaticamente nos casos de incêndio, desapropriação e falência da contratada.</p>
      <p style="margin-top: 8px;">8.2. O não pagamento da mensalidade seja em um único mês, pela CONTRATANTE, acarretará a suspensão imediata do serviço, sem qualquer direito a indenização a esta.</p>
      <p style="margin-top: 8px;">8.3. Caso a CONTRATANTE já tenha realizado o pagamento pelo serviço, seja qual mensalidade for, e mesmo assim, requisite a rescisão do presente contrato, renunciar-se-á o valor da quantia paga no mês da rescisão, tendo inclusive que pagar a multa rescisória no montante de 2 (dois) meses do aluguel vigente, caso a rescisão seja antes de encerrar-se o prazo de validade contratual de um ano.</p>
      <p style="margin-top: 8px;">8.4. Caso seja a CONTRATADA quem requeira a rescisão contratual, deverá devolver a quantia que se refere aos serviços por ele não prestados a CONTRATANTE, naquele mês da rescisão, na medida da sua proporcionalidade, com aviso prévio de 30 dias de antecedência.</p>
      <p style="margin-top: 8px;">8.5. O não pagamento observado até a data da rescisão, gera direito a CONTRATADA de inscrever o CPF/MF do representante ou CNPJ da empresa no órgão de protesto da dívida, abrindo-se a oportunidade para a negociação e quitação da dívida.</p>
      <p style="margin-top: 8px;">8.6. Este contrato será cobrado por via administrativa, e o não pagamento pela parte devedora, responderá, além do principal, a multa por todas as despesas judiciais, extrajudiciais e honorários advocatícios, desde já fixados em 20% (vinte por cento), caso seja necessária a intervenção judicial.</p>
      <p style="margin-top: 8px;">8.7. No caso de término ou rescisão do contrato, deverá a CONTRATANTE retirar do endereço da CONTRATADA todo o envio de correspondência no prazo de 30 (trinta dias) a contar da rescisão do contrato, caso a CONTRATANTE não retire o endereço, deverá pagar uma multa de ½ salário mínimo por mês, até o cumprimento da devida obrigação.</p>

      <h2 style="margin: 22px 0 8px; font-size: 17px;">9. CLÁUSULA NONA – DA SUBLOCAÇÃO</h2>
      <p style="margin: 0;">Parágrafo único: A CONTRATANTE não poderá sublocar nem emprestar para terceiros o espaço locado, em todo ou em parte, sem consentimento escrito da CONTRATADA.</p>

      <h2 style="margin: 22px 0 8px; font-size: 17px;">10. CLÁUSULA DÉCIMA – DOS DIREITOS</h2>
      <p style="margin: 0;">10.1. O presente Contrato ficará rescindido de pleno direito, independentemente de qualquer notificação judicial ou extrajudicial e sem que assista a nenhuma das PARTES o direito a qualquer indenização, ficando as PARTES, daí por diante, desobrigadas por todas as cláusulas do presente Contrato, nos seguintes casos:</p>
      <p style="margin-top: 8px;">a) Processo de desapropriação total ou parcial do Imóvel;</p>
      <p style="margin-top: 8px;">b) Ocorrência de qualquer evento ou incêndio do Imóvel locado que impeça a sua ocupação;</p>
      <p style="margin-top: 8px;">c) Qualquer outro fato que obrigue o impedimento do Imóvel, impossibilitando a continuidade deste Contrato; e</p>
      <p style="margin-top: 8px;">d) Insolvência, falência, recuperação judicial ou procedimento semelhante que possam comprometer o cumprimento das obrigações assumidas no presente Contrato.</p>
      <p style="margin-top: 8px;">10.2. O presente contrato de locação destina-se exclusivamente para ocupação do estabelecimento comercial da CONTRATADA, vedada qualquer alteração desta destinação.</p>
      <p style="margin-top: 8px;">10.3. A CONTRATANTE também não será permitido emprestar, ceder ou sublocar o imóvel objeto da presente locação, sem prévia e expressa anuência da CONTRATADA, exceto para empresas do mesmo Grupo econômico da CONTRATANTE ou em caso de reestruturação societária, dentro das modalidades previstas na legislação societária aplicável, o que fica desde já autorizado pela CONTRATADA, ficando estabelecido que a entidade sucessora obrigatoriamente ficará sub-rogada em todos os direitos e obrigações assumidos neste Contrato.</p>

      <h2 style="margin: 22px 0 8px; font-size: 17px;">11. CLÁUSULA DÉCIMA PRIMEIRA – DAS BENFEITORIAS</h2>
      <p style="margin: 0;">11.1. As adaptações ou benfeitorias removíveis promovidas pela CONTRATANTE deverão, ao término da locação, ser desfeitas às suas expensas, restituindo-se os imóveis ao “status quo ante”, se a CONTRATADA o solicitar.</p>
      <p style="margin-top: 8px;">11.2. Desatendida a solicitação do parágrafo anterior, a CONTRATADA poderá executar os serviços de desfazimento por conta da CONTRATANTE, ressaltando que enquanto não estiverem concluídos os serviços, continuará a CONTRATANTE obrigada ao pagamento dos aluguéis e encargos que não esteja ocupado o imóvel.</p>

      <h2 style="margin: 22px 0 8px; font-size: 17px;">12. CLÁUSULA DÉCIMA SEGUNDA – DO PROCEDIMENTO JUDICIAL E EXTRAJUDICIAL</h2>
      <p style="margin: 0;">Parágrafo único: A CONTRATANTE autoriza expressamente a CONTRATADA a proceder sua citação inicial, interpelação, modificações ou qualquer outro ato de comunicação judicial ou procedimento processual decorrente de relação locatária ora ajustada, especialmente intimações conforme lei do Inquilinato, n° 8.245 de 18 de outubro de 1991.</p>

      <h2 style="margin: 22px 0 8px; font-size: 17px;">13. CLÁUSULA DÉCIMA TERCEIRA – FORO</h2>
      <p style="margin: 0;">Parágrafo único: As PARTES (CONTRATANTE e CONTRATADA) elegem o foro da cidade do ${city} com exclusão de qualquer outro, como o competente para dirimir todas e quaisquer dúvidas oriundas do presente CONTRATO. E, por estarem justas e acordadas, lavram as Partes este instrumento em 02 (duas) vias de igual teor e forma, para um só efeito, na presença das testemunhas abaixo indicadas.</p>

      <h2 style="margin: 22px 0 8px; font-size: 17px;">14. CLÁUSULA DÉCIMA QUARTA – DISPOSIÇÕES GERAIS</h2>
      <p style="margin: 0;">14.1. Este contrato e seus anexos são a expressão final dos entendimentos entre as Partes referentes a seus respectivos objetos e substituem todas as negociações e documentos por escrito havidos entre as Partes e/ou entre empresas às mesmas vinculadas, anteriormente à sua celebração e afetos ao período de vigência contratual.</p>
      <p style="margin-top: 8px;">14.2. Este contrato obriga as Partes, somente podendo ser alterado por escrito, através de aditivo contratual que formalizam as alterações negociais.</p>
      <p style="margin-top: 8px;">14.3. Fica pactuado entre as partes a total inexistência de vínculo trabalhista, excluindo as obrigações previdenciárias e os encargos sociais, não havendo entre a CONTRATADA e CONTRATANTE qualquer tipo de relação de subordinação.</p>

      <p style="margin-top: 26px;"><strong>${city}</strong>, ${today}</p>

      <div style="margin-top: 54px; display: grid; grid-template-columns: 1fr 1fr; gap: 28px;">
        <div style="text-align: center;">
          <div style="border-top: 1px solid #94a3b8; padding-top: 8px; font-size: 14px;">
            (FDS COWORKING-HUB FDS)<br />
            ALISSON GUIMARÃES PEREIRA DO NASCIMENTO SILVA<br />
            (CONTRATADA)
          </div>
        </div>
        <div style="text-align: center;">
          <div style="border-top: 1px solid #94a3b8; padding-top: 8px; font-size: 14px;">
            ${clientName}<br />
            (CONTRATANTE)
          </div>
        </div>
      </div>

      <div style="margin-top: 44px; display: grid; grid-template-columns: 1fr 1fr; gap: 28px;">
        <div style="text-align: center;">
          <div style="border-top: 1px solid #cbd5e1; padding-top: 8px; font-size: 13px;">Testemunha 1: , CPF nº</div>
        </div>
        <div style="text-align: center;">
          <div style="border-top: 1px solid #cbd5e1; padding-top: 8px; font-size: 13px;">Testemunha 2: , CPF nº</div>
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

      if (file.size > MAX_CONTRACT_FILE_BYTES) {
        return NextResponse.json({ error: "O arquivo excede o limite de 10MB" }, { status: 413 })
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
