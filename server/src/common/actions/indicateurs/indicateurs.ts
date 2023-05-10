export interface IndicateursEffectifs {
  apprenants: number;
  apprentis: number;
  inscritsSansContrat: number;
  abandons: number;
  rupturants: number;
}

export type IndicateursEffectifsAvecDepartement = IndicateursEffectifs & { departement: string };

export interface IndicateursOrganismes {
  tauxCouverture: number;
  totalOrganismes: number;
  organismesTransmetteurs: number;
  organismesNonTransmetteurs: number;
}

export type IndicateursOrganismesAvecDepartement = IndicateursOrganismes & { departement: string };
