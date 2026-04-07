import { z } from "zod"

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
})

export const bookingSchema = z.object({
  name: z.string().min(3).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(20).optional().nullable(),
  room: z.enum(["reuniao", "treinamento", "coworking", "arapiraca", "sala_arapiraca", "auditorio"]).default("reuniao"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Formato de data inválido",
  }),
  time: z.union([
    z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Formato de hora inválido" }),
    z.array(z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/)).min(1)
  ]),
  notes: z.string().max(500).optional().nullable(),
})

export const leadSchema = z.object({
  name: z.string().min(2).max(100).optional().nullable(),
  email: z.string().email(),
  phone: z.string().min(10).max(20).optional().nullable(),
  source: z.string().default("landing_page"),
})

export const clientSchema = z
  .object({
    name: z.string().min(2).max(120),
    type: z.enum(["PF", "PJ"]).default("PF"),
    email: z.string().email(),
    phone: z.string().min(10).max(20),
    whatsapp: z.string().min(10).max(20).optional().nullable(),
    cpf: z.string().min(11).max(14).optional().nullable(),
    cnpj: z.string().min(14).max(18).optional().nullable(),
    birthDate: z
      .string()
      .optional()
      .nullable()
      .refine((val) => !val || !Number.isNaN(Date.parse(val)), {
        message: "Data de nascimento inválida",
      }),
    address: z.string().max(255).optional().nullable(),
    notes: z.string().max(1000).optional().nullable(),
  })
  .refine((data) => Boolean(data.email || data.phone), {
    message: "Informe e-mail ou telefone",
    path: ["email"],
  })
  .refine((data) => {
    if (data.type === "PF") return Boolean(data.cpf)
    if (data.type === "PJ") return Boolean(data.cnpj)
    return true
  }, {
    message: "CPF é obrigatório para PF e CNPJ é obrigatório para PJ",
    path: ["type"],
  })

export const crmDealSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(1000).optional().nullable(),
  value: z.coerce.number().min(0).default(0),
  stage: z.enum(["LEAD", "CONTACT", "PROPOSAL", "NEGOTIATION", "WON", "LOST"]).default("LEAD"),
  expectedCloseDate: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || !Number.isNaN(Date.parse(val)), {
      message: "Data esperada inválida",
    }),
  source: z.string().max(80).optional().nullable(),
  clientId: z.string().min(1),
})

export const crmTaskSchema = z
  .object({
    title: z.string().min(2).max(140),
    description: z.string().max(1000).optional().nullable(),
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
    content: z.string().min(2).max(2000),
    clientId: z.string().optional().nullable(),
    dealId: z.string().optional().nullable(),
  })
  .refine((data) => Boolean(data.clientId || data.dealId), {
    message: "Informe cliente ou negócio para a interação",
    path: ["clientId"],
  })

export const contractGenerateSchema = z.object({
  clientId: z.string().min(1),
  title: z.string().min(3).max(140),
  contractValue: z.coerce.number().min(0).default(0),
  serviceDescription: z.string().min(3).max(2000),
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
  city: z.string().min(2).max(80).default("Arapiraca"),
})

export type BookingInput = z.infer<typeof bookingSchema>
export type LeadInput = z.infer<typeof leadSchema>
export type ClientInput = z.infer<typeof clientSchema>
export type CrmDealInput = z.infer<typeof crmDealSchema>
export type CrmTaskInput = z.infer<typeof crmTaskSchema>
export type CrmActivityInput = z.infer<typeof crmActivitySchema>
export type ContractGenerateInput = z.infer<typeof contractGenerateSchema>