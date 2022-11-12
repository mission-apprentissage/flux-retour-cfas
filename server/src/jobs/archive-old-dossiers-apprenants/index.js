import { runScript } from '../scriptWrapper';
import logger from '../../common/logger';
import { validateAnneeScolaire } from '../../common/domain/anneeScolaire';

const ANNEE_SCOLAIRE_START_LIMIT = 2021;

runScript(async ({ db, archiveDossiersApprenants }) => {
  const collection = db.collection("dossiersApprenants");
  logger.info("Archivage des dossiers apprenants avec année scolaire nulle ou antérieure à 2021");
  const allAnneesScolaires = await collection.distinct("annee_scolaire");
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

  const count = await collection.countDocuments(query);
  logger.info(count, "dossiers apprenants seront archivés");

  const cursor = collection.find(query);
  while (await cursor.hasNext()) {
    const dossierApprenantToArchive = await cursor.next();

    try {
      await archiveDossiersApprenants.create(dossierApprenantToArchive);
      await collection.deleteOne({ _id: dossierApprenantToArchive._id });
    } catch (err) {
      logger.error("Could not archive dossier apprenant with _id", dossierApprenantToArchive._id);
    }
  }
}, "archivage-dossiers-apprenants");
