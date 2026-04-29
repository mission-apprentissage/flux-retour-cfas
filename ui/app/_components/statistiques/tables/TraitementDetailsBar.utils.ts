import type { ITraitementDetails } from "shared/models/data/nationalStats.model";

import { TRAITEMENT_SEGMENTS_V2 } from "../constants";

export type SegmentKey = (typeof TRAITEMENT_SEGMENTS_V2)[number]["key"];

export function regroupV1ToV2(details: ITraitementDetails): Record<SegmentKey, number> {
  return {
    rdv_pris: details.rdv_pris,
    projet_pro_securise: details.nouveau_projet,
    ne_souhaite_pas_accompagnement:
      details.ne_veut_pas_accompagnement +
      details.ne_souhaite_pas_etre_recontacte +
      details.cherche_contrat +
      details.reorientation,
    a_recontacter: details.contacte_sans_retour,
    injoignable: details.injoignables + details.coordonnees_incorrectes,
    autre: details.autre_avec_contact,
  };
}
