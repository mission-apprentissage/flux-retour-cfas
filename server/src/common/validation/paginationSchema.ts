import { z } from "zod";

const paginationShema = ({ defaultSort }) =>
  z.object({
    page: z.preprocess((v: any) => parseInt(v || "1", 10), z.number().positive().max(10000)),
    limit: z.preprocess((v: any) => parseInt(v || "10", 10), z.number().positive().max(10000)),
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
