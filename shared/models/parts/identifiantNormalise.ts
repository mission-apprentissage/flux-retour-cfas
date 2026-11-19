import { z } from "zod";

export const zIdentifiantNormalise = z.object({
  nom: z.string(),
  prenom: z.string(),
  date_de_naissance: z.date(),
});

export type IIdentifiantNormalise = z.output<typeof zIdentifiantNormalise>;
