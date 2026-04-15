import { CFA_COLLAB_STATUS } from "shared/models/routes/organismes/cfa";

export const DATE_START_RUPTURES = new Date("2025-01-01");

export const buildEffRuptureAgeFilter = () => {
  const now = new Date();
  return [
    {
      $match: {
        $or: [
          {
            "effectif_snapshot.apprenant.date_de_naissance": {
              $gte: new Date(new Date(now).setFullYear(now.getFullYear() - 26)),
            },
          },
          { "effectif_snapshot.apprenant.rqth": true },
        ],
        soft_deleted: { $ne: true },
        "effectif_snapshot.apprenant.date_de_naissance": {
          $lte: new Date(new Date(now).setFullYear(now.getFullYear() - 16)),
        },
      },
    },
  ];
};

/**
 * Build a MongoDB $switch expression for CFA collaboration status.
 * @param docPrefix - prefix for field access (e.g. "$ml_doc" for a lookup result). Omit for direct fields.
 */
export function buildCollabStatusSwitch(docPrefix?: string) {
  const f = (field: string) => (docPrefix ? `${docPrefix}.${field}` : `$${field}`);
  return {
    $switch: {
      branches: [
        {
          case: {
            $and: [
              { $ne: [{ $ifNull: [f("situation"), null] }, null] },
              { $ne: [f("situation"), "CONTACTE_SANS_RETOUR"] },
            ],
          },
          then: CFA_COLLAB_STATUS.TRAITE_PAR_ML,
        },
        {
          case: { $eq: [f("situation"), "CONTACTE_SANS_RETOUR"] },
          then: CFA_COLLAB_STATUS.CONTACTE_PAR_ML,
        },
        {
          case: { $eq: [f("organisme_data.acc_conjoint"), true] },
          then: CFA_COLLAB_STATUS.COLLAB_DEMANDEE,
        },
      ],
      default: CFA_COLLAB_STATUS.DEMARRER_COLLAB,
    },
  };
}

export const createDernierStatutFieldPipeline = () => [
  {
    $addFields: {
      dernierStatutDureeInDay: {
        $dateDiff: { startDate: "$date_rupture", endDate: "$$NOW", unit: "day" },
      },
    },
  },
];
