export type DuplicateEffectif = {
  _id: {
    nom_apprenant: string;
    prenom_apprenant: string;
    date_de_naissance_apprenant: string;
    annee_scolaire: string;
    formation_cfd: string;
  };
  count: number;
  duplicates: [{ id: string; created_at: Date }];
};
