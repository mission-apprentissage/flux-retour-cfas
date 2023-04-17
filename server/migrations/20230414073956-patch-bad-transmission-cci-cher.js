export const up = async (db) => {
  const cleanOrganisme = await db.collection("organismes").findOne({ uai: "0180865T", siret: "18180001200021" });
  const toRemoveOrganisme = await db.collection("organismes").findOne({ uai: "0180865T", siret: "53825807000019" });

  if (cleanOrganisme && toRemoveOrganisme) {
    await db
      .collection("effectifs")
      .updateMany({ organisme_id: toRemoveOrganisme._id }, { $set: { organisme_id: cleanOrganisme._id } });
    await db.collection("organismes").deleteOne({ uai: "0180865T", siret: "53825807000019" });
  }
};

export const down = async () => {};
