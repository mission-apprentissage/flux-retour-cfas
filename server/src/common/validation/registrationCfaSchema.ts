import { z } from "zod";

export const registrationCfaSchema = {
  token: z.string(),
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prénom est requis"),
  telephone: z.string().regex(/^\d{10}$/, "Le numéro de téléphone doit contenir 10 chiffres"),
  fonction: z.string().min(1, "L'intitulé de poste est requis"),
  password: z
    .string()
    .min(12, "Le mot de passe doit contenir au moins 12 caractères")
    .regex(/[a-z]/, "Le mot de passe doit contenir au moins 1 lettre minuscule")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins 1 lettre majuscule")
    .regex(/\d/, "Le mot de passe doit contenir au moins 1 chiffre")
    .regex(/[^a-zA-Z0-9]/, "Le mot de passe doit contenir au moins 1 caractère spécial"),
  has_accept_cgu_version: z.string(),
};

export type RegistrationCfaSchema = z.infer<z.ZodObject<typeof registrationCfaSchema>>;
