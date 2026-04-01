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

export const createDernierStatutFieldPipeline = () => [
  {
    $addFields: {
      dernierStatutDureeInDay: {
        $dateDiff: { startDate: "$date_rupture", endDate: new Date(), unit: "day" },
      },
    },
  },
];
