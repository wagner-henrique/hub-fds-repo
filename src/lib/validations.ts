import { z } from "zod"

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(200).default(10),
})

export const bookingSchema = z.object({
  name: z.string().min(3, { message: "Nome deve conter no mínimo 3 caracteres" }).max(100, { message: "Nome não pode conter mais de 100 caracteres" }),
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(10, { message: "Telefone deve conter no mínimo 10 caracteres" }).max(20, { message: "Telefone não pode conter mais de 20 caracteres" }).optional().nullable(),
  room: z.enum(["reuniao", "treinamento", "coworking", "arapiraca", "sala_arapiraca", "auditorio"]).default("reuniao"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Formato de data inválido",
  }),
  time: z.union([
    z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Formato de hora inválido" }),
    z.array(z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/)).min(1, { message: "Informe no mínimo um horário" })
  ]),
  notes: z.string().max(500, { message: "Notas não podem conter mais de 500 caracteres" }).optional().nullable(),
})

export const leadSchema = z.object({
  name: z.string().min(2, { message: "Nome deve conter no mínimo 2 caracteres" }).max(100, { message: "Nome não pode conter mais de 100 caracteres" }).optional().nullable(),
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(10, { message: "Telefone deve conter no mínimo 10 caracteres" }).max(20, { message: "Telefone não pode conter mais de 20 caracteres" }).optional().nullable(),
  source: z.string().default("landing_page"),
})

export const clientSchema = z
  .object({
    name: z.string().min(2, { message: "Nome deve conter no mínimo 2 caracteres" }).max(120, { message: "Nome não pode conter mais de 120 caracteres" }),
    type: z.enum(["PF", "PJ"]).default("PF"),
    email: z.string().email("E-mail inválido"),
    phone: z.string().min(10, { message: "Telefone deve conter no mínimo 10 caracteres" }).max(20, { message: "Telefone não pode conter mais de 20 caracteres" }),
    whatsapp: z.string().min(10, { message: "WhatsApp deve conter no mínimo 10 caracteres" }).max(20, { message: "WhatsApp não pode conter mais de 20 caracteres" }).optional().nullable(),
    cpf: z.string().max(14, { message: "CPF não pode conter mais de 14 caracteres" }).optional().nullable(),
    cnpj: z.string().max(18, { message: "CNPJ não pode conter mais de 18 caracteres" }).optional().nullable(),
    birthDate: z
      .string()
      .optional()
      .nullable()
      .refine((val) => !val || !Number.isNaN(Date.parse(val)), {
        message: "Data de nascimento inválida",
      }),
    address: z.string().max(255, { message: "Endereço não pode conter mais de 255 caracteres" }).optional().nullable(),
    notes: z.string().max(1000, { message: "Notas não podem conter mais de 1000 caracteres" }).optional().nullable(),
  })
  .refine((data) => Boolean(data.email || data.phone), {
    message: "Informe e-mail ou telefone",
    path: ["email"],
  })
  .refine((data) => {
    if (data.type === "PF") {
      if (!data.cpf) return false
      return data.cpf.length >= 11
    }
    if (data.type === "PJ") {
      if (!data.cnpj) return false
      return data.cnpj.length >= 14
    }
    return true
  }, {
    message: "Documento inválido ou com tamanho insuficiente",
    path: ["type"],
  })

export const crmDealSchema = z.object({
  title: z.string().min(2, { message: "Título deve conter no mínimo 2 caracteres" }).max(120, { message: "Título não pode conter mais de 120 caracteres" }),
  description: z.string().max(1000, { message: "Descrição não pode conter mais de 1000 caracteres" }).optional().nullable(),
  value: z.coerce.number().min(0, { message: "Valor não pode ser negativo" }).default(0),
  stage: z.enum(["LEAD", "CONTACT", "PROPOSAL", "NEGOTIATION", "WON", "LOST"]).default("LEAD"),
  expectedCloseDate: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || !Number.isNaN(Date.parse(val)), {
      message: "Data esperada inválida",
    }),
  source: z.string().max(80, { message: "Origem não pode conter mais de 80 caracteres" }).optional().nullable(),
  clientId: z.string().min(1, { message: "Selecione um cliente" }),
})

export const crmTaskSchema = z
  .object({
    title: z.string().min(2, { message: "Título deve conter no mínimo 2 caracteres" }).max(140, { message: "Título não pode conter mais de 140 caracteres" }),
    description: z.string().max(1000, { message: "Descrição não pode conter mais de 1000 caracteres" }).optional().nullable(),
    dueDate: z
      .string()
      .optional()
      .nullable()
      .refine((val) => !val || !Number.isNaN(Date.parse(val)), {
        message: "Prazo inválido",
      }),
    status: z.enum(["OPEN", "IN_PROGRESS", "DONE", "CANCELED"]).default("OPEN"),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
    clientId: z.string().optional().nullable(),
    dealId: z.string().optional().nullable(),
  })
  .refine((data) => Boolean(data.clientId || data.dealId), {
    message: "Vincule a tarefa a um cliente ou negócio",
    path: ["clientId"],
  })

export const crmActivitySchema = z
  .object({
    type: z.enum(["NOTE", "CALL", "MEETING", "EMAIL", "WHATSAPP"]).default("NOTE"),
    content: z.string().min(2, { message: "Conteúdo deve conter no mínimo 2 caracteres" }).max(2000, { message: "Conteúdo não pode conter mais de 2000 caracteres" }),
    clientId: z.string().optional().nullable(),
    dealId: z.string().optional().nullable(),
  })
  .refine((data) => Boolean(data.clientId || data.dealId), {
    message: "Informe cliente ou negócio para a interação",
    path: ["clientId"],
  })

export const contractGenerateSchema = z.object({
  clientId: z.string().min(1, { message: "Selecione um cliente" }),
  title: z.string().min(3, { message: "Título deve conter no mínimo 3 caracteres" }).max(140, { message: "Título não pode conter mais de 140 caracteres" }),
  contractValue: z.coerce.number().min(0, { message: "Valor não pode ser negativo" }).default(0),
  serviceDescription: z.string().min(3, { message: "Descrição deve conter no mínimo 3 caracteres" }).max(2000, { message: "Descrição não pode conter mais de 2000 caracteres" }),
  startDate: z
    .string()
    .refine((val) => !Number.isNaN(Date.parse(val)), {
      message: "Data de início inválida",
    }),
  endDate: z
    .string()
    .refine((val) => !Number.isNaN(Date.parse(val)), {
      message: "Data de término inválida",
    }),
  city: z.string().min(2, { message: "Cidade deve conter no mínimo 2 caracteres" }).max(80, { message: "Cidade não pode conter mais de 80 caracteres" }).default("Arapiraca"),
})

export const financialEntrySchema = z.object({
  type: z.enum(["PAYABLE", "RECEIVABLE"]),
  status: z.enum(["PENDING", "PARTIAL", "PAID", "CANCELED"]).default("PENDING"),
  title: z.string().min(2, { message: "Título deve conter no mínimo 2 caracteres" }).max(140, { message: "Título não pode conter mais de 140 caracteres" }),
  description: z.string().max(1000, { message: "Descrição não pode conter mais de 1000 caracteres" }).optional().nullable(),
  category: z.string().max(80, { message: "Categoria não pode conter mais de 80 caracteres" }).optional().nullable(),
  amount: z.coerce.number().min(0, { message: "Valor não pode ser negativo" }),
  amountPaid: z.coerce.number().min(0, { message: "Valor pago não pode ser negativo" }).default(0),
  dueDate: z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
    message: "Vencimento inválido",
  }),
  paymentDate: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || !Number.isNaN(Date.parse(val)), {
      message: "Data de pagamento inválida",
    }),
  referenceCode: z.string().max(80, { message: "Código de referência não pode conter mais de 80 caracteres" }).optional().nullable(),
  clientId: z.string().optional().nullable(),
})

export const invoiceItemSchema = z.object({
  description: z.string().min(2, { message: "Descrição deve conter no mínimo 2 caracteres" }).max(240, { message: "Descrição não pode conter mais de 240 caracteres" }),
  quantity: z.coerce.number().min(0.0001, { message: "Quantidade deve ser maior que 0" }),
  unitPrice: z.coerce.number().min(0, { message: "Preço unitário não pode ser negativo" }),
  total: z.coerce.number().min(0, { message: "Total não pode ser negativo" }),
})

export const billingInvoiceSchema = z
  .object({
    status: z.enum(["DRAFT", "ISSUED", "PARTIAL", "PAID", "CANCELED", "OVERDUE"]).default("DRAFT"),
    title: z.string().min(2, { message: "Título deve conter no mínimo 2 caracteres" }).max(160, { message: "Título não pode conter mais de 160 caracteres" }),
    clientId: z.string().min(1, { message: "Selecione um cliente" }),
    issueDate: z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
      message: "Data de emissão inválida",
    }),
    dueDate: z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
      message: "Data de vencimento inválida",
    }),
    servicePeriodStart: z
      .string()
      .optional()
      .nullable()
      .refine((val) => !val || !Number.isNaN(Date.parse(val)), {
        message: "Período inicial inválido",
      }),
    servicePeriodEnd: z
      .string()
      .optional()
      .nullable()
      .refine((val) => !val || !Number.isNaN(Date.parse(val)), {
        message: "Período final inválido",
      }),
    items: z.array(invoiceItemSchema).min(1, { message: "Adicione no mínimo um item" }),
    subtotal: z.coerce.number().min(0, { message: "Subtotal não pode ser negativo" }),
    discount: z.coerce.number().min(0, { message: "Desconto não pode ser negativo" }).default(0),
    tax: z.coerce.number().min(0, { message: "Imposto não pode ser negativo" }).default(0),
    total: z.coerce.number().min(0, { message: "Total não pode ser negativo" }),
    paidAmount: z.coerce.number().min(0, { message: "Valor pago não pode ser negativo" }).default(0),
    paymentMethod: z.string().max(80, { message: "Método de pagamento não pode conter mais de 80 caracteres" }).optional().nullable(),
    referenceCode: z.string().max(80, { message: "Código de referência não pode conter mais de 80 caracteres" }).optional().nullable(),
    pixCode: z.string().max(300, { message: "Código PIX não pode conter mais de 300 caracteres" }).optional().nullable(),
    barcode: z.string().max(120, { message: "Código de barras não pode conter mais de 120 caracteres" }).optional().nullable(),
    notes: z.string().max(1200, { message: "Notas não podem conter mais de 1200 caracteres" }).optional().nullable(),
  })
  .refine((data) => data.dueDate >= data.issueDate, {
    message: "Vencimento deve ser igual ou maior que emissão",
    path: ["dueDate"],
  })
  .refine((data) => data.total >= data.paidAmount, {
    message: "Valor pago não pode ser maior que o total",
    path: ["paidAmount"],
  })

export type BookingInput = z.infer<typeof bookingSchema>
export type LeadInput = z.infer<typeof leadSchema>
export type ClientInput = z.infer<typeof clientSchema>
export type CrmDealInput = z.infer<typeof crmDealSchema>
export type CrmTaskInput = z.infer<typeof crmTaskSchema>
export type CrmActivityInput = z.infer<typeof crmActivitySchema>
export type ContractGenerateInput = z.infer<typeof contractGenerateSchema>
export type FinancialEntryInput = z.infer<typeof financialEntrySchema>
export type BillingInvoiceInput = z.infer<typeof billingInvoiceSchema>