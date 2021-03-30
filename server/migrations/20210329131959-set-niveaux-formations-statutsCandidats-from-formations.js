module.exports = {
  async up(db) {
    // Match all formations with niveau & cfd
    const formationsCollection = db.collection("formations");
    const formationsWithNiveauAndCfdCursor = formationsCollection.find({ niveau: { $ne: "" }, cfd: { $ne: "" } });

    while (await formationsWithNiveauAndCfdCursor.hasNext()) {
      const currentFormationDocument = await formationsWithNiveauAndCfdCursor.next();

      // Find all statutsCandidats for this formation
      const statutsCandidatsCollection = db.collection("statutsCandidats");
      const statutsForFormationCursor = statutsCandidatsCollection.find({ id_formation: currentFormationDocument.cfd });

      while (await statutsForFormationCursor.hasNext()) {
        const currentStatutDocument = await statutsForFormationCursor.next();

        // Update current statut with this current formation niveau
        await statutsCandidatsCollection.findOneAndUpdate(
          { _id: currentStatutDocument._id },
          { $set: { niveau_formation: currentFormationDocument.niveau } }
        );
      }
    }
  },

  async down() {},
};
