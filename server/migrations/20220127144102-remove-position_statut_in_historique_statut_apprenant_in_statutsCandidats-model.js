const omit = require("lodash.omit");

module.exports = {
  async up(db) {
    const collection = db.collection("statutsCandidats");
    const cursor = collection.find();

    while (await cursor.hasNext()) {
      const document = await cursor.next();
      const historiqueWithoutPositionStatut = document.historique_statut_apprenant.map((historiqueElem) => {
        return omit(historiqueElem, "position_statut");
      });

      await collection.findOneAndUpdate(
        { _id: document._id },
        { $set: { historique_statut_apprenant: historiqueWithoutPositionStatut } }
      );
    }
  },

  async down(db) {
    const collection = db.collection("statutsCandidats");
    const cursor = collection.find();

    while (await cursor.hasNext()) {
      const document = await cursor.next();
      const historiqueWithPositionStatut = document.historique_statut_apprenant.map((historiqueElem, index) => {
        return { ...historiqueElem, position_statut: index + 1 };
      });

      await collection.findOneAndUpdate(
        { _id: document._id },
        { $set: { historique_statut_apprenant: historiqueWithPositionStatut } }
      );
    }
  },
};
