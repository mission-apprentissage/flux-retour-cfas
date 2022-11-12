import { flattenHistoriqueStatutApprenant } from "../src/common/utils/flattenHistoriqueStatutApprenant.js";

/* will flatten the historique_statut_apprenant in documents from collection statutsCandidats so we only keep history of changes */
/*
  Un historique ayant pour valeur :
    [
      {
        valeur_statut: 3,
        date_statut: "2020-11-01T06:37:01.881Z",
      },
      {
        valeur_statut: 3,
        date_statut: "2020-11-02T06:42:26.907Z",
      },
      {
        valeur_statut: 3,
        date_statut: "2020-11-03T06:42:00.547Z",
      },
      {
        valeur_statut: 1,
        date_statut: "2020-11-03T06:42:00.547Z",
      },
    ]

    deviendra

    [
      {
        valeur_statut: 3,
        date_statut: "2020-11-01T06:37:01.881Z",
      },
      {
        valeur_statut: 1,
        date_statut: "2020-11-03T06:42:00.547Z",
      },
    ]
*/

export const up = async (db) => {
  // find statuts with an historique_statut_apprenant of size > 1
  const collection = db.collection("statutsCandidats");
  const cursor = collection.find(
    { "historique_statut_apprenant.1": { $exists: true } },
    { _id: 1, historique_statut_apprenant: 1 }
  );
  while (await cursor.hasNext()) {
    const document = await cursor.next();
    const flattendHistorique = flattenHistoriqueStatutApprenant(document.historique_statut_apprenant);
    await collection.findOneAndUpdate(
      { _id: document._id },
      { $set: { historique_statut_apprenant: flattendHistorique } }
    );
  }
};

export const down = async () => {};
