/* use date_metier_mise_a_jour_statut for date_statut of first element in historique_statut_apprenant */

module.exports = {
  async up(db) {
    const collection = db.collection("statutsCandidats");

    // match all documents whose date_metier_mise_a_jour_statut is before the first element date in historique_statut_apprenant
    const cursor = await collection.aggregate([
      { $match: { date_metier_mise_a_jour_statut: { $ne: null } } },
      { $addFields: { histo1: { $arrayElemAt: ["$historique_statut_apprenant", 0] } } },
      { $match: { $expr: { $lt: ["$date_metier_mise_a_jour_statut", "$histo1.date_statut"] } } },
    ]);

    while (await cursor.hasNext()) {
      const document = await cursor.next();

      await collection.findOneAndUpdate(
        { _id: document._id },
        {
          $set: {
            "historique_statut_apprenant.0.date_statut": document.date_metier_mise_a_jour_statut,
          },
        }
      );
    }
  },

  async down() {},
};
