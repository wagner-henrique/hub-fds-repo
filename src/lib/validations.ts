import { z } from "zod";

export const bookingSchema = z.object({
  name: z.string().min(3).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
});

export type BookingInput = z.infer<typeof bookingSchema>;