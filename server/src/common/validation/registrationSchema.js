import { z } from "zod";

import { ORGANISMES_APPARTENANCE } from "../constants/usersConstants.js";
import { generateRandomAlphanumericPhrase } from "../utils/miscUtils.js";

const registrationSchema = () =>
  z.object({
    password: z.preprocess((/** @type {any}*/ v) => v || generateRandomAlphanumericPhrase(), z.string()),
    prenom: z.string(),
    nom: z.string(),
    email: z.string(),
    type: z.enum(["pilot", "of", "reseau_of"]),
    siret: z.string(),
    uai: z.string().nullable().optional(),
    civility: z.string(),
    // @ts-ignore
    organismes_appartenance: z.enum(Object.keys(ORGANISMES_APPARTENANCE)),
  });

export default registrationSchema;
