import { extensions } from "shared/models/parts/zodPrimitives";
import { z } from "zod";

const userSchema = () =>
  z.object({
    civility: z.string({ required_error: "Champ obligatoire" }),
    prenom: z.string({ required_error: "Champ obligatoire" }),
    nom: z.string({ required_error: "Champ obligatoire" }),
    email: z.string({ required_error: "Champ obligatoire" }).email("Email invalide"),
    fonction: z.string({ required_error: "Champ obligatoire" }),
    telephone: extensions.phone(),
    account_status: z.boolean({}).optional(),
  });

export default userSchema;
