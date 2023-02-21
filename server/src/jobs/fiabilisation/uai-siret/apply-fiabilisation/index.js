import { PromisePool } from "@supercharge/promise-pool/dist/promise-pool.js";
import { createJobEvent } from "../../../../common/actions/jobEvents.actions.js";
import {
  STATUT_FIABILISATION_COUPLES_UAI_SIRET,
  STATUT_FIABILISATION_ORGANISME,
} from "../../../../common/constants/fiabilisationConstants.js";
import logger from "../../../../common/logger.js";
import {
  dossiersApprenantsMigrationDb,
  fiabilisationUaiSiretDb,
  organismesDb,
} from "../../../../common/model/collections.js";

const JOB_NAME = "apply-fiabilisation-uai-siret";

const filters = {
  annee_scolaire: { $in: ["2022-2022", "2022-2023", "2023-2023"] },
};

let nbOrganismesFiables = 0;
let nbOrganismesFiabilises = 0;
let nbDossiersApprenantsFiabilises = 0;
let nbOrganismesNonFiabilisablesMapping = 0;
let nbOrganismesNonFiabilisablesUaiNonValidees = 0;

/**
 * Méthode d'application de la fiabilisation pour les 3 cas :
 *  Données à fiabiliser (depuis les couples construits) : MAJ des dossiersApprenantsMigration ainsi que le champ fiabilisation_statut des organismes concernés
 *  Données déja identifiées comme fiables : MAJ le champ fiabilisation_statut des organismes concernés
 *  Données identifiées comme non fiabilisables : MAJ le champ fiabilisation_statut des organismes concernés
 *
 */
export const applyFiabilisationUaiSiret = async () => {
  await createJobEvent({
    jobname: JOB_NAME,
    date: new Date(),
    action: "beginning",
  });

  // Reset des statuts de fiabilisation des organismes
  await resetStatutFiabilisation();

  // Traitement // de l'identification des différents statuts de fiabilisation
  await Promise.all([
    updateOrganismesFiables(),
    updateDossiersApprenantAndOrganismesFiabilise(),
    updateOrganismesNonFiabilisablesMapping(),
    updateOrganismesNonFiabilisablesUaiNonValidees(),
  ]);

  // Log
  logger.info(nbOrganismesFiables, "organismes mis à jour en tant que fiables");
  logger.info(nbDossiersApprenantsFiabilises, "dossiers apprenants mis à jour en tant que fiabilisés");
  logger.info(nbOrganismesFiabilises, "organismes mis à jour en tant que fiabilisés");
  logger.info(nbOrganismesNonFiabilisablesMapping, "organismes mis à jour en tant que non fiabilisables (mapping)");
  logger.info(
    nbOrganismesNonFiabilisablesUaiNonValidees,
    "organismes mis à jour en tant que non fiabilisables (uai non validée dans le référentiel)"
  );

  await createJobEvent({
    jobname: JOB_NAME,
    date: new Date(),
    action: "finishing",
    data: {
      nbOrganismesFiables,
      nbDossiersApprenantsFiabilises,
      nbOrganismesFiabilises,
      nbOrganismesNonFiabilisablesMapping,
      nbOrganismesNonFiabilisablesUaiNonValidees,
    },
  });
};

/**
 * On marque par défaut le statut de fiabilisation des organismes comme étant INCONNU
 */
const resetStatutFiabilisation = async () =>
  await organismesDb().updateMany(
    { siret: { $exists: true } },
    { $set: { fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.INCONNU } }
  );

/**
 * Méthode maj des statuts de fiabilisation à FIABLE pour les organismes avec UAI & présents dans le référentiel
 */
const updateOrganismesFiables = async () => {
  logger.info("Identification des organismes fiables ...");

  const { modifiedCount } = await organismesDb().updateMany(
    { uai: { $exists: true }, est_dans_le_referentiel: true },
    { $set: { fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.FIABLE } }
  );
  nbOrganismesFiables += modifiedCount;
};

/**
 * Méthode de MAJ des organismes et dossiersApprenantsMigration pour les cas ou l'on bien fiabilisé la donnée
 */
const updateDossiersApprenantAndOrganismesFiabilise = async () => {
  logger.info("Identification des dossiersApprenants et organismes fiabilisés ...");
  const couplesAFiabiliser = await fiabilisationUaiSiretDb()
    .find({ type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER })
    .toArray();

  await PromisePool.for(couplesAFiabiliser).process(updateOrganismeAndDossiersApprenantForCoupleFiabilise);
};

/**
 * Méthode de MAJ unitaire d'un organisme et de ses dossiersApprenantsMigration pour les cas ou l'on bien fiabilisé la donnée
 * Pour chaque couple identifié on va mettre à jour les dossiers apprenants (uai et siret)
 * Ensuite on va mettre à jour l'organisme en question comme étant FIABILISE
 * @param {*} currentFiabilisationCouple
 */
const updateOrganismeAndDossiersApprenantForCoupleFiabilise = async ({ uai, uai_fiable, siret, siret_fiable }) => {
  // Update de tous les dossiersApprenantsMigration qui étaient sur le mauvais couple UAI-SIRET
  const dossiersApprenantsMigrationForFiabilisationCouple = await dossiersApprenantsMigrationDb()
    .find({ ...filters, uai_etablissement: uai, siret_etablissement: siret })
    .toArray();

  // Update via For Of pour limiter les appels //
  for (const currentDossierToUpdate of dossiersApprenantsMigrationForFiabilisationCouple) {
    await updateDossierApprenantMigrationForUaiSiretFiable(currentDossierToUpdate, uai_fiable, siret_fiable);
  }

  // Update de l'organisme lié à un couple UAI-SIRET marqué comme A_FIABILISER en FIABILISE
  const { modifiedCount: organismesModifiedCount } = await organismesDb().updateOne(
    { uai: uai_fiable, siret: siret_fiable },
    { $set: { fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.FIABILISE } }
  );
  nbOrganismesFiabilises += organismesModifiedCount;
};

/**
 * Méthode de maj unitaire d'un dossier apprenant avec un couple uai siret fiable
 * @param {*} currentDossierApprenantToUpdate
 * @param {*} uai_fiable
 * @param {*} siret_fiable
 */
const updateDossierApprenantMigrationForUaiSiretFiable = async (
  currentDossierApprenantToUpdate,
  uai_fiable,
  siret_fiable
) => {
  // Si aucun dossierApprenant en doublon (via index id_erp_apprenant/uai_etablissement/annee_scolaire) on fait la MAJ
  const countDossierApprenantForUaiSiretFiable = await dossiersApprenantsMigrationDb().countDocuments({
    id_erp_apprenant: currentDossierApprenantToUpdate.id_erp_apprenant,
    uai_etablissement: uai_fiable,
    siret_etablissement: siret_fiable,
    annee_scolaire: currentDossierApprenantToUpdate.annee_scolaire,
  });

  if (countDossierApprenantForUaiSiretFiable === 0) {
    await dossiersApprenantsMigrationDb().updateOne(
      { _id: currentDossierApprenantToUpdate._id },
      { $set: { uai_etablissement: uai_fiable, siret_etablissement: siret_fiable } }
    );
    nbDossiersApprenantsFiabilises++;
  }
};

/**
 * Méthode de MAJ de tous les couples non fiabilisable en utilisant le mapping >> NON_FIABILISABLE_MAPPING
 */
const updateOrganismesNonFiabilisablesMapping = async () => {
  logger.info("Identification des organismes non fiabilisables via mapping ...");

  const couplesNonFiabilisablesMapping = await fiabilisationUaiSiretDb()
    .find({ type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_MAPPING })
    .toArray();

  await PromisePool.for(couplesNonFiabilisablesMapping).process(updateOrganismeForCurrentCoupleNonFiabilisableMapping);
};

/**
 * Méthode de MAJ unitaire d'un organisme comme étant non fiabilisable en utilisant le mapping >> NON_FIABILISABLE_MAPPING
 * @param {*} currentFiabilisationCouple
 */
const updateOrganismeForCurrentCoupleNonFiabilisableMapping = async (currentFiabilisationCouple) => {
  const { modifiedCount } = await organismesDb().updateMany(
    { uai: currentFiabilisationCouple.uai, siret: currentFiabilisationCouple.siret },
    { $set: { fiabilisation_statut: STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_MAPPING } }
  );
  nbOrganismesNonFiabilisablesMapping += modifiedCount;
};

/**
 * Méthode de MAJ de tous les organismes non fiabilisables car présents dans le référentiel mais sans UAI >> NON_FIABILISABLE_UAI_NON_VALIDEE
 */
const updateOrganismesNonFiabilisablesUaiNonValidees = async () => {
  logger.info("Identification des organismes non fiabilisables avec uai non validée ...");

  const { modifiedCount } = await organismesDb().updateMany(
    { uai: { $exists: false }, est_dans_le_referentiel: true },
    { $set: { fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.NON_FIABILISABLE_UAI_NON_VALIDEE } }
  );
  nbOrganismesNonFiabilisablesUaiNonValidees += modifiedCount;
};
