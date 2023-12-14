import { Db } from "mongodb";

// On a parfois des doublons dans le champ erps des organismes
// Source : https://tableaudebord-apprentissage.atlassian.net/browse/TM-561
export const up = async (db: Db) => {
  const organismes = await db.collection("organismes").find().toArray();
  for (const organisme of organismes) {
    const uniqueErps = [...new Set(organisme.erps.map((item) => item.toLowerCase()))];
    if (uniqueErps.length !== organisme.erps.length) {
      await db.collection("organismes").updateOne({ _id: organisme._id }, { $set: { erps: uniqueErps } });
    }
  }
};
