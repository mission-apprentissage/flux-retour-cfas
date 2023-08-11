export interface FormationBase {
  formation_id: string;
  cle_ministere_educatif: string;
  cfd: string;
  rncp?: string; // 1000 cas sans rncp
  intitule_long: string;
  lieu_formation_adresse: string;
  annee_formation: number;
  niveau: string;
  duree_formation_theorique: number;
}

export type FormationFormateur = FormationBase & {
  organisme_responsable: {
    organisme_id: string;
    siret: string;
    uai?: string;
  };
};
export type FormationResponsable = FormationBase & {
  organisme_formateur: {
    organisme_id: string;
    siret: string;
    uai?: string;
  };
};
export type FormationResponsableFormateur = FormationBase;

export type FormationsOrganismes = {
  formationsFormateur: FormationFormateur[];
  formationsResponsable: FormationResponsable[];
  formationsResponsableFormateur: FormationResponsableFormateur[];
};
