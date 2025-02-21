import { Db } from "mongodb";

export const up = async (db: Db) => {
  db.collection("organismes").updateMany(
    {},
    {
      $unset: {
        access_token: "",
      },
    }
  );
};
