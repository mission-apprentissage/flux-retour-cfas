export const up = async (/** @type {import('mongodb').Db} */ db) => {
  // migre les organisations DEETS en DREETS, qui regroupe DREETS, DRIEETS, DR

  const organisationsDEETS = await db
    .collection("organisations")
    .find({
      type: "DEETS",
    })
    .toArray();

  for (const organisationDEETS of organisationsDEETS) {
    console.log(`migration DEETS ${organisationDEETS.code_region} => DREETS ${organisationDEETS.code_region}`);

    let organisationDREETS = await db
      .collection("organisations")
      .find({
        type: "DREETS",
        code_region: organisationDEETS.code_region,
      })
      .next();
    if (!organisationDREETS) {
      console.log(`- création DREETS ${organisationDEETS.code_region}`);
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
    console.log(`- ${res.modifiedCount} utilisateurs migrés`);

    await db.collection("organisations").deleteOne({
      _id: organisationDEETS._id,
    });
  }
};
