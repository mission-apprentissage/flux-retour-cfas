import { ObjectId } from "bson";
import { compact, get } from "lodash-es";
import {
  STATUT_APPRENANT,
  getAnneeScolaireFromDate,
  getAnneesScolaireListFromDate,
  getSIFADate,
  requiredApprenantAdresseFieldsSifa,
  requiredFieldsSifa,
} from "shared";

import { effectifsDECADb, effectifsDb, organismesDb } from "@/common/model/collections";

const FIELD_MAP: Record<string, string> = {
  nom: "apprenant.nom",
  prenom: "apprenant.prenom",
  formation: "formation.libelle_long",
  statut_courant: "_computed.statut.en_cours",
  annee_scolaire: "annee_scolaire",
};

const computeSort = (sortField: string | null, sortOrder: string | null) => {
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

export async function getOrganismeEffectifs(
  organismeId: ObjectId,
  sifa: boolean = false,
  only_sifa_missing_fields: boolean = false,
  options: {
    pageIndex: number;
    pageSize: number;
    search: string;
    filters: any;
    sortField: string | null;
    sortOrder: string | null;
  } = { pageIndex: 0, pageSize: 10, search: "", filters: {}, sortField: null, sortOrder: null }
) {
  const organisme = await organismesDb().findOne({ _id: organismeId });
  const { pageIndex, pageSize, search, filters, sortField, sortOrder } = options;
  const isDeca = !organisme?.is_transmission_target;
  const db = isDeca ? effectifsDECADb() : effectifsDb();

  const parsedFilters = Object.entries(filters).reduce(
    (acc, [key, value]) => {
      if (typeof value === "string" && value.startsWith("[") && value.endsWith("]")) {
        try {
          const parsed = JSON.parse(value);
          acc[key] = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          acc[key] = [value];
        }
      } else if (Array.isArray(value)) {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, string[]>
  );

  const matchOrgaAndAnneScolaire = (sifa: boolean) => ({
    organisme_id: organismeId,
    ...(sifa && {
      annee_scolaire: {
        $in: getAnneesScolaireListFromDate(sifa ? getSIFADate(new Date()) : new Date()),
      },
    }),
  });

  const addSifaFilter = (sifa: boolean) => {
    return sifa
      ? [
          {
            $addFields: {
              dernierStatut: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$_computed.statut.parcours",
                      as: "statut",
                      cond: {
                        $lte: ["$$statut.date", currentDate],
                      },
                    },
                  },
                  -1,
                ],
              },
            },
          },
          {
            $match: {
              "dernierStatut.valeur": STATUT_APPRENANT.APPRENTI,
            },
          },
        ]
      : [];
  };

  const matchConditions = {
    ...Object.keys(parsedFilters).reduce((acc, key) => {
      if (parsedFilters[key]?.length > 0) {
        const fieldKey =
          key === "formation_libelle_long"
            ? "formation.libelle_long"
            : key === "statut_courant"
              ? "_computed.statut.en_cours"
              : key;
        acc[fieldKey] = { $in: parsedFilters[key] };
      }
      return acc;
    }, {}),
    ...(typeof search === "string" &&
      search.trim() && {
        $or: [
          { "apprenant.nom": { $regex: search.trim(), $options: "i" } },
          { "apprenant.prenom": { $regex: search.trim(), $options: "i" } },
        ],
      }),
  };

  const sortConditions = computeSort(sortField, sortOrder);

  const currentDate = sifa ? getSIFADate(new Date()) : new Date();
  const pipeline = [
    {
      $match: {
        ...matchOrgaAndAnneScolaire(sifa),
      },
    },
    ...addSifaFilter(sifa),
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
              annee_scolaire: 1,
              source: 1,
              statut_courant: 1,
              formation_libelle_long: 1,
            },
          },
        ],
        results: [
          { $match: matchConditions },
          { $sort: sortConditions },
          { $skip: pageIndex * pageSize },
          { $limit: pageSize },
        ],
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

  const [data] = await db.aggregate(pipeline).toArray();

  const effectifs = data?.results
    .map((effectif) => ({
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
      ...(sifa
        ? {
            requiredSifa: compact(
              [
                ...(!effectif.apprenant.adresse?.complete
                  ? [...requiredFieldsSifa, ...requiredApprenantAdresseFieldsSifa]
                  : requiredFieldsSifa),
              ].map((fieldName) =>
                !get(effectif, fieldName) || get(effectif, fieldName) === "" ? fieldName : undefined
              )
            ),
          }
        : {}),
    }))
    .filter((effectif) => (sifa && only_sifa_missing_fields ? effectif.requiredSifa.length > 0 : true));

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

export async function getAllOrganismeEffectifsIds(organismeId: ObjectId, sifa = false) {
  const organisme = await organismesDb().findOne({ _id: organismeId });
  const isDeca = !organisme?.is_transmission_target;
  const db = isDeca ? effectifsDECADb() : effectifsDb();

  const pipeline = [
    {
      $match: {
        organisme_id: organismeId,
        ...(sifa && {
          annee_scolaire: {
            $in: getAnneesScolaireListFromDate(sifa ? getSIFADate(new Date()) : new Date()),
          },
          "_computed.statut.parcours": {
            $elemMatch: {
              valeur: STATUT_APPRENANT.APPRENTI,
              date: {
                $eq: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$_computed.statut.parcours",
                        as: "parcours",
                        cond: { $eq: ["$$parcours.valeur", STATUT_APPRENANT.APPRENTI] },
                      },
                    },
                    -1,
                  ],
                },
              },
            },
          },
        }),
      },
    },
    {
      $project: {
        id: { $toString: "$_id" },
      },
    },
  ];

  const effectifs = await db.aggregate(pipeline).toArray();

  return {
    fromDECA: isDeca,
    organismesEffectifs: effectifs,
  };
}

export async function updateOrganismeEffectifs(
  organismeId: ObjectId,
  sifa = false,
  update: {
    "apprenant.type_cfa"?: string | undefined;
  }
) {
  if (!update["apprenant.type_cfa"]) return;
  const { fromDECA, organismesEffectifs } = await getAllOrganismeEffectifsIds(organismeId, sifa);

  !fromDECA &&
    (await effectifsDb().updateMany(
      {
        _id: {
          $in: organismesEffectifs.map((effectif) => new ObjectId(effectif.id)),
        },
      },
      {
        ...(update["apprenant.type_cfa"] ? { $set: { "apprenant.type_cfa": update["apprenant.type_cfa"] } } : {}),
      }
    ));
}
