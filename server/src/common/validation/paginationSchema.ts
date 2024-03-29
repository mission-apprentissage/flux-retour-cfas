import { z } from "zod";

const paginationShema = ({ defaultSort }: { defaultSort: string }) =>
  z.object({
    page: z.coerce.number().positive().max(10000).default(1),
    limit: z.coerce.number().positive().max(10000).default(10),
    sort: z.preprocess(
      (v: any) => {
        const value = (v || defaultSort).split(":");
        return { field: value[0], direction: parseInt(value[1], 10) };
      },
      z
        .object({
          field: z.string(),
          direction: z.number().min(-1).max(1),
        })
        .transform((v) => ({ [v.field]: v.direction }))
    ),
  });
export default paginationShema;
