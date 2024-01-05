import { Rncp } from "./rncp";

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
  rncp: Rncp | null;
};

export interface IndicateursOrganismes {
  tauxCouverture: {
    total: number;
    responsables: number;
    responsablesFormateurs: number;
    formateurs: number;
    inconnue: number;
  };
  totalOrganismes: {
    total: number;
    responsables: number;
    responsablesFormateurs: number;
    formateurs: number;
    inconnue: number;
  };
  organismesTransmetteurs: {
    total: number;
    responsables: number;
    responsablesFormateurs: number;
    formateurs: number;
    inconnue: number;
  };
  organismesNonTransmetteurs: {
    total: number;
    responsables: number;
    responsablesFormateurs: number;
    formateurs: number;
    inconnue: number;
  };
}

export type IndicateursOrganismesAvecDepartement = IndicateursOrganismes & { departement: string };
