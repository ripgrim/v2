import { z } from "zod";

/**
 * Closed-beta access queue status. Server-assigned only — new signups default
 * to "pending" and are gated out of the product until promoted to "approved".
 */
export const accessStatusSchema = z.enum(["pending", "approved", "rejected"]);
export type AccessStatus = z.infer<typeof accessStatusSchema>;
export const ACCESS_STATUSES = accessStatusSchema.options;
