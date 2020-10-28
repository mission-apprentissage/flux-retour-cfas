const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const { StatutCandidat, UserEvent } = require("../../common/model");
const { omit, pick, differenceWith, isEqual } = require("lodash");
const { asyncForEach } = require("../../common/utils/asyncUtils");

runScript(async () => {
  logger.info("Run Ymag Analysis");

  const dataFromUserEvent = await buildDataSentFromUserEvent("2020-10-19T15:05:15.967+0000");
  const statutsData = await StatutCandidat.find({});

  const statutsMapped = statutsData.map((item) =>
    pick(item, [
      "ine_apprenant",
      "nom_apprenant",
      "prenom_apprenant",
      "prenom2_apprenant",
      "prenom3_apprenant",
      "ne_pas_solliciter",
      "email_contact",
      "nom_representant_legal",
      "tel_representant_legal",
      "tel2_representant_legal",
      "id_formation",
      "libelle_court_formation",
      "libelle_long_formation",
      "nom_etablissement",
      "statut_apprenant",
      "uai_etablissement",
    ])
  );

  var diffResult = differenceWith(dataFromUserEvent, statutsMapped, isEqual);

  if (diffResult) {
    await asyncForEach(diffResult, async (diff) => {
      logger.info(JSON.stringify(diff));
    });
  }

  logger.info("End Ymag Analysis");
});

const buildDataSentFromUserEvent = async (stringDate) => {
  var allData = [];

  const afterDate = new Date(stringDate);
  const userEventsAfterDate = await UserEvent.find({ date: { $gte: afterDate } });

  await asyncForEach(userEventsAfterDate, async (currentEvent) => {
    if (currentEvent.data) {
      const arrayData = JSON.parse(currentEvent.data);
      const omittedData = arrayData.map((item) => omit(item, ["date_metier_mise_a_jour_statut"]));
      allData = allData.concat(omittedData);
    }
  });

  return allData;
};
