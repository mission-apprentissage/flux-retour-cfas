import { Collection, ObjectId } from "mongodb";
import {
  Acl,
  IndicateursEffectifs,
  IndicateursEffectifsAvecDepartement,
  IndicateursEffectifsAvecFormation,
  IndicateursEffectifsAvecOrganisme,
  IndicateursOrganismes,
  IndicateursOrganismesAvecDepartement,
  ORGANISME_INDICATEURS_TYPE,
  STATUT_APPRENANT,
  TypeEffectifNominatif,
  hasRecentTransmissions,
  shouldDisplayContactInEffectifNominatif,
} from "shared";

import {
  DateFilters,
  EffectifsFiltersTerritoire,
  FullEffectifsFilters,
  TerritoireFilters,
  combineFilters,
} from "@/common/actions/helpers/filters";
import { findOrganismesFormateursIdsOfOrganisme } from "@/common/actions/helpers/permissions";
import { organismesDb } from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";

import { buildEffectifMongoFilters } from "./effectifs/effectifs-filters";
import { buildDECAFilter } from "./indicateurs-with-deca.actions";
import { buildOrganismeMongoFilters } from "./organismes/organismes-filters";

export const createDernierStatutFieldPipeline = (date: Date) => [
  {
    $addFields: {
      dernierStatut: {
        $arrayElemAt: [
          {
            $filter: {
              input: "$_computed.statut.parcours",
              as: "statut",
              cond: {
                $lte: ["$$statut.date", date],
              },
            },
          },
          -1,
        ],
      },
    },
  },
  {
    $addFields: {
      dernierStatutDureeInDay: {
        $dateDiff: { startDate: "$dernierStatut.date", endDate: date, unit: "day" },
      },
    },
  },
];

export function buildIndicateursEffectifsPipeline(
  groupBy: string | null | Record<string, string>,
  currentDate: Date,
  extraAccumulator: Record<string, unknown> = {},
  customMatchAggregation: Array<Record<string, string>> | null = null
) {
  const firstStage = customMatchAggregation ?? createDernierStatutFieldPipeline(currentDate);
  return [
    ...firstStage,
    {
      $group: {
        _id: groupBy,
        apprentis: {
          $sum: {
            $cond: [{ $eq: ["$dernierStatut.valeur", STATUT_APPRENANT.APPRENTI] }, 1, 0],
          },
        },
        inscrits: {
          $sum: {
            $cond: [{ $eq: ["$dernierStatut.valeur", STATUT_APPRENANT.INSCRIT] }, 1, 0],
          },
        },
        abandons: {
          $sum: {
            $cond: [{ $eq: ["$dernierStatut.valeur", STATUT_APPRENANT.ABANDON] }, 1, 0],
          },
        },
        rupturants: {
          $sum: {
            $cond: [{ $eq: ["$dernierStatut.valeur", STATUT_APPRENANT.RUPTURANT] }, 1, 0],
          },
        },
        finDeFormation: {
          $sum: {
            $cond: [{ $eq: ["$dernierStatut.valeur", STATUT_APPRENANT.FIN_DE_FORMATION] }, 1, 0],
          },
        },
        ...extraAccumulator,
      },
    },
    {
      $project: {
        apprenants: {
          $sum: ["$apprentis", "$inscrits", "$rupturants", "$finDeFormation"],
        },
        apprentis: {
          $sum: ["$apprentis", "$finDeFormation"],
        },
        inscrits: 1,
        abandons: 1,
        rupturants: 1,
        finDeFormation: 1,
        ...Object.entries(extraAccumulator).reduce((acc, [key]) => ({ ...acc, [key]: 1 }), {}),
      },
    },
  ];
}

export async function getIndicateursEffectifsParDepartementGenerique(
  filters: DateFilters & TerritoireFilters,
  acl: Acl,
  db: Collection<any>,
  decaMode: boolean = false
): Promise<IndicateursEffectifsAvecDepartement[]> {
  const indicateurs = await db
    .aggregate([
      {
        $match: combineFilters(
          {
            "_computed.organisme.fiable": true, // TODO : a supprimer si on permet de choisir de voir les effectifs des non fiables
          },
          buildDECAFilter(decaMode),
          ...buildEffectifMongoFilters(filters, acl.indicateursEffectifs)
        ),
      },
      ...buildIndicateursEffectifsPipeline("$_computed.organisme.departement", filters.date),
      {
        $project: {
          _id: 0,
          departement: "$_id",
          apprenants: 1,
          apprentis: 1,
          inscrits: 1,
          abandons: 1,
          rupturants: 1,
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
  const { date, ...restFilters } = filters;

  // On ne prend pas en compte la date dans le match car des organismes n'ont pas de date de transmission
  const filtersWithoutDate = buildOrganismeMongoFilters(restFilters, acl.infoTransmissionEffectifs);

  const dateFilterCondition = date ? [{ $lte: ["$first_transmission_date", new Date(date)] }] : [];

  const indicateurs = (await organismesDb()
    .aggregate([
      {
        $match: {
          ...combineFilters(...filtersWithoutDate, {
            fiabilisation_statut: "FIABLE",
            ferme: false,
          }),
        },
      },
      {
        $group: {
          _id: "$adresse.departement",
          totalOrganismes: { $sum: 1 },
          responsables: {
            $sum: {
              $cond: {
                if: { $eq: ["$nature", "responsable"] },
                then: 1,
                else: 0,
              },
            },
          },
          responsablesFormateurs: {
            $sum: {
              $cond: {
                if: { $eq: ["$nature", "responsable_formateur"] },
                then: 1,
                else: 0,
              },
            },
          },
          formateurs: {
            $sum: {
              $cond: {
                if: { $eq: ["$nature", "formateur"] },
                then: 1,
                else: 0,
              },
            },
          },
          organismesTransmetteurs: {
            $sum: {
              $cond: {
                if: {
                  $and: [{ $ne: [null, { $ifNull: ["$first_transmission_date", null] }] }, ...dateFilterCondition],
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
                    { $ne: [null, { $ifNull: ["$first_transmission_date", null] }] },
                    ...dateFilterCondition,
                    { $eq: ["$nature", "responsable"] },
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
                    { $ne: [null, { $ifNull: ["$first_transmission_date", null] }] },
                    ...dateFilterCondition,
                    { $eq: ["$nature", "responsable_formateur"] },
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
                    { $ne: [null, { $ifNull: ["$first_transmission_date", null] }] },
                    ...dateFilterCondition,
                    { $eq: ["$nature", "formateur"] },
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
            total: "$totalOrganismes",
            responsables: "$responsables",
            responsablesFormateurs: "$responsablesFormateurs",
            formateurs: "$formateurs",
            inconnues: {
              $subtract: [
                "$totalOrganismes",
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
        $addFields: {
          tauxCouverture: {
            total: {
              $cond: {
                if: { $eq: ["$totalOrganismes.total", 0] },
                then: 100,
                else: {
                  $multiply: [100, { $divide: ["$organismesTransmetteurs.total", "$totalOrganismes.total"] }],
                },
              },
            },
            responsables: {
              $cond: {
                if: { $eq: ["$totalOrganismes.responsables", 0] },
                then: 100,
                else: {
                  $multiply: [
                    100,
                    { $divide: ["$organismesTransmetteurs.responsables", "$totalOrganismes.responsables"] },
                  ],
                },
              },
            },
            responsablesFormateurs: {
              $cond: {
                if: { $eq: ["$totalOrganismes.responsablesFormateurs", 0] },
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
                if: { $eq: ["$totalOrganismes.formateurs", 0] },
                then: 100,
                else: {
                  $multiply: [100, { $divide: ["$organismesTransmetteurs.formateurs", "$totalOrganismes.formateurs"] }],
                },
              },
            },
            inconnues: {
              $cond: {
                if: { $eq: ["$totalOrganismes.inconnues", 0] },
                then: 100,
                else: {
                  $multiply: [100, { $divide: ["$organismesTransmetteurs.inconnues", "$totalOrganismes.inconnues"] }],
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
              $subtract: ["$totalOrganismes.responsablesFormateurs", "$organismesTransmetteurs.responsablesFormateurs"],
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

export async function getIndicateursEffectifsParOrganismeGenerique(
  ctx: AuthContext,
  filters: FullEffectifsFilters,
  db: Collection<any>,
  decaMode: boolean = false,
  organismeId?: ObjectId
): Promise<IndicateursEffectifsAvecOrganisme[]> {
  const indicateurs = (await db
    .aggregate([
      {
        $match: combineFilters(
          await getOrganismeRestriction(organismeId),
          buildDECAFilter(decaMode),
          ...buildEffectifMongoFilters(filters, ctx.acl.indicateursEffectifs),
          {
            "_computed.organisme.fiable": true, // TODO : a supprimer si on permet de choisir de voir les effectifs des non fiables
          }
        ),
      },
      ...buildIndicateursEffectifsPipeline("$organisme_id", filters.date),
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

          apprenants: 1,
          apprentis: 1,
          inscrits: 1,
          abandons: 1,
          rupturants: 1,
        },
      },
    ])
    .toArray()) as IndicateursEffectifsAvecOrganisme[];
  return indicateurs;
}

export async function getOrganismeIndicateursEffectifsParFormationGenerique(
  ctx: AuthContext,
  organismeId: ObjectId,
  filters: FullEffectifsFilters,
  db: Collection<any>,
  decaMode: boolean = false
): Promise<IndicateursEffectifsAvecFormation[]> {
  const indicateurs = await db
    .aggregate<IndicateursEffectifsAvecFormation>([
      {
        $match: combineFilters(
          await getOrganismeRestriction(organismeId),
          buildDECAFilter(decaMode),
          ...buildEffectifMongoFilters(filters, ctx.acl.indicateursEffectifs),
          {
            "_computed.organisme.fiable": true, // TODO : a supprimer si on permet de choisir de voir les effectifs des non fiables
          }
        ),
      },
      ...buildIndicateursEffectifsPipeline(
        {
          rncp: "$formation.rncp",
          cfd: "$formation.cfd",
        },
        filters.date,
        {
          intitule: { $first: "$formation.libelle_long" },
          niveau_europeen: { $first: "$formation.niveau" },
        }
      ),
      {
        $project: {
          _id: 0,
          rncp_code: "$_id.rncp",
          cfd_code: "$_id.cfd",
          apprenants: 1,
          apprentis: 1,
          inscrits: 1,
          abandons: 1,
          rupturants: 1,
          intitule: 1,
          niveau_europeen: 1,
        },
      },
    ])
    .toArray();

  return indicateurs;
}

export async function getEffectifsNominatifsGenerique(
  ctx: AuthContext,
  filters: FullEffectifsFilters,
  type: TypeEffectifNominatif,
  db: Collection<any>,
  decaMode: boolean = false,
  organismeId?: ObjectId
): Promise<IndicateursEffectifsAvecOrganisme[]> {
  const computedType = (t: TypeEffectifNominatif) => {
    switch (t) {
      case "apprenant":
        return ["APPRENTI", "INSCRIT", "RUPTURANT", "FIN_DE_FORMATION"];
      case "apprenti":
        return ["APPRENTI", "FIN_DE_FORMATION"];
      case "inscritSansContrat":
        return ["INSCRIT"];
      case "rupturant":
        return ["RUPTURANT"];
      case "abandon":
        return ["ABANDON"];
      default:
        return [t];
    }
  };
  const indicateurs = (await db
    .aggregate([
      {
        $match: combineFilters(
          await getOrganismeRestriction(organismeId),
          buildDECAFilter(decaMode),
          ...buildEffectifMongoFilters(filters, ctx.acl.effectifsNominatifs[type]),
          {
            "_computed.organisme.fiable": true, // TODO : a supprimer si on permet de choisir de voir les effectifs des non fiables
          }
        ),
      },
      {
        $addFields: {
          "_computed.statut.parcours": {
            $sortArray: {
              input: {
                $filter: {
                  input: "$_computed.statut.parcours",
                  as: "statut",
                  cond: {
                    $lte: ["$$statut.date", filters.date],
                  },
                },
              },
              sortBy: { date: 1 },
            },
          },
        },
      },
      {
        $match: { "_computed.statut.parcours": { $not: { $size: 0 } } },
      },
      {
        $addFields: {
          statut_apprenant_at_date: {
            $last: "$_computed.statut.parcours",
          },
        },
      },
      {
        $addFields: {
          statut: "$statut_apprenant_at_date.valeur",
        },
      },
      {
        $match: {
          statut: { $in: computedType(type) },
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
          _id: 1,
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
          ...(shouldDisplayContactInEffectifNominatif(ctx.organisation.type)
            ? {
                apprenant_courriel: "$apprenant.courriel",
                apprenant_telephone: "$apprenant.telephone",
              }
            : {}),
        },
      },
    ])
    .toArray()) as IndicateursEffectifsAvecOrganisme[];
  return indicateurs;
}

export async function getOrganismeIndicateursEffectifsGenerique(
  ctx: AuthContext,
  organismeId: ObjectId,
  filters: EffectifsFiltersTerritoire,
  db: Collection<any>,
  decaMode: boolean = false
): Promise<IndicateursEffectifs> {
  const indicateurs = (await db
    .aggregate([
      {
        $match: combineFilters(
          await getOrganismeRestriction(organismeId),
          buildDECAFilter(decaMode),
          ...buildEffectifMongoFilters(filters, ctx.acl.indicateursEffectifs)
        ),
      },
      ...buildIndicateursEffectifsPipeline(null, filters.date),
      {
        $project: {
          _id: 0,
          apprenants: 1,
          apprentis: 1,
          inscrits: 1,
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
      inscrits: 0,
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
            $in: await findOrganismesFormateursIdsOfOrganisme(organismeId, true),
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
    ? { organisme_id: { $in: [organismeId, ...(await findOrganismesFormateursIdsOfOrganisme(organismeId, true))] } }
    : {};
}

export const getIndicateursForRelatedOrganismes = async (organismeId: ObjectId, indicateurType: string) => {
  const org = await organismesDb().findOne({ _id: organismeId });
  const organismesFormateurs = org?.organismesFormateurs;

  if (!organismesFormateurs) {
    return [];
  }

  // Initialise les indicateurs pour tous les organismes formateurs avec son propre organisme
  const allOrganismes = [org, ...organismesFormateurs];

  switch (indicateurType) {
    case ORGANISME_INDICATEURS_TYPE.SANS_EFFECTIFS:
      return allOrganismes.filter(({ last_transmission_date }) => !hasRecentTransmissions(last_transmission_date));
    case ORGANISME_INDICATEURS_TYPE.NATURE_INCONNUE:
      return allOrganismes.filter(({ nature }) => nature === "inconnue");
    case ORGANISME_INDICATEURS_TYPE.SIRET_FERME:
      return allOrganismes.filter(({ ferme }) => !!ferme);
    case ORGANISME_INDICATEURS_TYPE.UAI_NON_DETERMINE:
      return allOrganismes.filter(({ uai }) => !uai);
    default:
      return [];
  }
};
