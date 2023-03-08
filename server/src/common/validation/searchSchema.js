import { z } from "zod";

const searchShema = () =>
  z.object({
    q: z.string().optional(),
  });

export default searchShema;
