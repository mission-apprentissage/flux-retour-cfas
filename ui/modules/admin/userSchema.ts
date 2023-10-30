import { z } from "zod";

const userSchema = () =>
  z.object({
    civility: z.string({ required_error: "Champ obligatoire" }),
    prenom: z.string({ required_error: "Champ obligatoire" }),
    nom: z.string({ required_error: "Champ obligatoire" }),
    email: z.string({ required_error: "Champ obligatoire" }).email("Email invalide"),
    account_status: z.boolean({}).optional(),
  });

export default userSchema;
