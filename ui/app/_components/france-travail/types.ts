export interface ISecteurArborescence {
  code_secteur: number;
  libelle_secteur: string;
  count: number;
}

export interface IArborescenceResponse {
  a_traiter: {
    total: number;
    secteurs: ISecteurArborescence[];
  };
  traite: number;
}
