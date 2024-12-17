import { ObjectId } from "bson";
import {
  getAnneesScolaireListFromDate,
  getSIFADate,
  requiredApprenantAdresseFieldsSifa,
  requiredFieldsSifa,
} from "shared";

// import { isEligibleSIFA } from "@/common/actions/sifa.actions/sifa.actions";
import { effectifsDb, organismesDb } from "@/common/model/collections";

export async function getOrganismeEffectifs(
  organismeId,
  sifa = false,
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
  const db = await effectifsDb();

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

  const matchConditions = {
    organisme_id: organismeId,
    ...(sifa && {
      annee_scolaire: {
        $in: getAnneesScolaireListFromDate(sifa ? getSIFADate(new Date()) : new Date()),
      },
    }),
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

  const fieldMap: Record<string, string> = {
    nom: "apprenant.nom",
    prenom: "apprenant.prenom",
    formation: "formation.libelle_long",
    statut_courant: "_computed.statut.en_cours",
    annee_scolaire: "annee_scolaire",
  };

  const sortConditions =
    sortField && sortOrder
      ? { [fieldMap[sortField] || sortField]: sortOrder === "desc" ? -1 : 1 }
      : { "formation.annee_scolaire": -1 };

  const pipeline = [
    {
      $facet: {
        allFilters: [
          {
            $match: {
              organisme_id: organismeId,
              ...(sifa && {
                annee_scolaire: {
                  $in: getAnneesScolaireListFromDate(sifa ? getSIFADate(new Date()) : new Date()),
                },
              }),
            },
          },
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
          {
            $project: {
              id: { $toString: "$_id" },
              id_erp_apprenant: 1,
              organisme_id: 1,
              annee_scolaire: 1,
              source: 1,
              validation_errors: 1,
              formation: 1,
              nom: "$apprenant.nom",
              prenom: "$apprenant.prenom",
              date_de_naissance: "$apprenant.date_de_naissance",
              historique_statut: "$apprenant.historique_statut",
              statut: "$_computed.statut",
              ...(sifa
                ? {
                    requiredSifa: {
                      $filter: {
                        input: {
                          $setUnion: [
                            requiredFieldsSifa,
                            {
                              $cond: [{ $not: "$apprenant.adresse.complete" }, requiredApprenantAdresseFieldsSifa, []],
                            },
                          ],
                        },
                        as: "fieldName",
                        cond: { $or: [{ $not: { $ifNull: ["$$fieldName", false] } }] },
                      },
                    },
                  }
                : {}),
            },
          },
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

  return {
    fromDECA: !organisme?.is_transmission_target,
    total: data?.total || 0,
    filters: data?.filters || {},
    organismesEffectifs: data?.results || [],
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
  const { fromDECA, organismesEffectifs } = await getOrganismeEffectifs(organismeId, sifa);

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
