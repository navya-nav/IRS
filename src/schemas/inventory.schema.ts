import { z } from "zod";

export const ReserveInventorySchema = z.object({
    userId: z
        .string()
        .trim()
        .min(3)
        .max(50)
});

export const ReservationIdSchema = z.object({
    id: z.string().uuid()
});

export type ReserveInventoryDto =
    z.infer<typeof ReserveInventorySchema>;