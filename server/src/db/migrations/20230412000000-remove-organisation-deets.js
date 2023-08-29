export const up = async (/** @type {import('mongodb').Db} */ db) => {
  // migre les organisations DEETS en DREETS, qui regroupe DREETS, DRIEETS, DR

  const organisationsDEETS = await db
    .collection("organisations")
    .find({
      type: "DEETS",
    })
    .toArray();

  for (const organisationDEETS of organisationsDEETS) {
    console.info(`migration DEETS ${organisationDEETS.code_region} => DREETS ${organisationDEETS.code_region}`);

    let organisationDREETS = await db.collection("organisations").findOne({
      type: "DREETS",
      code_region: organisationDEETS.code_region,
    });
    if (!organisationDREETS) {
      console.info(`- création DREETS ${organisationDEETS.code_region}`);
      const { insertedId } = await db.collection("organisations").insertOne({
        type: "DREETS",
        code_region: organisationDEETS.code_region,
        created_at: new Date(),
      });
      organisationDREETS = { _id: insertedId };
    }

    const res = await db.collection("usersMigration").updateMany(
      {
        organisation_id: organisationDEETS._id,
      },
      {
        $set: {
          organisation_id: organisationDREETS._id,
        },
      }
    );
    console.info(`- ${res.modifiedCount} utilisateurs migrés`);

    await db.collection("organisations").deleteOne({
      _id: organisationDEETS._id,
    });
  }
};
