const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const { validateAnneeScolaire } = require("../../common/domain/anneeScolaire");
const { dossiersApprenantsDb } = require("../../common/model/collections");

const ANNEE_SCOLAIRE_START_LIMIT = 2021;

runScript(async ({ archiveDossiersApprenants }) => {
  logger.info("Archivage des dossiers apprenants avec année scolaire nulle ou antérieure à 2021");
  const allAnneesScolaires = await dossiersApprenantsDb().distinct("annee_scolaire");
  const anneeScolaireBlacklistValues = allAnneesScolaires.filter((anneeScolaire) => {
    if (validateAnneeScolaire(anneeScolaire).error) return true;

    const anneeScolaireStart = anneeScolaire.split("-")[0];
    if (Number(anneeScolaireStart) < ANNEE_SCOLAIRE_START_LIMIT) return true;

    return false;
  });

  logger.info(
    "Années scolaire trouvées null ou antérieures à 2021:",
    anneeScolaireBlacklistValues.map(String).join(", ")
  );

  const query = { annee_scolaire: { $in: anneeScolaireBlacklistValues } };

  const count = await dossiersApprenantsDb().countDocuments(query);
  logger.info(count, "dossiers apprenants seront archivés");

  const cursor = dossiersApprenantsDb().find(query);
  while (await cursor.hasNext()) {
    const dossierApprenantToArchive = await cursor.next();

    try {
      await archiveDossiersApprenants.create(dossierApprenantToArchive);
      await dossiersApprenantsDb().deleteOne({ _id: dossierApprenantToArchive._id });
    } catch (err) {
      logger.error("Could not archive dossier apprenant with _id", dossierApprenantToArchive._id);
    }
  }
}, "archivage-dossiers-apprenants");
