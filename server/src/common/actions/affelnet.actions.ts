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
          "_computed.organisme.region": {
            $in: regions,
          },
        },
      },
      {
        $sort: {
          "_computed.organisme.region": 1,
          "raw.ine": 1,
        },
      },
      {
        $group: {
          _id: "$raw.ine",
          voeux_count: {
            $sum: 1,
          },
          affelnet_nom: {
            $first: {
              $toLower: {
                $trim: {
                  input: "$raw.nom",
                },
              },
            },
          },
          affelnet_prenom: {
            $first: {
              $toLower: {
                $trim: {
                  input: "$raw.prenom_1",
                },
              },
            },
          },
          affelnet_uai: {
            $first: "$raw.code_uai_etab_accueil",
          },
        },
      },
      {
        $lookup: {
          from: "effectifs",
          let: {
            affelnet_nom: "$affelnet_nom",
            affelnet_prenom: "$affelnet_prenom",
            affelnet_uai: "$affelnet_uai",
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
        $addFields: {
          effectifs_count: {
            $size: "$tdb_effectifs",
          },
          contrats_count: {
            $sum: {
              $map: {
                input: "$tdb_effectifs.contrats",
                as: "contrat",
                in: {
                  $cond: {
                    if: {
                      $ne: ["$$contrat.date_debut", null],
                    },
                    then: 1,
                    else: 0,
                  },
                },
              },
            },
          },
          status: {
            $cond: {
              if: {
                $or: [
                  {
                    $gt: ["$effectifs_count", 0],
                  },
                  {
                    $gt: ["$contrats_count", 0],
                  },
                ],
              },
              then: "inscrit",
              else: "non inscrit",
            },
          },
        },
      },
      {
        $project: {
          status: 1,
          voeux_count: 1,
        },
      },
      // {
      //   $group: {
      //     _id: null,
      //     inscrits_count: {
      //       $sum: {
      //         $cond: [
      //           {
      //             $eq: ["$status", "inscrit"]
      //           },
      //           1,
      //           0
      //         ]
      //       }
      //     },
      //     non_inscrits_count: {
      //       $sum: {
      //         $cond: [
      //           {
      //             $eq: ["$status", "non inscrit"]
      //           },
      //           1,
      //           0
      //         ]
      //       }
      //     }
      //   }
      // }
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
