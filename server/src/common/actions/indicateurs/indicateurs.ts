import { ArrayElement } from "mongodb";

import { Organisme } from "@/common/model/@types";

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

export type IndicateursEffectifsAvecFormation = IndicateursEffectifs &
  ArrayElement<Organisme["formationsResponsableFormateur"]>;

export interface IndicateursOrganismes {
  tauxCouverture: number;
  totalOrganismes: number;
  organismesTransmetteurs: number;
  organismesNonTransmetteurs: number;
}

export type IndicateursOrganismesAvecDepartement = IndicateursOrganismes & { departement: string };
