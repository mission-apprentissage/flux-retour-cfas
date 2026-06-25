import { z } from "zod";

import { zAccConjointMotifEnum, zVerifiedInfo } from "../../../data/missionLocaleEffectif.model";
import { extensions } from "../../../parts/zodPrimitives";

// Schéma d'entrée strict pour la demande de collaboration : le téléphone de l'apprenant est
// obligatoire et son format est validé (via le standard partagé extensions.phone, libphonenumber).
// Volontairement distinct de zVerifiedInfo, qui reste permissif (telephone nullish) pour pouvoir
// continuer à relire les documents legacy stockés sans téléphone.
const zVerifiedInfoInput = zVerifiedInfo.extend({
  telephone: extensions.phone().refine((v) => !!v, { message: "Le numéro de téléphone est obligatoire" }),
});

export const updateMissionLocaleEffectifOrganismeApi = {
  rupture: z.boolean(),
  acc_conjoint: z.boolean().optional(),
  motif: z.array(zAccConjointMotifEnum).optional(),
  commentaires: z.string().optional(),
  still_at_cfa: z.boolean().optional(),
  commentaires_par_motif: z.record(zAccConjointMotifEnum, z.string()).optional(),
  cause_rupture: z.string().optional(),
  referent_type: z.enum(["me", "other"]).optional(),
  referent_coordonnees: z.string().optional(),
  note_complementaire: z.string().optional(),
  verified_info: zVerifiedInfoInput.optional(),
};

export type IUpdateMissionLocaleEffectifOrganisme = z.output<
  z.ZodObject<typeof updateMissionLocaleEffectifOrganismeApi>
>;
