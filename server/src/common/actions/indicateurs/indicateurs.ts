export interface IndicateursEffectifs {
  apprenants: number;
  apprentis: number;
  inscritsSansContrat: number;
  abandons: number;
  rupturants: number;
}

export type IndicateursEffectifsParDepartement = { [key: string]: IndicateursEffectifs };

export interface IndicateursOrganismes {
  tauxCouverture: number;
  totalOrganismes: number;
  organismesTransmetteurs: number;
  organismesNonTransmetteurs: number;
}

export type IndicateursOrganismesParDepartement = { [key: string]: IndicateursOrganismes };
