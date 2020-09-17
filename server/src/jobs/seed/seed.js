const logger = require("../../common/logger");
const { SampleEntity } = require("../../common/model");

module.exports = async (db) => {
  const sampleToAdd = new SampleEntity({
    id: "1",
    nom: "Test Sample",
    valeur: "Valeur exemple",
  });
  await sampleToAdd.save();
  logger.info(
    `Sample '${sampleToAdd.id}' / '${sampleToAdd.nom}' / '${sampleToAdd.valeur}' successfully added in db ${db.name}`
  );
};
