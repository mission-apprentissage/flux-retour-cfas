import { zOrganisationCreate } from "shared/models/data/organisations.model";
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
  organisation: zOrganisationCreate,
};

export type RegistrationSchema = z.infer<z.ZodObject<typeof registrationSchema>>;

export const registrationUnknownNetworkSchema = {
  email: z.string(),
  unknownNetwork: z.string(),
};

export type RegistrationUnknownNetworkSchema = z.infer<z.ZodObject<typeof registrationUnknownNetworkSchema>>;
