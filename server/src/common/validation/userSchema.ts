import { z } from "zod";

import { generateRandomAlphanumericPhrase } from "../utils/miscUtils.js";

const userSchema = ({ isNew }) =>
  z.object({
    ...(isNew
      ? {
          password: z.preprocess((v: any) => v || generateRandomAlphanumericPhrase(), z.string()),
        }
      : {}),
    civility: z.string(),
    prenom: z.string(),
    nom: z.string(),
    email: z.string().email(),
  });

export default userSchema;
