import { DuplicateEffectifDetail } from "./DuplicateEffectifDetail";

export type DuplicateEffectifGroup = {
  _id: {
    nom_apprenant: string;
    prenom_apprenant: string;
    date_de_naissance_apprenant: string;
    annee_scolaire: string;
    formation_cfd: string;
  };
  duplicates: DuplicateEffectifDetail[];
};
