import { Db, MongoClient } from "mongodb";

export const up = async (db: Db, _client: MongoClient) => {
  // cette migration corrige les utilisateurs et permissions invalides
  // qui possède un main_organisme différent de celui retrouvé via le siret
  const users = await db
    .collection("usersMigration")
    .aggregate([
      {
        $match: {
          main_organisme_id: { $exists: true },
          uai: { $exists: false },
        },
      },
      {
        $lookup: {
          from: "organismes",
          localField: "main_organisme_id",
          foreignField: "_id",
          as: "main_organisme",
          pipeline: [{ $project: { uai: 1, siret: 1 } }],
        },
      },
      { $unwind: { path: "$main_organisme", preserveNullAndEmptyArrays: true } },
      { $match: { $expr: { $not: { $eq: ["$siret", "$main_organisme.siret"] } } } },
    ])
    .toArray();

  await Promise.all(
    users.map(async (user) => {
      console.info(
        `Correction utilisateur ${user._id}, main_organisme.siret=${user.main_organisme?.siret} => siret=${user.siret}`
      );
      const organisme = await db.collection("organismes").findOne({
        siret: user.siret,
      });
      if (!organisme) {
        console.info(`Organisme non trouvé pour le siret ${user.siret}`);
        return;
      }

      await db.collection("usersMigration").updateOne(
        {
          _id: user._id,
        },
        {
          $set: {
            main_organisme_id: organisme._id,
          },
        },
        { bypassDocumentValidation: true }
      );

      // si après étape de demande des permissions
      if (user.main_organisme_id) {
        await db.collection("permissions").updateOne(
          {
            userEmail: user.email,
            organisme_id: user.main_organisme_id,
          },
          {
            $set: {
              organisme_id: organisme._id,
            },
          },
          { bypassDocumentValidation: true }
        );
      }
    })
  );
};
