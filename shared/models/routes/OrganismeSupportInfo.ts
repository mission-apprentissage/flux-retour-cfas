import type { WithId } from "mongodb";
import type { Jsonify } from "type-fest";

import ApiEntEtablissement from "../apis/@types/ApiEntEtablissement.d";
import { FiabilisationUaiSiret, Organisme, OrganismesReferentiel, UsersMigration } from "../data/@types";
import { OffreFormation } from "../data/@types/OffreFormation";
import { OrganisationOrganismeFormation } from "../data/organisations.model";

export interface OrganismeSupportInfo {
  uai: string | null;
  siret: string;
  nom: string;
  tdb: WithId<Organisme> | null;
  referentiel: OrganismesReferentiel | null;
  fiabilisation: FiabilisationUaiSiret | null;
  formations: OffreFormation[];
  apiEntreprise: ApiEntEtablissement | null;
  organisation: (OrganisationOrganismeFormation & { users: UsersMigration[] }) | null;
  etat: Array<"fermé" | "actif" | "inconnu">;
  effectifs: number;
}

export type OrganismeSupportInfoJson = Jsonify<OrganismeSupportInfo>;
