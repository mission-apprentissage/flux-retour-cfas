import type { WithId } from "mongodb";
import type { Jsonify } from "type-fest";

import ApiEntEtablissement from "../apis/@types/ApiEntEtablissement.d";
import { FiabilisationUaiSiret, Organisme, OrganismesReferentiel } from "../data/@types";
import { OffreFormation } from "../data/@types/OffreFormation";
import { OrganisationOrganismeFormation } from "../data/organisations.model";
import { IUsersMigration } from "../data/usersMigration.model";

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
  tdb: WithId<Organisme> | null;
  referentiel: OrganismesReferentiel | null;
  fiabilisation: FiabilisationUaiSiret | null;
  formations: OffreFormation[];
  apiEntreprise: ApiEntEtablissement | null;
  organisation: (OrganisationOrganismeFormation & { users: IUsersMigration[] }) | null;
  etat: Array<"fermé" | "actif" | "inconnu">;
  effectifs: number;
  transmissions: TransmissionStat[];
}

export type OrganismeSupportInfoJson = Jsonify<OrganismeSupportInfo>;
