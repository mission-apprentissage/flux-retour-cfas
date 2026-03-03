import { STATUT_APPRENANT } from "shared/constants";

export const DATE_START_RUPTURES = new Date("2025-01-01");

export const EFF_RUPTURE_AGE_FILTER = [
  {
    $match: {
      $or: [
        {
          "effectif_snapshot.apprenant.date_de_naissance": {
            $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 26)),
          },
        },
        { "effectif_snapshot.apprenant.rqth": true },
      ],
      soft_deleted: { $ne: true },
      "effectif_snapshot.apprenant.date_de_naissance": {
        $lte: new Date(new Date().setFullYear(new Date().getFullYear() - 16)),
      },
    },
  },
];

export const createDernierStatutFieldPipeline = () => [
  {
    $addFields: {
      dernierStatutDureeInDay: {
        $dateDiff: { startDate: "$date_rupture", endDate: new Date(), unit: "day" },
      },
    },
  },
];

export const matchDernierStatutRupturantPipeline = (): any => {
  return {
    $match: {
      "effectif_snapshot._computed.statut.en_cours": STATUT_APPRENANT.RUPTURANT,
      date_rupture: { $lte: new Date() },
    },
  };
};
