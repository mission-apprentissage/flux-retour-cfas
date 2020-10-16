const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const dsFetcher = require("../../common/dsFetcher");
const { getUser, updateContactAttributes } = require("../../common/utils/sendinblueUtils");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const config = require("config");

runScript(async () => {
  logger.info("Updating Sendinblue Contacts from DS 2020");

  dsFetcher.config({
    id: config.demarchesSimplifiees.procedureCfas2020Id,
    token: config.demarchesSimplifiees.apiToken,
  });

  const emailsDossiersDs = await getDossiersEmails();
  const uniqueEmailsDossiersDs = [...new Set(emailsDossiersDs)];
  logger.info(`DS ${uniqueEmailsDossiersDs.length} emails uniques trouvés`);

  var nbUpdated = 0;

  // Parse SB List contact
  await asyncForEach(uniqueEmailsDossiersDs, async (emailInDs) => {
    const contactFromSib = await getUser(emailInDs);
    if (contactFromSib) {
      await updateContactAttributes(emailInDs, {
        listIds: [config.sendinblue.idListCfas],
        attributes: {
          DS_PROCEDURE_CFAS_2020_INITIATED: true,
        },
      });
      nbUpdated++;
      logger.info(`Contact ${emailInDs} updated in Sendinblue`);
    }
  });

  logger.info(`Successfully updated ${nbUpdated} contacts from DS 2020 to Sendinblue !`);
});

const getDossiersEmails = async () => {
  const dossierEmails = [];

  // Get dossiers from DsFetcher Api
  var dossiers = await dsFetcher.getDossiers();
  await asyncForEach(dossiers, async (currentDossier) => {
    const detailDossier = await dsFetcher.getDossier(currentDossier.id);
    if (detailDossier) {
      if (detailDossier.dossier) {
        if (detailDossier.dossier.email) {
          dossierEmails.push(detailDossier.dossier.email);
        }
      }
    }
  });

  return dossierEmails;
};
