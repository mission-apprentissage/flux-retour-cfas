import { z } from "zod";

const userProfileSchema = () =>
  z.object({
    civility: z.enum(["Monsieur", "Madame"]).optional(),
    prenom: z.string().optional(),
    nom: z.string().optional(),
    email: z.string().email().optional(),
    telephone: z.string().optional(),
  });

export default userProfileSchema;
