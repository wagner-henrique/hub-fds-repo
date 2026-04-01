import { z } from "zod"

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
})

export const bookingSchema = z.object({
  name: z.string().min(3).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(20).optional().nullable(),
  room: z.enum(["reuniao", "treinamento", "coworking", "arapiraca", "auditorio"]).default("reuniao"),
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

export type BookingInput = z.infer<typeof bookingSchema>
export type LeadInput = z.infer<typeof leadSchema>