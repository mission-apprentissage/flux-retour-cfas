import { z, ZodRawShape } from "zod";

export const paginationFiltersSchema = {
  page: z.coerce.number().int().nonnegative().optional(),
  limit: z.coerce.number().int().nonnegative().optional(),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).optional(),
};

export function withPaginationSchema<T extends ZodRawShape>(schema: T) {
  return {
    ...schema,
    ...paginationFiltersSchema,
  };
}

export type IPaginationFilters = z.infer<z.ZodObject<typeof paginationFiltersSchema>>;

export type WithPagination<T extends ZodRawShape> = z.infer<z.ZodObject<T>> & IPaginationFilters;
