const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const { simpleStatut } = require("../../../tests/data/sample");

runScript(async ({ statutsCandidats }) => {
  logger.info("Run Tests");

  const toAdd = simpleStatut;
  await statutsCandidats.addOrUpdateStatuts([toAdd]);
  const history = await statutsCandidats.getStatutHistory({
    ine_apprenant: toAdd.ine_apprenant,
    nom_apprenant: toAdd.nom_apprenant,
    prenom_apprenant: toAdd.prenom_apprenant,
    prenom2_apprenant: toAdd.prenom2_apprenant,
    prenom3_apprenant: toAdd.prenom3_apprenant,
    email_contact: toAdd.email_contact,
    id_formation: toAdd.id_formation,
    uai_etablissement: toAdd.uai_etablissement,
  });
  logger.info(history);

  const updatedStatut = { ...toAdd, ...{ statut_apprenant: 4 } };
  await statutsCandidats.addOrUpdateStatuts([updatedStatut]);
  const updatedHistory = await statutsCandidats.getStatutHistory({
    ine_apprenant: updatedStatut.ine_apprenant,
    nom_apprenant: updatedStatut.nom_apprenant,
    prenom_apprenant: updatedStatut.prenom_apprenant,
    prenom2_apprenant: updatedStatut.prenom2_apprenant,
    prenom3_apprenant: updatedStatut.prenom3_apprenant,
    email_contact: updatedStatut.email_contact,
    id_formation: updatedStatut.id_formation,
    uai_etablissement: updatedStatut.uai_etablissement,
  });
  const first = updatedHistory[0];
  logger.info(first._doc);
});
