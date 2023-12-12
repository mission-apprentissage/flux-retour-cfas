import { Db } from "mongodb";

export const up = async (db: Db) => {
  const currentDate = new Date(); // Récupère la date actuelle

  await db.collection("organismes").updateMany(
    {
      api_key: { $exists : true },
      erps: { $exists: true, $not: { $size: 0 } },
      mode_de_transmission: { $exists: false },
      mode_de_transmission_configuration_date: { $exists: false },
      mode_de_transmission_configuration_author_fullname: { $exists: false },
      api_configuration_date: { $exists: false },
    },
    {
      $set: {
        mode_de_transmission: "API",
        mode_de_transmission_configuration_date: currentDate,
        mode_de_transmission_configuration_author_fullname: "migration 2023-12",
        api_configuration_date: currentDate,
      },
    }
  );
};
