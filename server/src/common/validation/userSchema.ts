import { z } from "zod";

import { generateRandomAlphanumericPhrase } from "../utils/miscUtils.js";

const userSchema = ({ isNew }) =>
  z.object({
    ...(isNew
      ? {
          password: z.preprocess((/** @type {any}*/ v: any) => v || generateRandomAlphanumericPhrase(), z.string()),
        }
      : {}),
    prenom: z.string(),
    nom: z.string(),
    email: z.string(),
    roles: z.string().array(),
    is_admin: z.boolean().optional(),
  });

export default userSchema;
