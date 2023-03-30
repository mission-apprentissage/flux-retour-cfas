import { z } from "zod";
import { organisationTypes } from "../model/organisations.model.js";

const registrationSchema = () =>
  z.object({
    user: z.object({
      email: z.string(),
      prenom: z.string(),
      civility: z.enum(["Madame", "Monsieur"]),
      nom: z.string(),
      fonction: z.string(),
      telephone: z.string(),
      password: z.string(),
      has_accept_cgu_version: z.string(),
    }),
    organisation: z.object({
      type: z.enum(organisationTypes),

      // of
      uai: z.string().optional(),
      siret: z.string().optional(),

      // tête de réseau
      reseau: z.string().optional(),

      // dreets, deets, draaf, conseil_regional
      code_region: z.string().optional(),
      // ddets
      code_departement: z.string().optional(),
      // academie
      code_academie: z.string().optional(),

      // opérateur public national
      nom: z.string().optional(),
    }),
  });

export default registrationSchema;
