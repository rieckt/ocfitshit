import { z } from "zod";

/**
 * Common pagination schema
 */
export const paginationSchema = z.object({
  limit: z.number().min(1).max(100).default(10),
  cursor: z.number().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/**
 * Common search schema
 */
export const searchSchema = z.object({
  query: z.string().min(1).transform((str) => str.trim()),
  page: z.number().min(1).default(1),
  perPage: z.number().min(1).max(100).default(20),
});

export type SearchInput = z.infer<typeof searchSchema>;

/**
 * Common ID schema
 */
export const idSchema = z.object({
  id: z.string().uuid(),
});

export type IdInput = z.infer<typeof idSchema>;

/**
 * Common date range schema
 */
export const dateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
}).refine(
  (data) => data.startDate <= data.endDate,
  "End date must be after start date"
);

export type DateRangeInput = z.infer<typeof dateRangeSchema>;

/**
 * Common metadata schema
 */
export const metadataSchema = z
  .record(z.string(), z.unknown())
  .transform((obj) => {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, v]) => v != null)
    );
  });

export type MetadataInput = z.infer<typeof metadataSchema>;
