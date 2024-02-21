import type { Jsonify } from "type-fest";

import ApiEntEtablissement from "../apis/@types/ApiEntEtablissement.d";
import { FiabilisationUaiSiret, OrganismesReferentiel, UsersMigration } from "../data/@types";
import { OffreFormation } from "../data/@types/OffreFormation";
import { IOrganisationOrganismeFormation } from "../data/organisations.model";
import { IOrganisme } from "../data/organismes.model";

export type TransmissionStat = {
  date: string;
  source_organisme: {
    uai: string;
    siret: string;
    nom: string;
  };
  organisme: {
    uai: string;
    siret: string;
    nom: string;
  };
  total: number;
  error: number;
  success: number;
};

export interface OrganismeSupportInfo {
  uai: string | null;
  siret: string;
  nom: string;
  tdb: IOrganisme | null;
  referentiel: OrganismesReferentiel | null;
  fiabilisation: FiabilisationUaiSiret | null;
  formations: OffreFormation[];
  apiEntreprise: ApiEntEtablissement | null;
  organisation: (IOrganisationOrganismeFormation & { users: UsersMigration[] }) | null;
  etat: Array<"fermé" | "actif" | "inconnu">;
  effectifs: number;
  transmissions: TransmissionStat[];
}

export type OrganismeSupportInfoJson = Jsonify<OrganismeSupportInfo>;
