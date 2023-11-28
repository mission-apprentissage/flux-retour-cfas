import { Db } from "mongodb";

export const up = async (db: Db) => {
  await db
    .collection("effectifs")
    .updateMany({}, { $unset: { "_computed.organisme.enseigne": "", "_computed.organisme.raison_sociale": "" } });
};
