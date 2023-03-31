import { z } from "zod";

const registrationSchema = () =>
  z.object({
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
      z.object({ type: z.literal("ORGANISME_FORMATION_FORMATEUR"), uai: z.string(), siret: z.string() }),
      z.object({ type: z.literal("TETE_DE_RESEAU"), reseau: z.string() }),
      z.object({ type: z.enum(["DREETS", "DEETS", "DRAAF", "CONSEIL_REGIONAL"]), code_region: z.string() }),
      z.object({ type: z.literal("DDETS"), code_departement: z.string() }),
      z.object({ type: z.literal("ACADEMIE"), code_academie: z.string() }),
      z.object({ type: z.literal("OPERATEUR_PUBLIC_NATIONAL"), nom: z.string() }),
      z.object({ type: z.literal("ADMINISTRATEUR") }),
    ]),
  });

export default registrationSchema;
