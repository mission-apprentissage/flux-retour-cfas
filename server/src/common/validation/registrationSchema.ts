import { zOrganisationCreate } from "shared/models/data/organisations.model";
import { z } from "zod";

import { ADMIN_PASSWORD_MIN_LENGTH, zPassword } from "./passwordSchema";

export const registrationSchema = {
  user: z.object({
    email: z.string(),
    civility: z.enum(["Madame", "Monsieur"]),
    nom: z.string(),
    prenom: z.string(),
    fonction: z.string(),
    telephone: z.string(),
    password: zPassword(),
    has_accept_cgu_version: z.string(),
  }),
  organisation: zOrganisationCreate,
};

export type RegistrationSchema = z.infer<z.ZodObject<typeof registrationSchema>>;

export const zRegistration = z.strictObject(registrationSchema).superRefine(({ user, organisation }, ctx) => {
  if (organisation.type !== "ADMINISTRATEUR") {
    return;
  }
  const result = zPassword(ADMIN_PASSWORD_MIN_LENGTH).safeParse(user.password);
  if (!result.success) {
    for (const issue of result.error.issues) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["user", "password"], message: issue.message });
    }
  }
});

export const registrationUnknownNetworkSchema = {
  email: z.string(),
  unknownNetwork: z.string(),
};

export type RegistrationUnknownNetworkSchema = z.infer<z.ZodObject<typeof registrationUnknownNetworkSchema>>;
