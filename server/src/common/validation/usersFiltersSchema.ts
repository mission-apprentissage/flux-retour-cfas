import { z } from "zod";

import paginationShema from "./paginationSchema";
import searchShema from "./searchSchema";

const usersFiltersSchema = () =>
  paginationShema({ defaultSort: "created_at:-1" })
    .merge(searchShema())
    .merge(
      z.object({
        account_status: z.string().optional(),
        type_utilisateur: z.string().optional(),
        reseaux: z.string().optional(),
        departements: z.string().optional(),
        regions: z.string().optional(),
      })
    )
    .strict();

export type UsersFiltersParams = z.infer<ReturnType<typeof usersFiltersSchema>>;

export default usersFiltersSchema;
