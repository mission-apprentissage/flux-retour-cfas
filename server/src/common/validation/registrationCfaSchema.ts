import { z } from "zod";

import { zPassword } from "./passwordSchema";

export const registrationCfaSchema = {
  token: z.string(),
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prénom est requis"),
  telephone: z.string().regex(/^\d{10}$/, "Le numéro de téléphone doit contenir 10 chiffres"),
  fonction: z.string().min(1, "L'intitulé de poste est requis"),
  password: zPassword(),
  has_accept_cgu_version: z.string(),
};

export type RegistrationCfaSchema = z.infer<z.ZodObject<typeof registrationCfaSchema>>;
