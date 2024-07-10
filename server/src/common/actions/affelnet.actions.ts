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
              $match: {
                deleted_at: { $exists: true },
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

export const getAffelnetVoeux = (departement: Array<string>, regions: Array<string>) =>
  voeuxAffelnetDb()
    .aggregate([
      {
        $match: {
          ...computeFilter(departement, regions),
          deleted_at: { $exists: true },
        },
      },
      {
        $project: {
          _id: 0,
          nom: "$raw.nom",
          prenom_1: "$raw.prenom_1",
          prenom_2: "$raw.prenom_2",
          prenom_3: "$raw.prenom_3",
          mail_responsable_1: "$raw.mail_responsable_1",
          mail_responsable_2: "$raw.mail_responsable_2",
          telephone_responsable_1: "$raw.telephone_responsable_1",
          telephone_responsable_2: "$raw.telephone_responsable_2",
          ville_etab_origine: "$raw.ville_etab_origine",
          type_etab_origine: "$raw.type_etab_origine",
          libelle_etab_origine: "$raw.libelle_etab_origine",
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
