import { updateMissionLocaleAdresseFromExternalData } from "@/jobs/hydrate/mission-locale/hydrate-mission-locale";

export const up = async () => {
  await updateMissionLocaleAdresseFromExternalData([
    {
      ml_id: 3,
      corrected_cp: "13090",
    },
    {
      ml_id: 17,
      corrected_cp: "80000",
    },
    {
      ml_id: 326,
      corrected_cp: "59600",
    },
    {
      ml_id: 286,
      corrected_cp: "62800",
    },
    {
      ml_id: 43,
      corrected_cp: "56400",
    },
    {
      ml_id: 45,
      corrected_cp: "71400",
    },
    {
      ml_id: 52,
      corrected_cp: "30200",
    },
    {
      ml_id: 62,
      corrected_cp: "30300",
    },
    {
      ml_id: 67,
      corrected_cp: "60000",
    },
    {
      ml_id: 72,
      corrected_cp: "25000",
    },
    {
      ml_id: 74,
      corrected_cp: "34500",
    },
    {
      ml_id: 84,
      corrected_cp: "92100",
    },
    {
      ml_id: 91,
      corrected_cp: "29200",
    },
    {
      ml_id: 101,
      corrected_cp: "62100",
    },
    {
      ml_id: 102,
      corrected_cp: "59400",
    },
    {
      ml_id: 108,
      corrected_cp: "97300",
    },
    {
      ml_id: 109,
      corrected_cp: "33150",
    },
    {
      ml_id: 110,
      corrected_cp: "95000",
    },
    {
      ml_id: 138,
      corrected_cp: "63100",
    },
    {
      ml_id: 161,
      corrected_cp: "26400",
    },
    {
      ml_id: 169,
      corrected_cp: "76200",
    },
    {
      ml_id: 180,
      corrected_cp: "59140",
    },
    {
      ml_id: 204,
      corrected_cp: "35300",
    },
    {
      ml_id: 255,
      corrected_cp: "52200",
    },
    {
      ml_id: 256,
      corrected_cp: "22300",
    },
    {
      ml_id: 322,
      corrected_cp: "59130",
    },
    {
      ml_id: 330,
      corrected_cp: "77100",
    },
    {
      ml_id: 333,
      corrected_cp: "77000",
    },
    {
      ml_id: 348,
      corrected_cp: "25200",
    },
    {
      ml_id: 350,
      corrected_cp: "26200",
    },
    {
      ml_id: 370,
      corrected_cp: "54000",
    },
    {
      ml_id: 377,
      corrected_cp: "06000",
    },
    {
      ml_id: 378,
      corrected_cp: "30000",
    },
    {
      ml_id: 408,
      corrected_cp: "56800",
    },
    {
      ml_id: 421,
      corrected_cp: "35600",
    },
    {
      ml_id: 425,
      corrected_cp: "35000",
    },
    {
      ml_id: 432,
      corrected_cp: "17300",
    },
    {
      ml_id: 436,
      corrected_cp: "10100",
    },
    {
      ml_id: 439,
      corrected_cp: "29270",
    },
    {
      ml_id: 441,
      corrected_cp: "76000",
    },
    {
      ml_id: 452,
      corrected_cp: "22000",
    },
    {
      ml_id: 474,
      corrected_cp: "38160",
    },
    {
      ml_id: 479,
      corrected_cp: "44600",
    },
    {
      ml_id: 480,
      corrected_cp: "62500",
    },
    {
      ml_id: 489,
      corrected_cp: "17100",
    },
    {
      ml_id: 496,
      corrected_cp: "49400",
    },
    {
      ml_id: 521,
      corrected_cp: "74200",
    },
    {
      ml_id: 536,
      corrected_cp: "19000",
    },
    {
      ml_id: 540,
      corrected_cp: "26000",
    },
    {
      ml_id: 543,
      corrected_cp: "56000",
    },
    {
      ml_id: 568,
      corrected_cp: "51300",
    },
    {
      ml_id: 572,
      corrected_cp: "38500",
    },
  ]);
};
