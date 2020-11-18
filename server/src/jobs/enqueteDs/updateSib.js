const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const { getUser, updateContactAttributes } = require("../../common/utils/sendinblueUtils");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const config = require("config");
const { DsDossier } = require("../../common/model");

runScript(async () => {
  logger.info("MAJ des contacts Sendinblue depuis DS");
  await updateSibAttributesForDsErps();
  logger.info("Fin de la MAJ des contacts Sendinblue depuis DS");
});

const updateSibAttributesForDsErps = async () => {
  const emailsDossiersDs = (await DsDossier.find({}).select("dossier")).map((item) => item._doc.dossier.email);
  const uniqueEmailsDossiersDs = [...new Set(emailsDossiersDs)];
  logger.info(`DS ${uniqueEmailsDossiersDs.length} emails uniques trouvés`);

  var nbUpdated = 0;

  // Parse SB List contact
  await asyncForEach(uniqueEmailsDossiersDs, async (emailInDs) => {
    const contactFromSib = await getUser(emailInDs);

    if (contactFromSib) {
      const erpsForEmail = (await DsDossier.find({ "dossier.email": `${emailInDs}` })).map(
        (item) => item._doc.dossier.questions.erpNom
      );
      const uniqueErpsNames = erpsForEmail.length > 0 ? [...new Set(erpsForEmail)] : [];

      await updateContactAttributes(emailInDs, {
        listIds: [config.sendinblue.idListCfas],
        attributes: getSibUpdateAttributes(uniqueErpsNames),
      });
      nbUpdated++;

      if (uniqueErpsNames.length > 0) {
        logger.info(`Contact ${emailInDs} mis à jour dans Sendinblue avec ERPs : ${uniqueErpsNames[0]}`);
      } else {
        logger.info(`Contact ${emailInDs} mis à jour dans Sendinblue sans ERPs`);
      }
    }
  });

  logger.info(`${nbUpdated} Contacts mis à jour dans Sendinblue !`);
};

const getSibUpdateAttributes = (uniqueErpsNames) => {
  const attributes = {
    DS_PROCEDURE_CFAS_2020_INITIATED: true,
    DS_PROCEDURE_CFAS_2020_ERP_NAME: `${uniqueErpsNames.length > 0 ? uniqueErpsNames[0] : "-"}`,
  };

  return attributes;
};
