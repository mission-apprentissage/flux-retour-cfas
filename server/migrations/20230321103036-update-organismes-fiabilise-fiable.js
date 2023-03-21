export const up = async (db) => {
  await db
    .collection("organismes")
    .updateMany({ fiabilisation_statut: "FIABILISE" }, { $set: { fiabilisation_statut: "FIABLE" } });
};

export const down = async () => {};
