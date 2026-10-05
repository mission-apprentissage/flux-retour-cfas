import type { ObjectId } from "bson";
import type { Document } from "mongodb";
import { STATUT_PRESENCE_REFERENTIEL } from "shared/constants/organisme";
import type {
  CfaEtablissementsSortBy,
  ICfaAdoptionStats,
  ICfaEtablissement,
  StatsPeriod,
} from "shared/models/data/nationalStats.model";
import { normalizeToUTCDay } from "shared/utils/date";

import {
  buildDossierEnvoyeMatch,
  fetchCollaborationsByOrgId,
} from "@/common/actions/admin/collaborations/collaboration-stats.actions";
import {
  calculateStartDateAsync,
  createStatWithVariation,
} from "@/common/actions/mission-locale/mission-locale-stats.helpers";
import { findEligibleOrganismes } from "@/common/actions/organismes/deca-cfa-eligibility";
import { buildOrganismeNatureFilter, buildOrganismeSearchFilter } from "@/common/actions/organismes/organismes.actions";
import { missionLocaleEffectifsDb, organisationsDb, organismesDb, usersMigrationDb } from "@/common/model/collections";

export interface CfaTerritoire {
  regions?: string[];
  departements?: string[];
}

/**
 * Établissements de formation retenus sur un territoire : présents dans le référentiel et non fermés.
 * Source provisoire de l'estimation du nombre de CFA, en attendant l'arbitrage métier (Carif-Oref, catalogue…).
 */
export const buildCfaTerritoireMatch = ({ regions, departements }: CfaTerritoire = {}) => ({
  est_dans_le_referentiel: STATUT_PRESENCE_REFERENTIEL.PRESENT,
  ferme: { $ne: true },
  ...(regions?.length ? { "adresse.region": { $in: regions } } : {}),
  ...(departements?.length ? { "adresse.departement": { $in: departements } } : {}),
});

const countOrganismesWithCollaboration = async (organismeIds: ObjectId[], endExclusive: Date) =>
  organismeIds.length === 0
    ? 0
    : (
        await missionLocaleEffectifsDb().distinct(
          "effectif_snapshot.organisme_id",
          buildDossierEnvoyeMatch(endExclusive, organismeIds)
        )
      ).length;

export async function getCfaAdoptionStats(period: StatsPeriod, regions?: string[]): Promise<ICfaAdoptionStats> {
  const evaluationDate = normalizeToUTCDay(new Date());
  const startDate = await calculateStartDateAsync(period, evaluationDate);

  const organismes = await organismesDb()
    .find(buildCfaTerritoireMatch({ regions }), { projection: { _id: 1, has_account: 1 } })
    .toArray();
  const organismeIds = organismes.map((organisme) => organisme._id);

  const [eligibles, avecCollaboration, avecCollaborationDebut] = await Promise.all([
    organismeIds.length ? findEligibleOrganismes(organismeIds) : Promise.resolve([]),
    countOrganismesWithCollaboration(organismeIds, new Date()),
    countOrganismesWithCollaboration(organismeIds, startDate),
  ]);

  return {
    estimation: organismes.length,
    compatibles: eligibles.length,
    avec_compte: organismes.filter((organisme) => organisme.has_account === true).length,
    avec_collaboration: createStatWithVariation(avecCollaboration, avecCollaborationDebut),
    period,
  };
}

export interface CfaEtablissementsFilters extends CfaTerritoire {
  search?: string;
  natures?: string[];
  utilisateur?: boolean;
  qualiopi?: boolean;
  collabActive?: boolean;
  sortBy: CfaEtablissementsSortBy;
  sortOrder: "asc" | "desc";
}

const COLLAB_ACTIVE_MATCH = { is_allowed_collab: true, collab_suspended_at: null };

const fetchDerniereConnexionByOrgId = async (organismeIds: ObjectId[]): Promise<Map<string, Date>> => {
  if (organismeIds.length === 0) return new Map();

  const organisations = await organisationsDb()
    .find(
      { type: "ORGANISME_FORMATION", organisme_id: { $in: organismeIds.map((id) => id.toString()) } },
      { projection: { _id: 1, organisme_id: 1 } }
    )
    .toArray();
  if (organisations.length === 0) return new Map();

  const connexions = await usersMigrationDb()
    .aggregate<{ _id: ObjectId; last: Date }>([
      {
        $match: {
          organisation_id: { $in: organisations.map((organisation) => organisation._id) },
          account_status: "CONFIRMED",
          last_connection: { $ne: null },
        },
      },
      { $group: { _id: "$organisation_id", last: { $max: "$last_connection" } } },
    ])
    .toArray();
  const lastByOrganisation = new Map(connexions.map((row) => [row._id.toString(), row.last]));

  const result = new Map<string, Date>();
  for (const organisation of organisations) {
    const organismeId = (organisation as { organisme_id?: string }).organisme_id;
    const last = lastByOrganisation.get(organisation._id.toString());
    if (!organismeId || !last) continue;
    const current = result.get(organismeId);
    if (!current || last > current) result.set(organismeId, last);
  }
  return result;
};

const compareNullable = <T>(a: T | null, b: T | null, compare: (x: T, y: T) => number, direction: number) => {
  if (a === null || b === null) return a === b ? 0 : a === null ? 1 : -1;
  return compare(a, b) * direction;
};

const compareText = (a: string, b: string) => a.localeCompare(b, "fr", { sensitivity: "base" });

const ETABLISSEMENT_COMPARATORS: Record<
  CfaEtablissementsSortBy,
  (a: ICfaEtablissement, b: ICfaEtablissement, direction: number) => number
> = {
  nom: (a, b, direction) => compareNullable(a.nom, b.nom, compareText, direction),
  localisation: (a, b, direction) =>
    compareNullable(a.adresse?.commune || null, b.adresse?.commune || null, compareText, direction),
  compte: (a, b, direction) => (Number(a.has_account) - Number(b.has_account)) * direction,
  collaborations: (a, b, direction) => (a.nb_collaborations - b.nb_collaborations) * direction,
  activite: (a, b, direction) =>
    compareNullable(a.derniere_activite, b.derniere_activite, (x, y) => x.getTime() - y.getTime(), direction),
};

/** Établissements du territoire filtrés et triés ; les colonnes calculées (collaborations, activité) imposent un tri en mémoire. */
export async function listCfaEtablissements({
  regions,
  departements,
  search,
  natures,
  utilisateur,
  qualiopi,
  collabActive,
  sortBy,
  sortOrder,
}: CfaEtablissementsFilters): Promise<ICfaEtablissement[]> {
  const filters: Document[] = [buildCfaTerritoireMatch({ regions, departements })];
  if (natures?.length) filters.push(buildOrganismeNatureFilter(natures));
  if (utilisateur !== undefined) filters.push({ has_account: utilisateur ? true : { $ne: true } });
  if (qualiopi !== undefined) filters.push({ qualiopi: qualiopi ? true : { $ne: true } });
  if (collabActive !== undefined) filters.push(collabActive ? COLLAB_ACTIVE_MATCH : { $nor: [COLLAB_ACTIVE_MATCH] });
  if (search && search.trim().length >= 2) filters.push(buildOrganismeSearchFilter(search));

  const organismes = await organismesDb()
    .find(
      { $and: filters },
      {
        projection: {
          _id: 1,
          enseigne: 1,
          raison_sociale: 1,
          uai: 1,
          siret: 1,
          nature: 1,
          qualiopi: 1,
          has_account: 1,
          is_allowed_collab: 1,
          collab_suspended_at: 1,
          "adresse.code_postal": 1,
          "adresse.commune": 1,
          "adresse.complete": 1,
          "adresse.departement": 1,
        },
      }
    )
    .toArray();
  const organismeIds = organismes.map((organisme) => organisme._id);

  const [collaborations, connexions] = await Promise.all([
    fetchCollaborationsByOrgId(organismeIds, new Date()),
    fetchDerniereConnexionByOrgId(organismeIds),
  ]);

  const rows: ICfaEtablissement[] = organismes.map((organisme) => {
    const id = organisme._id.toString();
    return {
      id,
      nom: (organisme.enseigne || organisme.raison_sociale)?.trim() || null,
      uai: organisme.uai ?? null,
      siret: organisme.siret,
      nature: organisme.nature ?? null,
      qualiopi: organisme.qualiopi ?? null,
      departement: organisme.adresse?.departement ?? null,
      adresse: organisme.adresse
        ? {
            code_postal: organisme.adresse.code_postal,
            commune: organisme.adresse.commune,
            complete: organisme.adresse.complete,
          }
        : null,
      has_account: organisme.has_account === true,
      collab_active: organisme.is_allowed_collab === true && !organisme.collab_suspended_at,
      nb_collaborations: collaborations.get(id)?.nb ?? 0,
      derniere_activite: connexions.get(id) ?? null,
    };
  });

  const direction = sortOrder === "asc" ? 1 : -1;
  const compare = ETABLISSEMENT_COMPARATORS[sortBy];
  return rows.sort((a, b) => compare(a, b, direction) || ETABLISSEMENT_COMPARATORS.nom(a, b, 1));
}
