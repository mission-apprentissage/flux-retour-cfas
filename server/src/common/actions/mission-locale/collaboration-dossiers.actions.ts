import type { ObjectId } from "bson";
import type { Document } from "mongodb";
import { SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import type {
  CollabDossierDelai,
  CollabDossierResultat,
  CollabDossierStatut,
  ICollaborationDossier,
  ICollaborationDossierStructure,
  ICollaborationDossiersResponse,
} from "shared/models/data/nationalStats.model";

import { addSituationDossierField, buildNameSearchConditions } from "@/common/actions/shared/rupture-pipeline.utils";
import { missionLocaleEffectifsDb, organisationsDb, organismesDb, usersMigrationDb } from "@/common/model/collections";
import { escapeRegex } from "@/common/utils/usersFiltersUtils";

export interface CollaborationDossiersTerritoire {
  regions?: string[];
  departements?: string[];
  /** Périmètre de la fiche ML : tous les dossiers reçus par la ML, quelle que soit la région du CFA. */
  missionLocaleId?: ObjectId;
  /** Périmètre de la fiche CFA : tous les dossiers envoyés par ce CFA, quelle que soit la région de la ML. */
  organismeId?: ObjectId;
}

export interface CollaborationDossiersFilters {
  search?: string;
  /** Jours d'envoi AAAA-MM-JJ, en heure de Paris, bornes incluses. */
  dateDebut?: string;
  dateFin?: string;
  statuts?: CollabDossierStatut[];
  delais?: CollabDossierDelai[];
  cfaIds?: ObjectId[];
  mlIds?: ObjectId[];
  situations?: string[];
  motifs?: string[];
  resultats?: CollabDossierResultat[];
}

export const RESULTAT_SITUATIONS: Record<CollabDossierResultat, SITUATION_ENUM[]> = {
  rdv_pris: [SITUATION_ENUM.RDV_PRIS],
  projet_pro_securise: [SITUATION_ENUM.NOUVEAU_PROJET, SITUATION_ENUM.NOUVEAU_CONTRAT],
  ne_souhaite_pas_accompagnement: [
    SITUATION_ENUM.NE_VEUT_PAS_ACCOMPAGNEMENT,
    SITUATION_ENUM.NE_SOUHAITE_PAS_ETRE_RECONTACTE,
    SITUATION_ENUM.CHERCHE_CONTRAT,
    SITUATION_ENUM.REORIENTATION,
  ],
  a_recontacter: [SITUATION_ENUM.CONTACTE_SANS_RETOUR],
  injoignable: [SITUATION_ENUM.INJOIGNABLE_APRES_RELANCES, SITUATION_ENUM.COORDONNEES_INCORRECT],
  autre: [SITUATION_ENUM.AUTRE, SITUATION_ENUM.DEJA_ACCOMPAGNE],
};

const STATUT_MATCH: Record<CollabDossierStatut, Document> = {
  a_traiter: { situation: null },
  a_recontacter: { situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR },
  traite: { situation: { $nin: [null, SITUATION_ENUM.CONTACTE_SANS_RETOUR] } },
};

const DELAI_MATCH: Record<CollabDossierDelai, Document> = {
  "0_10": { delai_jours: { $lte: 10 } },
  "11_20": { delai_jours: { $gte: 11, $lte: 20 } },
  "21_30": { delai_jours: { $gte: 21, $lte: 30 } },
  "30_plus": { delai_jours: { $gt: 30 } },
};

const buildWordsRegexMatch = (search: string, fields: string[]) => ({
  $and: search
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => ({ $or: fields.map((field) => ({ [field]: { $regex: escapeRegex(word), $options: "i" } })) })),
});

const findTerritoireOrganismeIds = async ({
  regions,
  departements,
  missionLocaleId,
  organismeId,
}: CollaborationDossiersTerritoire) => {
  if (organismeId) return [organismeId];
  if (missionLocaleId || (!regions?.length && !departements?.length)) return undefined;
  const organismes = await organismesDb()
    .find(
      {
        ...(regions?.length ? { "adresse.region": { $in: regions } } : {}),
        ...(departements?.length ? { "adresse.departement": { $in: departements } } : {}),
      },
      { projection: { _id: 1 } }
    )
    .toArray();
  return organismes.map((organisme) => organisme._id);
};

const PARIS_TIMEZONE = "Europe/Paris";

const buildBaseMatch = (organismeIds: ObjectId[] | undefined, missionLocaleId?: ObjectId) => ({
  ...(missionLocaleId ? { mission_locale_id: missionLocaleId } : {}),
  "organisme_data.acc_conjoint": true,
  soft_deleted: { $ne: true },
  ...(organismeIds ? { "effectif_snapshot.organisme_id": { $in: organismeIds } } : {}),
});

const buildPeriodeMatch = ({ dateDebut, dateFin }: CollaborationDossiersFilters): Document[] => {
  if (!dateDebut && !dateFin) return [];
  const jourEnvoi = {
    $dateToString: { format: "%Y-%m-%d", date: "$organisme_data.acc_conjoint_at", timezone: PARIS_TIMEZONE },
  };
  return [
    {
      $match: {
        $expr: {
          $and: [
            ...(dateDebut ? [{ $gte: [jourEnvoi, dateDebut] }] : []),
            ...(dateFin ? [{ $lte: [jourEnvoi, dateFin] }] : []),
          ],
        },
      },
    },
  ];
};

/**
 * Délai entre l'envoi et la première action d'un conseiller ML (jusqu'à aujourd'hui sans action). Un dossier avec une
 * situation mais sans log de conseiller (préqualification WhatsApp, conseiller parti) est traité à sa date de traitement.
 */
const buildDelaiStages = (mlUserIds: ObjectId[]): Document[] => [
  {
    $lookup: {
      from: "missionLocaleEffectifLog",
      let: { effectifId: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$mission_locale_effectif_id", "$$effectifId"] }, created_by: { $in: mlUserIds } } },
        { $project: { _id: 0, created_at: 1 } },
      ],
      as: "logs_ml",
    },
  },
  {
    $addFields: {
      premiere_activite_ml_at: {
        $min: {
          $map: {
            input: {
              $filter: {
                input: "$logs_ml",
                as: "log",
                cond: { $gte: ["$$log.created_at", "$organisme_data.acc_conjoint_at"] },
              },
            },
            as: "log",
            in: "$$log.created_at",
          },
        },
      },
      traite_par_ml: {
        $or: [{ $gt: [{ $size: "$logs_ml" }, 0] }, { $ne: [{ $ifNull: ["$situation", null] }, null] }],
      },
    },
  },
  {
    $addFields: {
      delai_jours: {
        $max: [
          0,
          {
            $dateDiff: {
              startDate: "$organisme_data.acc_conjoint_at",
              endDate: {
                $cond: [
                  "$traite_par_ml",
                  {
                    $ifNull: [
                      "$premiere_activite_ml_at",
                      { $ifNull: ["$date_traitement", "$organisme_data.acc_conjoint_at"] },
                    ],
                  },
                  "$$NOW",
                ],
              },
              unit: "day",
              timezone: PARIS_TIMEZONE,
            },
          },
        ],
      },
    },
  },
];

const fetchStructures = async (
  organismeIds: ObjectId[],
  missionLocaleIds: ObjectId[]
): Promise<{ cfa: Map<string, ICollaborationDossierStructure>; ml: Map<string, ICollaborationDossierStructure> }> => {
  const [organismes, missionsLocales] = await Promise.all([
    organismeIds.length
      ? organismesDb()
          .find(
            { _id: { $in: organismeIds } },
            { projection: { enseigne: 1, raison_sociale: 1, nom: 1, "adresse.commune": 1 } }
          )
          .toArray()
      : [],
    missionLocaleIds.length
      ? organisationsDb()
          .find({ _id: { $in: missionLocaleIds } }, { projection: { nom: 1, "adresse.commune": 1 } })
          .toArray()
      : [],
  ]);
  const toStructure = (
    id: ObjectId,
    nom: string | null | undefined,
    commune: string | null | undefined
  ): ICollaborationDossierStructure => ({
    id: id.toString(),
    nom: nom?.trim() || null,
    commune: commune ?? null,
  });
  return {
    cfa: new Map(
      organismes.map((organisme): [string, ICollaborationDossierStructure] => [
        organisme._id.toString(),
        toStructure(
          organisme._id,
          organisme.enseigne || organisme.raison_sociale || organisme.nom,
          organisme.adresse?.commune
        ),
      ])
    ),
    ml: new Map(
      missionsLocales.map((ml): [string, ICollaborationDossierStructure] => {
        const { nom, adresse } = ml as { nom?: string; adresse?: { commune?: string } };
        return [ml._id.toString(), toStructure(ml._id, nom, adresse?.commune)];
      })
    ),
  };
};

const sortByNom = (structures: Iterable<ICollaborationDossierStructure>) =>
  [...structures].sort((a, b) => (a.nom ?? "").localeCompare(b.nom ?? "", "fr", { sensitivity: "base" }));

/**
 * Dossiers de collaboration envoyés depuis le 01/01/2026 par les CFA du territoire, avec le délai de première
 * action de la ML (jusqu'à aujourd'hui tant qu'aucun conseiller n'a agi). Seuls le prénom et le nom du jeune sortent.
 */
export async function listCollaborationDossiers(
  territoire: CollaborationDossiersTerritoire,
  filters: CollaborationDossiersFilters,
  pagination?: { page: number; limit: number }
): Promise<ICollaborationDossiersResponse> {
  const organismeIds = await findTerritoireOrganismeIds(territoire);
  const baseMatch = buildBaseMatch(organismeIds, territoire.missionLocaleId);
  const missionLocaleIds = (await missionLocaleEffectifsDb().distinct("mission_locale_id", baseMatch)) as ObjectId[];
  const territoireOrganismeIds = (await missionLocaleEffectifsDb().distinct(
    "effectif_snapshot.organisme_id",
    baseMatch
  )) as ObjectId[];

  const mlUserIds = missionLocaleIds.length
    ? (
        await usersMigrationDb()
          .find({ organisation_id: { $in: missionLocaleIds } }, { projection: { _id: 1 } })
          .toArray()
      ).map((user) => user._id)
    : [];

  const conditions: Document[] = [baseMatch];
  if (filters.cfaIds?.length) conditions.push({ "effectif_snapshot.organisme_id": { $in: filters.cfaIds } });
  if (filters.mlIds?.length) conditions.push({ mission_locale_id: { $in: filters.mlIds } });
  if (filters.motifs?.length) conditions.push({ "organisme_data.motif": { $in: filters.motifs } });
  if (filters.statuts?.length) conditions.push({ $or: filters.statuts.map((statut) => STATUT_MATCH[statut]) });
  if (filters.resultats?.length) {
    conditions.push({ situation: { $in: filters.resultats.flatMap((resultat) => RESULTAT_SITUATIONS[resultat]) } });
  }
  if (filters.search && filters.search.trim().length >= 2) {
    const [cfaMatches, mlMatches] = await Promise.all([
      organismesDb()
        .find(
          {
            _id: { $in: territoireOrganismeIds },
            ...buildWordsRegexMatch(filters.search, ["enseigne", "raison_sociale", "nom"]),
          },
          { projection: { _id: 1 } }
        )
        .toArray(),
      organisationsDb()
        .find(
          { _id: { $in: missionLocaleIds }, ...buildWordsRegexMatch(filters.search, ["nom"]) },
          { projection: { _id: 1 } }
        )
        .toArray(),
    ]);
    conditions.push({
      $or: [
        {
          $and: buildNameSearchConditions(
            filters.search,
            "effectif_snapshot.apprenant.nom",
            "effectif_snapshot.apprenant.prenom"
          ),
        },
        { "effectif_snapshot.organisme_id": { $in: cfaMatches.map((organisme) => organisme._id) } },
        { mission_locale_id: { $in: mlMatches.map((ml) => ml._id) } },
      ],
    });
  }

  const delaiStages = buildDelaiStages(mlUserIds);
  // Sans filtre de délai, le délai n'est calculé que pour les lignes affichées (après pagination)
  const delaiAvantPagination = !!filters.delais?.length || !pagination;
  const filteringStages: Document[] = [
    { $match: { $and: conditions } },
    ...buildPeriodeMatch(filters),
    ...addSituationDossierField(),
    ...(filters.situations?.length ? [{ $match: { situation_dossier: { $in: filters.situations } } }] : []),
    ...(delaiAvantPagination ? delaiStages : []),
    ...(filters.delais?.length ? [{ $match: { $or: filters.delais.map((delai) => DELAI_MATCH[delai]) } }] : []),
  ];
  const rowStages: Document[] = [
    ...(delaiAvantPagination ? [] : delaiStages),
    {
      $project: {
        _id: 1,
        effectif_id: 1,
        mission_locale_id: 1,
        organisme_id: "$effectif_snapshot.organisme_id",
        prenom: "$effectif_snapshot.apprenant.prenom",
        nom: "$effectif_snapshot.apprenant.nom",
        situation: 1,
        situation_dossier: 1,
        motifs: { $ifNull: ["$organisme_data.motif", []] },
        date_envoi: "$organisme_data.acc_conjoint_at",
        delai_jours: 1,
        traite_par_ml: 1,
      },
    },
  ];
  const sortStage = { $sort: { "organisme_data.acc_conjoint_at": -1, _id: 1 } };

  // L'export sort toutes les lignes : pas de $facet, dont le document unique est plafonné à 16 Mo.
  const result = pagination
    ? (
        await missionLocaleEffectifsDb()
          .aggregate<{ total: { count: number }[]; data: Document[] }>([
            ...filteringStages,
            {
              $facet: {
                total: [{ $count: "count" }],
                data: [
                  sortStage,
                  { $skip: (pagination.page - 1) * pagination.limit },
                  { $limit: pagination.limit },
                  ...rowStages,
                ],
              },
            },
          ])
          .toArray()
      )[0]
    : await missionLocaleEffectifsDb()
        .aggregate<Document>([...filteringStages, sortStage, ...rowStages], { allowDiskUse: true })
        .toArray()
        .then((data) => ({ total: [{ count: data.length }], data }));

  const rows = result?.data ?? [];
  const structures = await fetchStructures(territoireOrganismeIds, missionLocaleIds);
  const resultatOf = (situation: string | null) =>
    situation
      ? ((Object.entries(RESULTAT_SITUATIONS).find(([, situations]) =>
          situations.includes(situation as SITUATION_ENUM)
        )?.[0] as CollabDossierResultat | undefined) ?? null)
      : null;
  const unknown = (id: ObjectId | undefined) => ({ id: id?.toString() ?? "", nom: null, commune: null });

  const data: ICollaborationDossier[] = rows.map((row) => ({
    id: row._id.toString(),
    effectif_id: row.effectif_id.toString(),
    jeune: { prenom: row.prenom ?? null, nom: row.nom ?? null },
    mission_locale: structures.ml.get(row.mission_locale_id?.toString()) ?? unknown(row.mission_locale_id),
    cfa: structures.cfa.get(row.organisme_id?.toString()) ?? unknown(row.organisme_id),
    statut:
      row.situation === null || row.situation === undefined
        ? "a_traiter"
        : row.situation === SITUATION_ENUM.CONTACTE_SANS_RETOUR
          ? "a_recontacter"
          : "traite",
    situation: row.situation_dossier ?? null,
    motifs: row.motifs,
    resultat: resultatOf(row.situation ?? null),
    date_envoi: row.date_envoi,
    delai_jours: row.delai_jours,
    traite_par_ml: row.traite_par_ml,
  }));

  const total = result?.total?.[0]?.count ?? 0;
  const limit = pagination?.limit ?? total;
  return {
    total,
    pagination: { page: pagination?.page ?? 1, limit, total_pages: limit ? Math.ceil(total / limit) : 0 },
    data,
    filtres: { cfa: sortByNom(structures.cfa.values()), ml: sortByNom(structures.ml.values()) },
  };
}
