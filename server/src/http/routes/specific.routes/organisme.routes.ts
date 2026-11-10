import { ObjectId } from "bson";
import { getAnneeScolaireFromDate, IEffectif } from "shared";
import { zGetEffectifsForOrganismeApi } from "shared/models/routes/organismes/effectifs/effectifs.api";
import { WithPagination } from "shared/models/routes/pagination";

import { effectifsDb, organismesDb } from "@/common/model/collections";
import { anneeScolaireDedupExpr, dateMetierExpr, dedupNomExpr } from "@/common/utils/mongoUtils";

const FIELD_MAP: Record<string, string> = {
  nom: "apprenant.nom",
  prenom: "apprenant.prenom",
  formation_libelle_long: "formation.libelle_long",
  statut_courant: "_computed.statut.en_cours",
  annee_scolaire: "annee_scolaire",
};

const computeSort = (sortField?: string | null, sortOrder?: string | null) => {
  if (!sortField || !sortOrder) {
    return { annee_scolaire: -1, "apprenant.nom": 1 };
  }

  switch (sortField) {
    case FIELD_MAP.annee_scolaire:
      return { annee_scolaire: sortOrder === "desc" ? -1 : 1, "apprenant.nom": 1 };
    default:
      return { [FIELD_MAP[sortField] || sortField]: sortOrder === "desc" ? -1 : 1 };
  }
};

const computeFormation = (formation_libelle_long?: string[] | null) => {
  return formation_libelle_long?.length ? { "formation.libelle_long": { $in: formation_libelle_long } } : {};
};

const computeStatut = (statut?: string[] | null) => {
  return statut?.length ? { "_computed.statut.en_cours": { $in: statut } } : {};
};

const computeAnneeScolaire = (annee_scolaire?: string[] | null) => {
  return annee_scolaire?.length ? { annee_scolaire: { $in: annee_scolaire } } : {};
};

const computeSource = (source?: string[] | null) => {
  return source?.length ? { source: { $in: source } } : {};
};

const computeSearch = (search?: string | null) => {
  return search && search.trim()
    ? {
        $or: [
          { "apprenant.nom": { $regex: search.trim(), $options: "i" } },
          { "apprenant.prenom": { $regex: search.trim(), $options: "i" } },
        ],
      }
    : {};
};

function effectifsEtContratsDecaSansDoublon(organismeId: ObjectId) {
  return [
    { $match: { organisme_id: organismeId } },
    { $addFields: { _priorite: 0 } },
    {
      $unionWith: {
        coll: "effectifsDECA",
        pipeline: [{ $match: { organisme_id: organismeId } }, { $addFields: { _priorite: 1 } }],
      },
    },
    {
      $addFields: {
        _nom: dedupNomExpr("$apprenant.nom"),
        _prenom: dedupNomExpr("$apprenant.prenom"),
        _ddn: dateMetierExpr("$apprenant.date_de_naissance"),
        _annee: anneeScolaireDedupExpr,
      },
    },
    { $sort: { _priorite: 1, updated_at: -1, _id: 1 } },
    {
      $group: {
        _id: {
          $cond: [
            { $and: [{ $ne: ["$_nom", ""] }, { $ne: ["$_ddn", null] }] },
            { nom: "$_nom", prenom: "$_prenom", ddn: "$_ddn", annee_scolaire: "$_annee" },
            "$_id",
          ],
        },
        doc: { $first: "$$ROOT" },
      },
    },
    { $replaceRoot: { newRoot: "$doc" } },
    { $project: { _priorite: 0, _nom: 0, _prenom: 0, _ddn: 0, _annee: 0 } },
  ];
}

export async function getOrganismeEffectifs(
  organismeId: ObjectId,
  options: WithPagination<typeof zGetEffectifsForOrganismeApi>
) {
  const organisme = await organismesDb().findOne({ _id: organismeId });
  const filterNotNull = (data: string) => ({
    $filter: { input: `$${data}`, as: "data", cond: { $ne: ["$$data", null] } },
  });

  const {
    search,
    formation_libelle_long,
    statut_courant,
    annee_scolaire,
    source,
    limit = 10,
    page = 0,
    sort,
    order,
  } = options;

  const isDeca = !organisme?.is_transmission_target;

  const formationConditions = computeFormation(formation_libelle_long);
  const statutConditions = computeStatut(statut_courant);
  const anneeScolaireConditions = computeAnneeScolaire(annee_scolaire);
  const sourceConditions = computeSource(source);
  const searchConditions = computeSearch(search);

  const matchConditions = {
    organisme_id: organismeId,
    ...formationConditions,
    ...statutConditions,
    ...anneeScolaireConditions,
    ...sourceConditions,
    ...searchConditions,
  };
  const sortConditions = computeSort(sort, order);

  const pipeline = [
    ...(isDeca ? effectifsEtContratsDecaSansDoublon(organismeId) : [{ $match: { organisme_id: organismeId } }]),
    {
      $facet: {
        allFilters: [
          {
            $group: {
              _id: null,
              annee_scolaire: { $addToSet: "$annee_scolaire" },
              source: { $addToSet: "$source" },
              statut_courant: { $addToSet: "$_computed.statut.en_cours" },
              formation_libelle_long: { $addToSet: "$formation.libelle_long" },
            },
          },
          {
            $project: {
              _id: 0,
              annee_scolaire: filterNotNull("annee_scolaire"),
              source: filterNotNull("source"),
              statut_courant: filterNotNull("statut_courant"),
              formation_libelle_long: filterNotNull("formation_libelle_long"),
            },
          },
        ],
        results: [{ $match: matchConditions }, { $sort: sortConditions }, { $skip: page * limit }, { $limit: limit }],
        totalCount: [
          { $match: matchConditions },
          {
            $count: "count",
          },
        ],
      },
    },
    {
      $project: {
        filters: {
          annee_scolaire: { $arrayElemAt: ["$allFilters.annee_scolaire", 0] },
          source: { $arrayElemAt: ["$allFilters.source", 0] },
          statut_courant: { $arrayElemAt: ["$allFilters.statut_courant", 0] },
          formation_libelle_long: { $arrayElemAt: ["$allFilters.formation_libelle_long", 0] },
        },
        results: "$results",
        total: { $arrayElemAt: ["$totalCount.count", 0] },
      },
    },
  ];
  const [data] = await effectifsDb().aggregate(pipeline).toArray();

  const effectifs = data?.results.map((effectif: IEffectif) => ({
    id: effectif._id.toString(),
    id_erp_apprenant: effectif.id_erp_apprenant,
    organisme_id: organismeId,
    annee_scolaire: effectif.annee_scolaire,
    source: effectif.source,
    validation_errors: effectif.validation_errors,
    formation: effectif.formation,
    nom: effectif.apprenant.nom,
    prenom: effectif.apprenant.prenom,
    date_de_naissance: effectif.apprenant.date_de_naissance,
    historique_statut: effectif.apprenant.historique_statut,
    statut: effectif._computed?.statut,
    transmitted_at: effectif.transmitted_at,
  }));

  return {
    fromDECA: isDeca,
    total: data?.total || 0,
    filters: {
      ...data?.filters,
      annee_scolaire: Array.from(
        new Set([...(data?.filters?.annee_scolaire || []), getAnneeScolaireFromDate(new Date())])
      ),
    },
    organismesEffectifs: effectifs || [],
  };
}

export async function updateOrganismeEffectifs(
  organismeId: ObjectId,
  update: {
    "apprenant.type_cfa"?: string | undefined;
  }
) {
  if (!update["apprenant.type_cfa"]) return;
  await effectifsDb().updateMany(
    { organisme_id: organismeId },
    { $set: { "apprenant.type_cfa": update["apprenant.type_cfa"] } }
  );
}
