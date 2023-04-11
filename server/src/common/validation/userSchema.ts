import { z } from "zod";

const userSchema = () =>
  z.object({
    civility: z.enum(["Monsieur", "Madame"]),
    prenom: z.string(),
    nom: z.string(),
    email: z.string().email(),
  });

export default userSchema;
