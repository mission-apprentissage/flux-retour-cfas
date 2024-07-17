import { voeuxAffelnetDb } from "../model/collections";

const computeFilter = (departement: Array<string>, region: Array<string>) => {
  return {
    ...(departement ? { "_computed.organisme.departement": { $in: departement } } : {}),
    ...(region ? { "_computed.organisme.region": { $in: region } } : {}),
  };
};

// Write indexes for this
export const getAffelnetCountVoeuxNational = async (departement: Array<string>, regions: Array<string>) => {
  const voeuxCount = await voeuxAffelnetDb()
    .aggregate([
      {
        $match: {
          ...computeFilter(departement, regions),
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
        $project: {
          voeuxFormules: "$voeuxFormules.total",
          apprenantVoeuxFormules: "$apprenantVoeuxFormules.total",
          apprenantsNonContretise: "$apprenantsNonContretise.total",
        },
      },
    ])
    .toArray();
  const result = voeuxCount[0];
  return {
    voeuxFormules: result?.voeuxFormules ?? 0,
    apprenantVoeuxFormules: result?.apprenantVoeuxFormules ?? 0,
    apprenantsNonContretise: result?.apprenantsNonContretise ?? 0,
  };
};

export const getAffelnetVoeuxNonConcretise = (departement: Array<string>, regions: Array<string>) =>
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
