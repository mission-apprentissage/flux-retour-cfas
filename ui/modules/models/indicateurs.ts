export interface IndicateursEffectifs {
  apprenants: number;
  apprentis: number;
  inscritsSansContrat: number;
  abandons: number;
  rupturants: number;
}

export type IndicateursEffectifsAvecDepartement = IndicateursEffectifs & { departement: string };

export type IndicateursEffectifsAvecOrganisme = IndicateursEffectifs & {
  organisme_id: string;
  nom: string;
  nature: string;
  siret: string;
  uai: string;
};

export type IndicateursEffectifsAvecFormation = IndicateursEffectifs & {
  rncp_code: string | null;
  rncp: Record<any, any> | null;
}; // TODO importer le modèle complet

export interface IndicateursOrganismes {
  tauxCouverture: number;
  totalOrganismes: number;
  organismesTransmetteurs: number;
  organismesNonTransmetteurs: number;
}

export type IndicateursOrganismesAvecDepartement = IndicateursOrganismes & { departement: string };
