import { ObjectId } from "mongodb";

import {
  EffectifsFilters,
  FullEffectifsFilters,
  OrganismesFilters,
  buildMongoFilters,
  effectifsFiltersConfigurations,
  fullEffectifsFiltersConfigurations,
  organismesFiltersConfigurations,
} from "@/common/actions/helpers/filters";
import {
  findOrganismesFormateursIdsOfOrganisme,
  getEffectifsAnonymesRestriction,
  getEffectifsNominatifsRestriction,
  getOrganismeIndicateursEffectifsRestriction,
  getIndicateursEffectifsRestriction,
  getIndicateursOrganismesRestriction,
} from "@/common/actions/helpers/permissions";
import { CODES_STATUT_APPRENANT } from "@/common/constants/dossierApprenant";
import { effectifsDb, organismesDb } from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";

import {
  IndicateursEffectifs,
  IndicateursEffectifsAvecDepartement,
  IndicateursEffectifsAvecOrganisme,
  IndicateursOrganismes,
  IndicateursOrganismesAvecDepartement,
} from "./indicateurs";

export async function getIndicateursEffectifsParDepartement(
  ctx: AuthContext,
  filters: EffectifsFilters
): Promise<IndicateursEffectifsAvecDepartement[]> {
  const indicateurs = (await effectifsDb()
    .aggregate([
      {
        $match: {
          $and: [
            await getIndicateursEffectifsRestriction(ctx),
            ...buildMongoFilters(filters, effectifsFiltersConfigurations),
          ],
          "_computed.organisme.fiable": true,
        },
      },
      {
        $project: {
          departement: "$_computed.organisme.departement",
          "apprenant.historique_statut": {
            $sortArray: {
              input: {
                $filter: {
                  input: "$apprenant.historique_statut",
                  as: "statut",
                  cond: {
                    $lte: ["$$statut.date_statut", filters.date],
                  },
                },
              },
              sortBy: { date_statut: 1 },
            },
          },
        },
      },
      {
        $match: { "apprenant.historique_statut": { $not: { $size: 0 } } },
      },
      {
        $addFields: {
          statut_apprenant_at_date: {
            $last: "$apprenant.historique_statut",
          },
        },
      },
      {
        $facet: {
          apprentis: [
            {
              $match: {
                "statut_apprenant_at_date.valeur_statut": CODES_STATUT_APPRENANT.apprenti,
              },
            },
            {
              $group: {
                _id: "$departement",
                apprentis: {
                  $sum: 1,
                },
              },
            },
          ],
          abandons: [
            {
              $match: {
                "statut_apprenant_at_date.valeur_statut": CODES_STATUT_APPRENANT.abandon,
              },
            },
            {
              $group: {
                _id: "$departement",
                abandons: {
                  $sum: 1,
                },
              },
            },
          ],
          inscritsSansContrat: [
            {
              $match: {
                "statut_apprenant_at_date.valeur_statut": CODES_STATUT_APPRENANT.inscrit,
                "apprenant.historique_statut.valeur_statut": { $ne: CODES_STATUT_APPRENANT.apprenti },
              },
            },
            {
              $group: {
                _id: "$departement",
                inscritsSansContrat: {
                  $sum: 1,
                },
              },
            },
          ],
          rupturants: [
            { $match: { "statut_apprenant_at_date.valeur_statut": CODES_STATUT_APPRENANT.inscrit } },
            // set previousStatutAtDate to be the element in apprenant.historique_statut juste before statut_apprenant_at_date
            {
              $addFields: {
                previousStatutAtDate: {
                  $arrayElemAt: ["$apprenant.historique_statut", -2],
                },
              },
            },
            { $match: { "previousStatutAtDate.valeur_statut": CODES_STATUT_APPRENANT.apprenti } },
            {
              $group: {
                _id: "$departement",
                rupturants: {
                  $sum: 1,
                },
              },
            },
          ],
        },
      },
      {
        $project: {
          items: {
            $concatArrays: ["$apprentis", "$abandons", "$inscritsSansContrat", "$rupturants"],
          },
        },
      },
      {
        $unwind: "$items",
      },
      {
        $group: {
          _id: "$items._id",
          merge: {
            $mergeObjects: "$items",
          },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              {
                apprenants: 0,
                apprentis: 0,
                inscritsSansContrat: 0,
                abandons: 0,
                rupturants: 0,
              },
              "$merge",
            ],
          },
        },
      },
      {
        $project: {
          _id: 0,
          departement: "$_id",
          apprenants: {
            $sum: ["$apprentis", "$inscritsSansContrat", "$rupturants"],
          },
          apprentis: 1,
          inscritsSansContrat: 1,
          abandons: 1,
          rupturants: 1,
        },
      },
    ])
    .toArray()) as IndicateursEffectifsAvecDepartement[];
  return indicateurs;
}

export async function getIndicateursOrganismesParDepartement(
  ctx: AuthContext,
  filters: OrganismesFilters
): Promise<IndicateursOrganismesAvecDepartement[]> {
  const indicateurs = (await organismesDb()
    .aggregate([
      {
        $match: {
          $and: [
            await getIndicateursOrganismesRestriction(ctx),
            ...buildMongoFilters(filters, organismesFiltersConfigurations),
          ],
          fiabilisation_statut: "FIABLE",
          ferme: false,
        },
      },
      {
        $project: {
          departement: "$adresse.departement",
          transmet: { $cond: [{ $ne: [{ $ifNull: ["$last_transmission_date", ""] }, ""] }, 1, 0] },
          ne_transmet_pas: { $cond: [{ $ne: [{ $ifNull: ["$last_transmission_date", ""] }, ""] }, 0, 1] },
        },
      },
      {
        $group: {
          _id: { departement: "$departement" },
          total_transmet: { $sum: "$transmet" },
          total_ne_transmet_pas: { $sum: "$ne_transmet_pas" },
        },
      },
      {
        $project: {
          _id: 0,
          departement: "$_id.departement",
          tauxCouverture: {
            $multiply: [100, { $divide: ["$total_transmet", { $add: ["$total_transmet", "$total_ne_transmet_pas"] }] }],
          },
          totalOrganismes: {
            $add: ["$total_transmet", "$total_ne_transmet_pas"],
          },
          organismesTransmetteurs: "$total_transmet",
          organismesNonTransmetteurs: "$total_ne_transmet_pas",
        },
      },
    ])
    .toArray()) as IndicateursOrganismesAvecDepartement[];
  return indicateurs;
}

export async function getIndicateursEffectifsParOrganisme(
  ctx: AuthContext,
  filters: FullEffectifsFilters,
  organismeId?: ObjectId
): Promise<IndicateursEffectifsAvecOrganisme[]> {
  const indicateurs = (await effectifsDb()
    .aggregate([
      {
        $match: {
          $and: [
            await getOrganismeRestriction(organismeId),
            await getEffectifsAnonymesRestriction(ctx),
            ...buildMongoFilters(filters, fullEffectifsFiltersConfigurations),
          ],
          "_computed.organisme.fiable": true,
        },
      },
      {
        $project: {
          organisme_id: 1,
          "apprenant.historique_statut": {
            $sortArray: {
              input: {
                $filter: {
                  input: "$apprenant.historique_statut",
                  as: "statut",
                  cond: {
                    $lte: ["$$statut.date_statut", filters.date],
                  },
                },
              },
              sortBy: { date_statut: 1 },
            },
          },
        },
      },
      {
        $match: { "apprenant.historique_statut": { $not: { $size: 0 } } },
      },
      {
        $addFields: {
          statut_apprenant_at_date: {
            $last: "$apprenant.historique_statut",
          },
        },
      },
      {
        $facet: {
          apprentis: [
            {
              $match: {
                "statut_apprenant_at_date.valeur_statut": CODES_STATUT_APPRENANT.apprenti,
              },
            },
            {
              $group: {
                _id: "$organisme_id",
                apprentis: {
                  $sum: 1,
                },
              },
            },
          ],
          abandons: [
            {
              $match: {
                "statut_apprenant_at_date.valeur_statut": CODES_STATUT_APPRENANT.abandon,
              },
            },
            {
              $group: {
                _id: "$organisme_id",
                abandons: {
                  $sum: 1,
                },
              },
            },
          ],
          inscritsSansContrat: [
            {
              $match: {
                "statut_apprenant_at_date.valeur_statut": CODES_STATUT_APPRENANT.inscrit,
                "apprenant.historique_statut.valeur_statut": { $ne: CODES_STATUT_APPRENANT.apprenti },
              },
            },
            {
              $group: {
                _id: "$organisme_id",
                inscritsSansContrat: {
                  $sum: 1,
                },
              },
            },
          ],
          rupturants: [
            { $match: { "statut_apprenant_at_date.valeur_statut": CODES_STATUT_APPRENANT.inscrit } },
            // set previousStatutAtDate to be the element in apprenant.historique_statut juste before statut_apprenant_at_date
            {
              $addFields: {
                previousStatutAtDate: {
                  $arrayElemAt: ["$apprenant.historique_statut", -2],
                },
              },
            },
            { $match: { "previousStatutAtDate.valeur_statut": CODES_STATUT_APPRENANT.apprenti } },
            {
              $group: {
                _id: "$organisme_id",
                rupturants: {
                  $sum: 1,
                },
              },
            },
          ],
        },
      },
      {
        $project: {
          items: {
            $concatArrays: ["$apprentis", "$abandons", "$inscritsSansContrat", "$rupturants"],
          },
        },
      },
      {
        $unwind: "$items",
      },
      {
        $group: {
          _id: "$items._id",
          merge: {
            $mergeObjects: "$items",
          },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              {
                apprenants: 0,
                apprentis: 0,
                inscritsSansContrat: 0,
                abandons: 0,
                rupturants: 0,
              },
              "$merge",
            ],
          },
        },
      },
      {
        $lookup: {
          from: "organismes",
          localField: "_id",
          foreignField: "_id",
          as: "organisme",
          pipeline: [
            {
              $project: {
                uai: 1,
                siret: 1,
                nom: {
                  $ifNull: ["$enseigne", "$raison_sociale"],
                },
                nature: {
                  $ifNull: ["$nature", "inconnue"], // On devrait plutôt remplir automatiquement la nature
                },
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$organisme",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          organisme_id: "$_id",
          uai: "$organisme.uai",
          siret: "$organisme.siret",
          nom: "$organisme.nom",
          nature: "$organisme.nature",

          apprenants: {
            $sum: ["$apprentis", "$inscritsSansContrat", "$rupturants"],
          },
          apprentis: 1,
          inscritsSansContrat: 1,
          abandons: 1,
          rupturants: 1,
        },
      },
    ])
    .toArray()) as IndicateursEffectifsAvecOrganisme[];
  return indicateurs;
}

export const typesEffectifNominatif = ["inscritsSansContrat", "rupturants", "abandons"] as const;
export type TypeEffectifNominatif = (typeof typesEffectifNominatif)[number];

const pipelineByTypeEffectifNominatif: { [type in TypeEffectifNominatif]: any[] } = {
  abandons: [
    {
      $match: {
        "statut_apprenant_at_date.valeur_statut": CODES_STATUT_APPRENANT.abandon,
      },
    },
  ],
  inscritsSansContrat: [
    {
      $match: {
        "statut_apprenant_at_date.valeur_statut": CODES_STATUT_APPRENANT.inscrit,
        "apprenant.historique_statut.valeur_statut": { $ne: CODES_STATUT_APPRENANT.apprenti },
      },
    },
  ],
  rupturants: [
    { $match: { "statut_apprenant_at_date.valeur_statut": CODES_STATUT_APPRENANT.inscrit } },
    // set previousStatutAtDate to be the element in apprenant.historique_statut juste before statut_apprenant_at_date
    {
      $addFields: {
        previousStatutAtDate: {
          $arrayElemAt: ["$apprenant.historique_statut", -2],
        },
      },
    },
    { $match: { "previousStatutAtDate.valeur_statut": CODES_STATUT_APPRENANT.apprenti } },
  ],
};

export async function getEffectifsNominatifs(
  ctx: AuthContext,
  filters: FullEffectifsFilters,
  type: TypeEffectifNominatif,
  organismeId?: ObjectId
): Promise<IndicateursEffectifsAvecOrganisme[]> {
  const indicateurs = (await effectifsDb()
    .aggregate([
      {
        $match: {
          $and: [
            await getOrganismeRestriction(organismeId),
            await getEffectifsNominatifsRestriction(ctx),
            ...buildMongoFilters(filters, fullEffectifsFiltersConfigurations),
          ],
          "_computed.organisme.fiable": true,
        },
      },
      {
        $addFields: {
          "apprenant.historique_statut": {
            $sortArray: {
              input: {
                $filter: {
                  input: "$apprenant.historique_statut",
                  as: "statut",
                  cond: {
                    $lte: ["$$statut.date_statut", filters.date],
                  },
                },
              },
              sortBy: { date_statut: 1 },
            },
          },
        },
      },
      {
        $match: { "apprenant.historique_statut": { $not: { $size: 0 } } },
      },
      {
        $addFields: {
          statut_apprenant_at_date: {
            $last: "$apprenant.historique_statut",
          },
        },
      },
      ...pipelineByTypeEffectifNominatif[type],
      {
        $lookup: {
          from: "organismes",
          localField: "organisme_id",
          foreignField: "_id",
          as: "organisme",
          pipeline: [
            {
              $project: {
                uai: 1,
                siret: 1,
                nom: {
                  $ifNull: ["$enseigne", "$raison_sociale"],
                },
                nature: {
                  $ifNull: ["$nature", "inconnue"], // On devrait plutôt remplir automatiquement la nature
                },
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$organisme",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          organisme_uai: "$organisme.uai",
          organisme_siret: "$organisme.siret",
          organisme_nom: "$organisme.nom",
          organisme_nature: "$organisme.nature",

          apprenant_nom: "$apprenant.nom",
          apprenant_prenom: "$apprenant.prenom",
          apprenant_date_de_naissance: { $substr: ["$apprenant.date_de_naissance", 0, 10] },
          formation_cfd: "$formation.cfd",
          formation_rncp: "$formation.rncp",
          formation_libelle_long: "$formation.libelle_long",
          formation_annee: "$formation.annee",
          formation_niveau: "$formation.niveau",
          formation_date_debut_formation: { $arrayElemAt: ["$formation.periode", 0] },
          formation_date_fin_formation: { $arrayElemAt: ["$formation.periode", 1] },
        },
      },
    ])
    .toArray()) as IndicateursEffectifsAvecOrganisme[];
  return indicateurs;
}

export async function getOrganismeIndicateursEffectifs(
  ctx: AuthContext,
  organismeId: ObjectId,
  filters: EffectifsFilters
): Promise<IndicateursEffectifs> {
  const indicateurs = (await effectifsDb()
    .aggregate([
      {
        $match: {
          $and: [
            await getOrganismeRestriction(organismeId),
            await getOrganismeIndicateursEffectifsRestriction(ctx),
            ...buildMongoFilters(filters, effectifsFiltersConfigurations),
          ],
          "_computed.organisme.fiable": true,
        },
      },
      {
        $project: {
          "apprenant.historique_statut": {
            $sortArray: {
              input: {
                $filter: {
                  input: "$apprenant.historique_statut",
                  as: "statut",
                  cond: {
                    $lte: ["$$statut.date_statut", filters.date],
                  },
                },
              },
              sortBy: { date_statut: 1 },
            },
          },
        },
      },
      {
        $match: { "apprenant.historique_statut": { $not: { $size: 0 } } },
      },
      {
        $addFields: {
          statut_apprenant_at_date: {
            $last: "$apprenant.historique_statut",
          },
        },
      },
      {
        $facet: {
          apprentis: [
            {
              $match: {
                "statut_apprenant_at_date.valeur_statut": CODES_STATUT_APPRENANT.apprenti,
              },
            },
            {
              $count: "apprentis",
            },
          ],
          abandons: [
            {
              $match: {
                "statut_apprenant_at_date.valeur_statut": CODES_STATUT_APPRENANT.abandon,
              },
            },
            {
              $count: "abandons",
            },
          ],
          inscritsSansContrat: [
            {
              $match: {
                "statut_apprenant_at_date.valeur_statut": CODES_STATUT_APPRENANT.inscrit,
                "apprenant.historique_statut.valeur_statut": { $ne: CODES_STATUT_APPRENANT.apprenti },
              },
            },
            {
              $count: "inscritsSansContrat",
            },
          ],
          rupturants: [
            { $match: { "statut_apprenant_at_date.valeur_statut": CODES_STATUT_APPRENANT.inscrit } },
            // set previousStatutAtDate to be the element in apprenant.historique_statut juste before statut_apprenant_at_date
            {
              $addFields: {
                previousStatutAtDate: {
                  $arrayElemAt: ["$apprenant.historique_statut", -2],
                },
              },
            },
            { $match: { "previousStatutAtDate.valeur_statut": CODES_STATUT_APPRENANT.apprenti } },
            {
              $count: "rupturants",
            },
          ],
        },
      },
      {
        $project: {
          items: {
            $concatArrays: ["$apprentis", "$abandons", "$inscritsSansContrat", "$rupturants"],
          },
        },
      },
      {
        $unwind: "$items",
      },
      {
        $group: {
          _id: "$items._id",
          merge: {
            $mergeObjects: "$items",
          },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              {
                apprenants: 0,
                apprentis: 0,
                inscritsSansContrat: 0,
                abandons: 0,
                rupturants: 0,
              },
              "$merge",
            ],
          },
        },
      },
      {
        $project: {
          _id: 0,
          apprenants: {
            $sum: ["$apprentis", "$inscritsSansContrat", "$rupturants"],
          },
          apprentis: 1,
          inscritsSansContrat: 1,
          abandons: 1,
          rupturants: 1,
        },
      },
    ])
    .next()) as IndicateursEffectifs;
  return (
    indicateurs ?? {
      apprenants: 0,
      apprentis: 0,
      inscritsSansContrat: 0,
      abandons: 0,
      rupturants: 0,
    }
  );
}

export async function getOrganismeIndicateursOrganismes(organismeId: ObjectId): Promise<IndicateursOrganismes> {
  const indicateurs = (await organismesDb()
    .aggregate([
      {
        $match: {
          _id: {
            $in: await findOrganismesFormateursIdsOfOrganisme(organismeId),
          },
        },
      },
      {
        $project: {
          transmet: { $cond: [{ $ne: [{ $ifNull: ["$last_transmission_date", ""] }, ""] }, 1, 0] },
          ne_transmet_pas: { $cond: [{ $ne: [{ $ifNull: ["$last_transmission_date", ""] }, ""] }, 0, 1] },
        },
      },
      {
        $group: {
          _id: null,
          total_transmet: { $sum: "$transmet" },
          total_ne_transmet_pas: { $sum: "$ne_transmet_pas" },
        },
      },
      {
        $project: {
          _id: 0,
          tauxCouverture: {
            $multiply: [100, { $divide: ["$total_transmet", { $add: ["$total_transmet", "$total_ne_transmet_pas"] }] }],
          },
          totalOrganismes: {
            $add: ["$total_transmet", "$total_ne_transmet_pas"],
          },
          organismesTransmetteurs: "$total_transmet",
          organismesNonTransmetteurs: "$total_ne_transmet_pas",
        },
      },
    ])
    .next()) as IndicateursOrganismes;
  return (
    indicateurs ?? {
      tauxCouverture: 0,
      totalOrganismes: 0,
      organismesTransmetteurs: 0,
      organismesNonTransmetteurs: 0,
    }
  );
}

async function getOrganismeRestriction(organismeId?: ObjectId) {
  return organismeId
    ? { organisme_id: { $in: [organismeId, ...(await findOrganismesFormateursIdsOfOrganisme(organismeId))] } }
    : {};
}
