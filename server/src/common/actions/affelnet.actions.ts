import { voeuxAffelnetDb } from "../model/collections";

const computeFilter = (departement: Array<string> | null, region: Array<string> | null) => {
  return {
    ...(departement ? { "_computed.organisme.departement": { $in: departement } } : {}),
    ...(region ? { "_computed.organisme.region": { $in: region } } : {}),
  };
};

export const getAffelnetCountVoeuxNational = async (
  departement: Array<string> | null,
  regions: Array<string> | null
) => {
  const counts = await voeuxAffelnetDb()
    .aggregate([
      {
        $match: {
          ...computeFilter(departement, regions),
        },
      },
      {
        $lookup: {
          from: "effectifs",
          let: {
            affelnet_nom: {
              $toLower: {
                $trim: {
                  input: "$raw.nom",
                },
              },
            },
            affelnet_prenom: {
              $toLower: {
                $trim: {
                  input: "$raw.prenom_1",
                },
              },
            },
            affelnet_uai: "$raw.code_uai_etab_accueil",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $in: ["$annee_scolaire", ["2024-2025", "2024-2024", "2025-2025"]],
                    },
                    {
                      $eq: [
                        {
                          $toLower: {
                            $trim: {
                              input: "$apprenant.nom",
                            },
                          },
                        },
                        "$$affelnet_nom",
                      ],
                    },
                    {
                      $eq: [
                        {
                          $toLower: {
                            $trim: {
                              input: "$apprenant.prenom",
                            },
                          },
                        },
                        "$$affelnet_prenom",
                      ],
                    },
                    {
                      $eq: ["$_computed.organisme.uai", "$$affelnet_uai"],
                    },
                  ],
                },
              },
            },
          ],
          as: "tdb_effectifs",
        },
      },
      {
        $lookup: {
          from: "effectifs_contrats",
          localField: "tdb_effectifs._id",
          foreignField: "effectif_id",
          as: "tdb_contrats",
        },
      },
      {
        $facet: {
          voeuxFormules: [
            {
              $count: "total",
            },
          ],
          apprenantVoeuxFormules: [
            {
              $group: {
                _id: "$raw.ine",
                count: { $sum: 1 },
              },
            },
            {
              $count: "total",
            },
          ],
          apprenantsNonContretise: [
            {
              $group: {
                _id: "$raw.ine",
                deleted_list: {
                  $push: "$deleted_at",
                },
                count: { $sum: 1 },
              },
            },
            {
              $match: {
                $expr: { $eq: [{ $size: "$deleted_list" }, "$count"] },
              },
            },
            {
              $count: "total",
            },
          ],
          inscritEnCfa: [
            {
              $match: {
                $expr: {
                  $or: [
                    {
                      $gt: [{ $size: "$tdb_effectifs" }, 0],
                    },
                    {
                      $gt: [{ $size: "$tdb_contrats" }, 0],
                    },
                  ],
                },
              },
            },
            {
              $count: "count",
            },
          ],
          voeuxNonConcretise: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: [{ $size: "$tdb_effectifs" }, 0],
                    },
                    {
                      $eq: [{ $size: "$tdb_contrats" }, 0],
                    },
                  ],
                },
              },
            },
            {
              $count: "count",
            },
          ],
        },
      },
      {
        $project: {
          voeuxFormules: {
            $ifNull: [{ $arrayElemAt: ["$voeuxFormules.total", 0] }, 0],
          },
          apprenantVoeuxFormules: {
            $ifNull: [{ $arrayElemAt: ["$apprenantVoeuxFormules.total", 0] }, 0],
          },
          apprenantsNonContretise: {
            $ifNull: [{ $arrayElemAt: ["$apprenantsNonContretise.total", 0] }, 0],
          },
          inscritEnCfa: {
            $ifNull: [{ $arrayElemAt: ["$inscritEnCfa.count", 0] }, 0],
          },
          voeuxNonConcretise: {
            $ifNull: [{ $arrayElemAt: ["$voeuxNonConcretise.count", 0] }, 0],
          },
        },
      },
    ])
    .toArray();

  const result = counts[0];

  return {
    voeuxFormules: result.voeuxFormules,
    apprenantVoeuxFormules: result.apprenantVoeuxFormules,
    apprenantsNonContretise: result.apprenantsNonContretise,
    inscritEnCfa: result.inscritEnCfa,
    voeuxNonConcretise: result.voeuxNonConcretise,
  };
};

export const getAffelnetVoeuxNonConcretise = (departement: Array<string> | null, regions: Array<string> | null) =>
  voeuxAffelnetDb()
    .aggregate([
      {
        $match: {
          ...computeFilter(departement, regions),
        },
      },
      {
        $group: {
          _id: "$raw.ine",
          deleted_list: {
            $push: "$deleted_at",
          },
          formations: {
            $push: { $concat: ["$_computed.formation.libelle", " - ", "$_computed.formation.rncp"] },
          },
          count: { $sum: 1 },
          apprenant: { $first: "$$ROOT" },
        },
      },
      {
        $match: {
          $expr: { $eq: [{ $size: "$deleted_list" }, "$count"] },
        },
      },
      {
        $project: {
          _id: "$_id",
          nom: "$apprenant.raw.nom",
          prenom_1: "$apprenant.raw.prenom_1",
          prenom_2: "$apprenant.raw.prenom_2",
          prenom_3: "$apprenant.raw.prenom_3",
          mail_responsable_1: "$apprenant.raw.mail_responsable_1",
          mail_responsable_2: "$apprenant.raw.mail_responsable_2",
          telephone_responsable_1: "$apprenant.raw.telephone_responsable_1",
          telephone_responsable_2: "$apprenant.raw.telephone_responsable_2",
          ville_etab_origine: "$apprenant.raw.ville_etab_origine",
          type_etab_origine: "$apprenant.raw.type_etab_origine",
          libelle_etab_origine: "$apprenant.raw.libelle_etab_origine",
          nombre_voeux: "$count",
          formations_demandees: "$formations",
        },
      },
      {
        $sort: {
          nom: 1,
          prenom_1: 1,
        },
      },
    ])
    .toArray();
