import { Db, MongoClient } from "mongodb";

export const up = async (db: Db, _client: MongoClient) => {
  // also define is_cross_organismes to true when is_admin is true
  await db.collection("usersMigration").updateMany(
    {
      is_admin: true,
      is_cross_organismes: false,
    },
    {
      $set: {
        is_cross_organismes: true,
      },
    }
  );

  // add a permission entry for admin users without one
  const usersWithoutPermissions = await db
    .collection("usersMigration")
    .aggregate([
      {
        $match: {
          is_admin: true,
        },
      },
      {
        $lookup: {
          from: "permissions",
          localField: "email",
          foreignField: "userEmail",
          as: "permissions",
        },
      },
      {
        $match: {
          "permissions.0": { $exists: false },
        },
      },
    ])
    .toArray();

  const adminRole = await db.collection("roles").findOne({ name: "organisme.admin" });

  if (usersWithoutPermissions.length > 0) {
    await db.collection("permissions").insertMany(
      usersWithoutPermissions.map((user) => ({
        created_at: new Date(),
        updated_at: new Date(),
        role: adminRole?._id,
        organisme_id: null,
        userEmail: user.email,
        pending: false,
      }))
    );
  }
};

export const down = async () => {};
