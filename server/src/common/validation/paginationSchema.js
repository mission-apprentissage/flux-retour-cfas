import { z } from "zod";

const paginationShema = ({ defaultSort }) =>
  z.object({
    page: z.preprocess((/** @type {any}*/ v) => parseInt(v || 1, 10), z.number().positive().max(10000)),
    limit: z.number().default(10),
    sort: z.preprocess(
      (/** @type {any}*/ v) => {
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
