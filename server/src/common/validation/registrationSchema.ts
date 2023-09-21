import { z } from "zod";

import { TETE_DE_RESEAUX, TeteDeReseauKey } from "@/common/constants/networks";
import { ORGANISATIONS_NATIONALES, OrganisationsNationalesKey } from "@/common/constants/organisations";

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
      type: z.literal("ORGANISME_FORMATION"),
      uai: z.string().nullable(),
      siret: z.string(),
    }),
    z.object({
      type: z.literal("TETE_DE_RESEAU"),
      reseau: z.enum(TETE_DE_RESEAUX.map((reseau) => reseau.key) as [TeteDeReseauKey, ...TeteDeReseauKey[]]),
    }),
    z.object({ type: z.enum(["DREETS", "DRAAF", "CONSEIL_REGIONAL", "CARIF_OREF_REGIONAL"]), code_region: z.string() }),
    z.object({ type: z.literal("DDETS"), code_departement: z.string() }),
    z.object({ type: z.literal("ACADEMIE"), code_academie: z.string() }),
    z.object({
      type: z.literal("OPERATEUR_PUBLIC_NATIONAL"),
      nom: z.enum(
        ORGANISATIONS_NATIONALES.map((org) => org.key) as [OrganisationsNationalesKey, ...OrganisationsNationalesKey[]]
      ),
    }),
    z.object({ type: z.literal("CARIF_OREF_NATIONAL") }),
    z.object({ type: z.literal("ADMINISTRATEUR") }),
  ]),
};

export type RegistrationSchema = z.infer<z.ZodObject<typeof registrationSchema>>;
