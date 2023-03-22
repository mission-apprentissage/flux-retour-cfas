import { z } from "zod";

import { organisationTypes } from "../model/organisations.model.js";
import { generateRandomAlphanumericPhrase } from "../utils/miscUtils.js";

const registrationSchema = () =>
  z.object({
    password: z.preprocess((v: any) => v || generateRandomAlphanumericPhrase(), z.string()),
    prenom: z.string(),
    nom: z.string(),
    email: z.string(),
    civility: z.string(),
    siret: z.string(),
    uai: z.string().nullable().optional(),
    // @ts-expect-error
    type_organisation: z.enum(organisationTypes.filter((v) => v !== "ADMINISTRATEUR")),
  });

export default registrationSchema;
