import { archiveDossiersApprenantsDb } from "../../model/collections.js";

// TODO A supprimer
export const createArchiveDossiersApprenants = async (dossierApprenantData) => {
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

  await archiveDossiersApprenantsDb().insertOne({
    created_at: new Date(),
    data: anonymizedData,
  });
};
