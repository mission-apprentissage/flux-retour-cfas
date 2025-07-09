import { ObjectId } from "bson";
import { WithoutId } from "mongodb";
import { IEffectif } from "shared/models";
import { IEffectifDECA } from "shared/models/data/effectifsDECA.model";

import { voeuxAffelnetDb } from "../model/collections";

const computeFilter = (departement: Array<string> | null, region: Array<string> | null) => {
  return {
    ...(departement ? { "_computed.organisme.departement": { $in: departement } } : {}),
    ...(region ? { "_computed.organisme.region": { $in: region } } : {}),
  };
};

// Write indexes for this
export const getAffelnetCountVoeuxNational = async (
  departement: Array<string> | null,
  regions: Array<string> | null,
  year: string
) => {
  const voeuxCount = await voeuxAffelnetDb()
    .aggregate([
      {
        $match: {
          ...computeFilter(departement, regions),
          annee_scolaire_rentree: year,
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
          apprenantsRetrouves: [
            {
              $match: {
                $or: [{ effectif_id: { $exists: true } }, { effectif_deca_id: { $exists: true } }],
              },
            },
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
        },
      },
      {
        $unwind: {
          path: "$voeuxFormules",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$apprenantVoeuxFormules",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$apprenantsNonContretise",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$apprenantsRetrouves",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          voeuxFormules: "$voeuxFormules.total",
          apprenantVoeuxFormules: "$apprenantVoeuxFormules.total",
          apprenantsRetrouves: "$apprenantsRetrouves.total",
        },
      },
    ])
    .toArray();
  const result = voeuxCount[0];
  return {
    voeuxFormules: result?.voeuxFormules ?? 0,
    apprenantVoeuxFormules: result?.apprenantVoeuxFormules ?? 0,
    apprenantsNonContretise: (result?.apprenantVoeuxFormules ?? 0) - (result?.apprenantsRetrouves ?? 0),
    apprenantsRetrouves: result?.apprenantsRetrouves ?? 0,
  };
};

const AFFELNET_VOEUX_AGGREGATION = [
  {
    $group: {
      _id: "$raw.ine",
      formations: {
        $push: {
          $concat: ["$_computed.formation.libelle", " - ", "$_computed.formation.rncp"],
        },
      },
      count: {
        $sum: 1,
      },
      apprenant: {
        $first: "$$ROOT",
      },
    },
  },
  {
    $lookup: {
      from: "effectifs",
      localField: "apprenant.effectif_id",
      foreignField: "_id",
      as: "effectif",
      pipeline: [
        {
          $project: {
            contrats: 1,
          },
        },
      ],
    },
  },
  {
    $unwind: {
      path: "$effectif",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $lookup: {
      from: "effectifsDECA",
      localField: "apprenant.effectif_deca_id",
      foreignField: "_id",
      as: "effectifDeca",
      pipeline: [
        {
          $project: {
            contrats: 1,
          },
        },
      ],
    },
  },
  {
    $unwind: {
      path: "$effectifDeca",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $project: {
      _id: "$_id",
      ine: "$apprenant.raw.ine",
      nom: "$apprenant.raw.nom",
      prenom_1: "$apprenant.raw.prenom_1",
      prenom_2: "$apprenant.raw.prenom_2",
      prenom_3: "$apprenant.raw.prenom_3",
      adresse_1: "$apprenant.raw.adresse_1",
      adresse_2: "$apprenant.raw.adresse_2",
      adresse_3: "$apprenant.raw.adresse_3",
      adresse_4: "$apprenant.raw.adresse_4",
      code_postal: "$apprenant.raw.code_postal",
      ville: "$apprenant.raw.ville",
      pays: "$apprenant.raw.pays",
      mail_responsable_1: "$apprenant.raw.mail_responsable_1",
      mail_responsable_2: "$apprenant.raw.mail_responsable_2",
      telephone_responsable_1: "$apprenant.raw.telephone_responsable_1",
      telephone_responsable_2: "$apprenant.raw.telephone_responsable_2",
      ville_etab_origine: "$apprenant.raw.ville_etab_origine",
      type_etab_origine: "$apprenant.raw.type_etab_origine",
      libelle_etab_origine: "$apprenant.raw.libelle_etab_origine",
      nombre_voeux: "$count",
      formations_demandees: "$formations",
      uai_etablissement_formateur: "$apprenant.raw.uai_etatblissement_formateur",
      uai_etablissement_responsable: "$apprenant.raw.uai_etablissement_responsable",
      uai_cio_etablissement_accueil: "$apprenant.raw.uai_cio_etab_accueil",
      type_etablissement_accueil: "$apprenant.raw.type_etab_accueil",
      libelle_pulic_etablissement_accueil: "$apprenant.raw.libelle_etab_accueil",
      contrats: "$effectif.contrats",
      contrats_deca: "$effectifDeca.contrats",
    },
  },
  {
    $sort: {
      nom: 1,
      prenom_1: 1,
    },
  },
];

export const getAffelnetVoeuxConcretise = (
  departement: Array<string> | null,
  regions: Array<string> | null,
  year: string
) => {
  const aggreg = [
    {
      $match: {
        ...computeFilter(departement, regions),
        annee_scolaire_rentree: year,
      },
    },
    {
      $match: {
        $or: [{ effectif_id: { $exists: true } }, { effectif_deca_id: { $exists: true } }],
      },
    },
    ...AFFELNET_VOEUX_AGGREGATION,
  ];
  return voeuxAffelnetDb().aggregate(aggreg).toArray();
};

export const getAffelnetVoeuxNonConcretise = (
  departement: Array<string> | null,
  regions: Array<string> | null,
  year: string
) => {
  const aggreg = [
    {
      $match: {
        ...computeFilter(departement, regions),
        annee_scolaire_rentree: year,
      },
    },
    {
      $match: {
        $and: [{ effectif_id: { $exists: false } }, { effectif_deca_id: { $exists: false } }],
      },
    },
    ...AFFELNET_VOEUX_AGGREGATION,
  ];

  return voeuxAffelnetDb().aggregate(aggreg).toArray();
};

export const updateVoeuxAffelnetEffectif = async (
  effectif_id: ObjectId,
  effectif: IEffectif,
  uai: string | undefined | null
) => {
  const { apprenant, annee_scolaire } = effectif;
  const { nom, prenom } = apprenant;
  const filter = {
    "raw.uai_etatblissement_formateur": uai,
    "raw.prenom_1": { $regex: `^${prenom.toLowerCase()}$`, $options: "i" },
    "raw.nom": { $regex: `^${nom.toLowerCase()}$`, $options: "i" },
    annee_scolaire_rentree: annee_scolaire.substring(0, 4),
  };
  const voeux = await voeuxAffelnetDb().find(filter).toArray();
  const voeuxId = voeux.map((v) => v._id);
  if (voeuxId.length) {
    return await voeuxAffelnetDb().updateMany({ _id: { $in: voeuxId } }, { $set: { effectif_id: effectif_id } });
  }
};

export const updateVoeuxAffelnetEffectifDeca = async (
  effectif_id: ObjectId,
  effectif: WithoutId<IEffectifDECA>,
  uai: string | undefined | null
) => {
  const { apprenant, annee_scolaire } = effectif;
  const { nom, prenom } = apprenant;
  const filter = {
    "raw.uai_etatblissement_formateur": uai,
    "raw.prenom_1": { $regex: `^${prenom.toLowerCase()}$`, $options: "i" },
    "raw.nom": { $regex: `^${nom.toLowerCase()}$`, $options: "i" },
    annee_scolaire_rentree: annee_scolaire.substring(0, 4),
  };
  const voeux = await voeuxAffelnetDb().find(filter).toArray();
  const voeuxId = voeux.map((v) => v._id);
  if (voeuxId.length) {
    return await voeuxAffelnetDb().updateMany({ _id: { $in: voeuxId } }, { $set: { effectif_deca_id: effectif_id } });
  }
};
