import { z } from "zod";

import { generateRandomAlphanumericPhrase } from "../utils/miscUtils.js";

const userSchema = ({ isNew }) =>
  z.object({
    ...(isNew
      ? {
          password: z.preprocess((v: any) => v || generateRandomAlphanumericPhrase(), z.string()),
        }
      : {}),
    prenom: z.string(),
    nom: z.string(),
    email: z.string().email(),
    roles: z.string().array(),
    is_admin: z.boolean().optional(),
  });

export default userSchema;
