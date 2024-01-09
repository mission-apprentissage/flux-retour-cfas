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
    inconnues: number;
  };
  totalOrganismes: {
    total: number;
    responsables: number;
    responsablesFormateurs: number;
    formateurs: number;
    inconnues: number;
  };
  organismesTransmetteurs: {
    total: number;
    responsables: number;
    responsablesFormateurs: number;
    formateurs: number;
    inconnues: number;
  };
  organismesNonTransmetteurs: {
    total: number;
    responsables: number;
    responsablesFormateurs: number;
    formateurs: number;
    inconnues: number;
  };
}

export type IndicateursOrganismesAvecDepartement = IndicateursOrganismes & { departement: string };
