import { ObjectId } from "mongodb";
import {
  Acl,
  CODES_STATUT_APPRENANT,
  IndicateursEffectifs,
  IndicateursEffectifsAvecDepartement,
  IndicateursEffectifsAvecFormation,
  IndicateursEffectifsAvecOrganisme,
  IndicateursOrganismes,
  IndicateursOrganismesAvecDepartement,
  TypeEffectifNominatif,
} from "shared";

import {
  DateFilters,
  EffectifsFiltersTerritoire,
  FullEffectifsFilters,
  TerritoireFilters,
  combineFilters,
} from "@/common/actions/helpers/filters";
import { findOrganismesFormateursIdsOfOrganisme } from "@/common/actions/helpers/permissions";
import { effectifsDb, organismesDb } from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";

import { buildEffectifMongoFilters } from "./effectifs/effectifs-filters";
import { buildOrganismeMongoFilters } from "./organismes/organismes-filters";

export async function getIndicateursEffectifsParDepartement(
  filters: DateFilters,
  acl: Acl
): Promise<IndicateursEffectifsAvecDepartement[]> {
  const indicateurs = await effectifsDb()
    .aggregate([
      {
        $match: combineFilters(
          {
            "_computed.organisme.fiable": true, // TODO : a supprimer si on permet de choisir de voir les effectifs des non fiables
          },
          ...buildEffectifMongoFilters(filters, acl.indicateursEffectifs)
        ),
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
        $group: {
          _id: "$departement",
          apprentis: {
            $sum: {
              $cond: {
                if: { $eq: ["$statut_apprenant_at_date.valeur_statut", CODES_STATUT_APPRENANT.apprenti] },
                then: 1,
                else: 0,
              },
            },
          },
          abandons: {
            $sum: {
              $cond: {
                if: { $eq: ["$statut_apprenant_at_date.valeur_statut", CODES_STATUT_APPRENANT.abandon] },
                then: 1,
                else: 0,
              },
            },
          },
          inscritsSansContrat: {
            $sum: {
              $cond: {
                if: {
                  $and: [
                    { $eq: ["$statut_apprenant_at_date.valeur_statut", CODES_STATUT_APPRENANT.inscrit] },
                    { $ne: ["$apprenant.historique_statut.valeur_statut", CODES_STATUT_APPRENANT.apprenti] },
                  ],
                },
                then: 1,
                else: 0,
              },
            },
          },
          inscrits: {
            $sum: {
              $cond: {
                if: {
                  $eq: ["$statut_apprenant_at_date.valeur_statut", CODES_STATUT_APPRENANT.inscrit],
                },
                then: 1,
                else: 0,
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          departement: "$_id",
          apprenants: {
            $sum: ["$apprentis", "$inscrits"],
          },
          apprentis: 1,
          inscritsSansContrat: 1,
          abandons: 1,
          rupturants: { $subtract: ["$inscrits", "$inscritsSansContrat"] },
        },
      },
    ])
    .toArray();
  return indicateurs as IndicateursEffectifsAvecDepartement[];
}

export async function getIndicateursOrganismesParDepartement(
  filters: DateFilters & TerritoireFilters,
  acl: Acl
): Promise<IndicateursOrganismesAvecDepartement[]> {
  const indicateurs = (await organismesDb()
    .aggregate([
      {
        $match: combineFilters(...buildOrganismeMongoFilters(filters, acl.infoTransmissionEffectifs), {
          fiabilisation_statut: "FIABLE",
          ferme: false,
        }),
      },
      {
        $group: {
          _id: "$adresse.departement",
          organismes: {
            $sum: 1,
          },
          responsables: {
            $sum: {
              $cond: {
                if: {
                  $eq: ["$nature", "responsable"],
                },
                then: 1,
                else: 0,
              },
            },
          },
          responsablesFormateurs: {
            $sum: {
              $cond: {
                if: {
                  $eq: ["$nature", "responsable_formateur"],
                },
                then: 1,
                else: 0,
              },
            },
          },
          formateurs: {
            $sum: {
              $cond: {
                if: {
                  $eq: ["$nature", "formateur"],
                },
                then: 1,
                else: 0,
              },
            },
          },
          organismesTransmetteurs: {
            $sum: {
              $cond: {
                if: {
                  $ne: [
                    null,
                    {
                      $ifNull: ["$first_transmission_date", null],
                    },
                  ],
                },
                then: 1,
                else: 0,
              },
            },
          },
          responsableTransmetteurs: {
            $sum: {
              $cond: {
                if: {
                  $and: [
                    {
                      $ne: [
                        null,
                        {
                          $ifNull: ["$first_transmission_date", null],
                        },
                      ],
                    },
                    {
                      $eq: ["$nature", "responsable"],
                    },
                  ],
                },
                then: 1,
                else: 0,
              },
            },
          },
          responsablesFormateursTransmetteurs: {
            $sum: {
              $cond: {
                if: {
                  $and: [
                    {
                      $ne: [
                        null,
                        {
                          $ifNull: ["$first_transmission_date", null],
                        },
                      ],
                    },
                    {
                      $eq: ["$nature", "responsable_formateur"],
                    },
                  ],
                },
                then: 1,
                else: 0,
              },
            },
          },
          formateursTransmetteurs: {
            $sum: {
              $cond: {
                if: {
                  $and: [
                    {
                      $ne: [
                        null,
                        {
                          $ifNull: ["$first_transmission_date", null],
                        },
                      ],
                    },
                    {
                      $eq: ["$nature", "formateur"],
                    },
                  ],
                },
                then: 1,
                else: 0,
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          departement: "$_id",
          totalOrganismes: {
            total: "$organismes",
            responsables: "$responsables",
            responsablesFormateurs: "$responsablesFormateurs",
            formateurs: "$formateurs",
            inconnues: {
              $subtract: [
                "$organismes",
                {
                  $add: ["$responsables", "$responsablesFormateurs", "$formateurs"],
                },
              ],
            },
          },
          organismesTransmetteurs: {
            total: "$organismesTransmetteurs",
            responsables: "$responsableTransmetteurs",
            responsablesFormateurs: "$responsablesFormateursTransmetteurs",
            formateurs: "$formateursTransmetteurs",
            inconnues: {
              $subtract: [
                "$organismesTransmetteurs",
                {
                  $add: [
                    "$responsableTransmetteurs",
                    "$responsablesFormateursTransmetteurs",
                    "$formateursTransmetteurs",
                  ],
                },
              ],
            },
          },
        },
      },
      {
        $addFields:
          /**
           * newField: The new field name.
           * expression: The new field expression.
           */
          {
            tauxCouverture: {
              total: {
                $cond: {
                  if: {
                    $gte: [0, "$totalOrganismes.total"],
                  },
                  then: 100,
                  else: {
                    $multiply: [
                      100,
                      {
                        $divide: ["$organismesTransmetteurs.total", "$totalOrganismes.total"],
                      },
                    ],
                  },
                },
              },
              responsables: {
                $cond: {
                  if: {
                    $gte: [0, "$totalOrganismes.responsables"],
                  },
                  then: 100,
                  else: {
                    $multiply: [
                      100,
                      {
                        $divide: ["$organismesTransmetteurs.responsables", "$totalOrganismes.responsables"],
                      },
                    ],
                  },
                },
              },
              responsablesFormateurs: {
                $cond: {
                  if: {
                    $gte: [0, "$totalOrganismes.responsablesFormateurs"],
                  },
                  then: 100,
                  else: {
                    $multiply: [
                      100,
                      {
                        $divide: [
                          "$organismesTransmetteurs.responsablesFormateurs",
                          "$totalOrganismes.responsablesFormateurs",
                        ],
                      },
                    ],
                  },
                },
              },
              formateurs: {
                $cond: {
                  if: {
                    $gte: [0, "$totalOrganismes.formateurs"],
                  },
                  then: 100,
                  else: {
                    $multiply: [
                      100,
                      {
                        $divide: ["$organismesTransmetteurs.formateurs", "$totalOrganismes.formateurs"],
                      },
                    ],
                  },
                },
              },
              inconnues: {
                $cond: {
                  if: {
                    $gte: [0, "$totalOrganismes.inconnues"],
                  },
                  then: 100,
                  else: {
                    $multiply: [
                      100,
                      {
                        $divide: ["$organismesTransmetteurs.inconnues", "$totalOrganismes.inconnues"],
                      },
                    ],
                  },
                },
              },
            },
            organismesNonTransmetteurs: {
              total: {
                $subtract: ["$totalOrganismes.total", "$organismesTransmetteurs.total"],
              },
              responsables: {
                $subtract: ["$totalOrganismes.responsables", "$organismesTransmetteurs.responsables"],
              },
              responsablesFormateurs: {
                $subtract: [
                  "$totalOrganismes.responsablesFormateurs",
                  "$organismesTransmetteurs.responsablesFormateurs",
                ],
              },
              formateurs: {
                $subtract: ["$totalOrganismes.formateurs", "$organismesTransmetteurs.formateurs"],
              },
              inconnues: {
                $subtract: ["$totalOrganismes.inconnues", "$organismesTransmetteurs.inconnues"],
              },
            },
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
        $match: combineFilters(
          await getOrganismeRestriction(organismeId),
          ...buildEffectifMongoFilters(filters, ctx.acl.indicateursEffectifs),
          {
            "_computed.organisme.fiable": true, // TODO : a supprimer si on permet de choisir de voir les effectifs des non fiables
          }
        ),
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

export async function getOrganismeIndicateursEffectifsParFormation(
  ctx: AuthContext,
  organismeId: ObjectId,
  filters: FullEffectifsFilters
): Promise<IndicateursEffectifsAvecFormation[]> {
  const indicateurs = (await effectifsDb()
    .aggregate([
      {
        $match: combineFilters(
          await getOrganismeRestriction(organismeId),
          ...buildEffectifMongoFilters(filters, ctx.acl.indicateursEffectifs),
          {
            "_computed.organisme.fiable": true, // TODO : a supprimer si on permet de choisir de voir les effectifs des non fiables
          }
        ),
      },
      {
        $project: {
          "formation.rncp": 1,
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
                _id: "$formation.rncp",
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
                _id: "$formation.rncp",
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
                _id: "$formation.rncp",
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
                _id: "$formation.rncp",
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
          rncp_code: "$_id",
          apprenants: {
            $sum: ["$apprentis", "$inscritsSansContrat", "$rupturants"],
          },
          apprentis: 1,
          inscritsSansContrat: 1,
          abandons: 1,
          rupturants: 1,
        },
      },
      {
        $lookup: {
          from: "rncp",
          localField: "rncp_code",
          foreignField: "rncp",
          as: "rncp",
          pipeline: [
            {
              $project: {
                _id: 0,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$rncp",
          preserveNullAndEmptyArrays: true,
        },
      },
    ])
    .toArray()) as IndicateursEffectifsAvecFormation[];

  return indicateurs;
}

export async function getEffectifsNominatifs(
  ctx: AuthContext,
  filters: FullEffectifsFilters,
  type: TypeEffectifNominatif,
  organismeId?: ObjectId
): Promise<IndicateursEffectifsAvecOrganisme[]> {
  const indicateurs = (await effectifsDb()
    .aggregate([
      {
        $match: combineFilters(
          await getOrganismeRestriction(organismeId),
          ...buildEffectifMongoFilters(filters, ctx.acl.effectifsNominatifs[type]),
          {
            "_computed.organisme.fiable": true, // TODO : a supprimer si on permet de choisir de voir les effectifs des non fiables
          }
        ),
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
      {
        $set: {
          previousStatutAtDate: {
            $arrayElemAt: ["$apprenant.historique_statut", -2],
          },
        },
      },
      {
        $set: {
          statut: {
            // pipeline commun entre statuts plutôt que $facet limité à 16Mo
            $switch: {
              branches: [
                // l'ordre important ici, du statut le plus spécifique au plus générique
                {
                  case: {
                    $and: [
                      { $eq: ["$statut_apprenant_at_date.valeur_statut", CODES_STATUT_APPRENANT.inscrit] },
                      { $eq: ["$previousStatutAtDate.valeur_statut", CODES_STATUT_APPRENANT.apprenti] },
                    ],
                  },
                  then: "rupturant" satisfies TypeEffectifNominatif,
                },
                {
                  case: {
                    $and: [
                      { $eq: ["$statut_apprenant_at_date.valeur_statut", CODES_STATUT_APPRENANT.inscrit] },
                      { $ne: ["$apprenant.historique_statut.valeur_statut", CODES_STATUT_APPRENANT.apprenti] },
                    ],
                  },
                  then: "inscritSansContrat" satisfies TypeEffectifNominatif,
                },
                {
                  case: { $eq: ["$statut_apprenant_at_date.valeur_statut", CODES_STATUT_APPRENANT.apprenti] },
                  then: "apprenti" satisfies TypeEffectifNominatif,
                },
                {
                  case: { $eq: ["$statut_apprenant_at_date.valeur_statut", CODES_STATUT_APPRENANT.abandon] },
                  then: "abandon" satisfies TypeEffectifNominatif,
                },
              ],
              default: "inconnu" satisfies TypeEffectifNominatif,
            },
          },
        },
      },
      {
        $match: {
          statut:
            type === "apprenant"
              ? {
                  $in: ["apprenti", "inscritSansContrat", "rupturant"] satisfies TypeEffectifNominatif[],
                }
              : { $eq: type },
        },
      },
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

          apprenant_statut: "$statut",
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
  filters: EffectifsFiltersTerritoire
): Promise<IndicateursEffectifs> {
  const indicateurs = (await effectifsDb()
    .aggregate([
      {
        $match: combineFilters(
          await getOrganismeRestriction(organismeId),
          ...buildEffectifMongoFilters(filters, ctx.acl.indicateursEffectifs)
        ),
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
