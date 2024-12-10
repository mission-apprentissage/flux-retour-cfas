import type { ObjectId } from "mongodb";

export interface IndicateursEffectifs {
  apprenants: number;
  apprentis: number;
  inscrits: number;
  abandons: number;
  rupturants: number;
}

export type IndicateursEffectifsAvecDepartement = IndicateursEffectifs & { departement: string };

export type IndicateursEffectifsAvecOrganisme = IndicateursEffectifs & {
  _id: ObjectId;
  organisme_id: string;
  nom: string;
  nature: string;
  siret: string;
  uai: string;
};

export type IndicateursEffectifsAvecFormation = IndicateursEffectifs & {
  rncp_code: string | null;
  cfd_code: string | null;
  niveau_europeen: string | null;
  intitule: string | null;
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

export interface IOrganisationIndicateursOrganismes {
  organismes: number;
  fiables: number;
  sansTransmissions: number;
  siretFerme: number;
  natureInconnue: number;
  uaiNonDeterminee: number;
}
