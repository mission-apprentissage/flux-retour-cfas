import { z } from "zod";

export const registrationSchema = {
  user: z.object({
    email: z.string(),
    civility: z.enum(["Madame", "Monsieur"]),
    nom: z.string(),
    prenom: z.string(),
    fonction: z.string(),
    telephone: z.string(),
    password: z.string(),
    has_accept_cgu_version: z.string(),
  }),
  organisation: z.discriminatedUnion("type", [
    z.object({
      type: z.enum([
        "ORGANISME_FORMATION_FORMATEUR",
        "ORGANISME_FORMATION_RESPONSABLE",
        "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR",
      ]),
      uai: z.string().nullable(),
      siret: z.string(),
    }),
    z.object({ type: z.literal("TETE_DE_RESEAU"), reseau: z.string() }),
    z.object({ type: z.enum(["DREETS", "DEETS", "DRAAF", "CONSEIL_REGIONAL"]), code_region: z.string() }),
    z.object({ type: z.literal("DDETS"), code_departement: z.string() }),
    z.object({ type: z.literal("ACADEMIE"), code_academie: z.string() }),
    z.object({ type: z.literal("OPERATEUR_PUBLIC_NATIONAL"), nom: z.string() }),
    z.object({ type: z.literal("ADMINISTRATEUR") }),
  ]),
};

export type RegistrationSchema = z.infer<z.ZodObject<typeof registrationSchema>>;
