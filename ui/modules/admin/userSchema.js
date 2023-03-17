import { z } from "zod";

const userSchema = () =>
  z.object({
    prenom: z.string({ required_error: "Champ obligatoire" }),
    nom: z.string({ required_error: "Champ obligatoire" }),
    email: z.string({ required_error: "Champ obligatoire" }).email("Email invalide"),
    roles: z.string({ required_error: "Champ obligatoire" }).array(),
    is_admin: z.boolean({}).optional(),
  });

export default userSchema;
