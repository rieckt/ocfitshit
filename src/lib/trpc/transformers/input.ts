import { z } from "zod";

// String transformers
export const trimmedString = z.string().transform((str) => str.trim());
export const normalizedEmail = z
  .string()
  .email()
  .transform((str) => str.toLowerCase().trim());
export const sanitizedString = z
  .string()
  .transform((str) => str.trim().replace(/[^\w\s-]/g, ""));

// UUID transformer
export const uuidString = z.string().uuid();

// Number transformers
export const positiveNumber = z
  .number()
  .positive()
  .transform((n) => Math.abs(Math.round(n)));
export const nonNegativeNumber = z
  .number()
  .min(0)
  .transform((n) => Math.max(0, Math.round(n)));

// Date transformers
export const dateString = z
  .string()
  .datetime()
  .transform((str) => new Date(str));
export const futureDate = z
  .date()
  .refine((date) => date > new Date(), {
    message: "Date must be in the future",
  });

// Common schema builders
export const paginationSchema = z.object({
  limit: z.number().min(1).max(100).default(10),
  cursor: z.number().optional(),
});

export const searchSchema = z.object({
  query: z.string().min(1).transform((str) => str.trim()),
  page: z.number().min(1).default(1),
  perPage: z.number().min(1).max(100).default(20),
});

// Metadata transformer
export const metadataSchema = z
  .record(z.string(), z.unknown())
  .transform((obj) => {
    // Remove null or undefined values
    return Object.fromEntries(
      Object.entries(obj).filter(([_, v]) => v != null)
    );
  });
