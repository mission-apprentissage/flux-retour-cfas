const COLLECTION_NAME = "archiveDossiersApprenants";

module.exports = ({ db }) => ({
  async create(dossierApprenantData) {
    const anonymousValue = `XXXXX`;
    const anonymizedData = {
      ...dossierApprenantData,
      nom_apprenant: anonymousValue,
      prenom_apprenant: anonymousValue,
      email_contact: anonymousValue,
      ine_apprenant: anonymousValue,
      tel_apprenant: anonymousValue,
      code_commune_insee_apprenant: anonymousValue,
      date_de_naissance_apprenant: anonymousValue,
    };
    delete anonymizedData._id;

    await db.collection(COLLECTION_NAME).insertOne({
      created_at: new Date(),
      data: anonymizedData,
    });
  },
});
