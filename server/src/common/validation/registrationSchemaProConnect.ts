import { z } from "zod";

export const registrationProConnectSchema = {
  user: z.object({
    civility: z.enum(["Madame", "Monsieur"]),
    nom: z.string(),
    prenom: z.string(),
    fonction: z.string(),
    telephone: z.string(),
    has_accept_cgu_version: z.string(),
  }),
};

export type RegistrationProConnectSchema = z.infer<z.ZodObject<typeof registrationProConnectSchema>>;
