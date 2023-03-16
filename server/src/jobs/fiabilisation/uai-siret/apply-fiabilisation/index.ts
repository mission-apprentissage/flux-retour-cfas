import { PromisePool } from "@supercharge/promise-pool/dist/promise-pool.js";
import { MongoServerError } from "mongodb";
import { deleteOrganismeAndEffectifsAndDossiersApprenantsMigration } from "../../../../common/actions/organismes/organismes.actions.js";

import {
  STATUT_FIABILISATION_COUPLES_UAI_SIRET,
  STATUT_FIABILISATION_ORGANISME,
} from "../../../../common/constants/fiabilisationConstants.js";
import logger from "../../../../common/logger.js";
import {
  dossiersApprenantsMigrationDb,
  effectifsDb,
  fiabilisationUaiSiretDb,
  organismesDb,
} from "../../../../common/model/collections.js";

const filters = {
  annee_scolaire: { $in: ["2022-2022", "2022-2023", "2023-2023"] },
};

let nbOrganismesFiables = 0;
let nbOrganismesFiabilises = 0;
let nbDossiersApprenantsFiabilises = 0;
let nbOrganismesNonFiabilisablesMapping = 0;
let nbOrganismesNonFiabilisablesMappingSupprimes = 0;

let nbOrganismesNonFiabilisablesMappingFixEffectifs = 0;
let nbEffectifsFixedOrganismesNonFiabilisablesMapping = 0;
let nbEffectifsDuplicateOrganismesNonFiabilisablesMapping = 0;
let nbOrganismesNonFiabilisablesUaiNonValidees = 0;

/**
 * Méthode d'application de la fiabilisation pour les 3 cas :
 *  Données à fiabiliser (depuis les couples construits) : MAJ des dossiersApprenantsMigration ainsi que le champ fiabilisation_statut des organismes concernés
 *  Données déja identifiées comme fiables : MAJ le champ fiabilisation_statut des organismes concernés
 *  Données identifiées comme non fiabilisables : MAJ le champ fiabilisation_statut des organismes concernés
 *
 */
export const applyFiabilisationUaiSiret = async () => {
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
  logger.info(
    nbOrganismesNonFiabilisablesMappingFixEffectifs,
    "organismes non fiabilisables (mapping) dont on a corrigé les effectifs sur un organisme fiable lié"
  );
  logger.info(
    nbEffectifsFixedOrganismesNonFiabilisablesMapping,
    "Effectifs sur organismes non fiabilisables (mapping) corrigés sur un organisme fiable lié"
  );
  logger.info(
    nbEffectifsDuplicateOrganismesNonFiabilisablesMapping,
    "Effectifs en doublons sur organismes non fiabilisables (mapping) en tentative de correction sur un organisme fiable lié"
  );
  logger.info(nbOrganismesNonFiabilisablesMappingSupprimes, "organismes non fiabilisables (mapping) supprimés");

  return {
    nbOrganismesFiables,
    nbDossiersApprenantsFiabilises,
    nbOrganismesFiabilises,
    nbOrganismesNonFiabilisablesMapping,
    nbOrganismesNonFiabilisablesUaiNonValidees,
  };
};

/**
 * On marque par défaut le statut de fiabilisation des organismes comme étant INCONNU ou SANS_SIRET
 */
const resetStatutFiabilisation = async () => {
  await organismesDb().updateMany(
    { siret: { $exists: true } },
    { $set: { fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.INCONNU } }
  );

  await organismesDb().updateMany(
    { siret: { $exists: false } },
    { $set: { fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.SANS_SIRET } }
  );
};

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
 * Méthode de MAJ de tous les couples non fiabilisables en utilisant le mapping >> NON_FIABILISABLE_MAPPING
 */
const updateOrganismesNonFiabilisablesMapping = async () => {
  logger.info("Traitement des organismes non fiabilisables via mapping ...");

  const couplesNonFiabilisablesMapping = await fiabilisationUaiSiretDb()
    .find({ type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_MAPPING })
    .toArray();

  await PromisePool.for(couplesNonFiabilisablesMapping).process(updateOrganismeForCurrentCoupleNonFiabilisableMapping);

  // Une fois tous les couples ayant permis de maj les organismes on va rattacher les effectifs de chacun des organismes NON_FIABILISABLE_MAPPING
  const organismesNonFiabilisablesMapping = await organismesDb()
    .find({ fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.NON_FIABILISABLE_MAPPING })
    .toArray();

  await PromisePool.for(organismesNonFiabilisablesMapping).process(
    updateOrganismeNonFiabilisableMappingEffectifsToOrganismeFiable
  );

  // Enfin on va supprimer les organismes NON_FIABILISABLE_MAPPING et leurs effectifs / dossiersApprenantsMigration
  await PromisePool.for(organismesNonFiabilisablesMapping).process(async ({ _id }) => {
    await deleteOrganismeAndEffectifsAndDossiersApprenantsMigration(_id);
    nbOrganismesNonFiabilisablesMappingSupprimes++;
  });
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
 * Méthode de MAJ unitaire d'un organisme NON_FIABILISABLE_MAPPING en rattachant ses effectifs liés au bon organisme FIABLE s'il en existe un seul
 * @param {*} currentOrganismeNonFiabilisableMapping
 */
const updateOrganismeNonFiabilisableMappingEffectifsToOrganismeFiable = async ({ _id, uai }) => {
  // Recherche d'un unique organisme fiable lié à l'UAI de l'organisme NON_FIABILISABLE_MAPPING
  const organismeFiableForUai = await organismesDb()
    .find({ uai, fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.FIABLE })
    .toArray();

  if (organismeFiableForUai.length === 1) {
    const effectifsForOrganismeNonFiabilisableToFix = await effectifsDb().find({ organisme_id: _id }).toArray();
    const organismeFiableId = organismeFiableForUai[0]._id;

    // Update de chaque effectif via For Of pour limiter les appels //
    for (const currentEffectifToUpdate of effectifsForOrganismeNonFiabilisableToFix) {
      try {
        const { modifiedCount } = await effectifsDb().updateOne(
          { _id: currentEffectifToUpdate._id },
          { $set: { organisme_id: organismeFiableId } }
        );
        nbEffectifsFixedOrganismesNonFiabilisablesMapping += modifiedCount;
      } catch (error) {
        if (error instanceof MongoServerError) {
          if (error.message.includes("duplicate key error")) {
            // On décompte les effectifs en doublon - pas de rattachement nécessaire vu que l'effectif existe déja
            // Remarque : on pilote les doublons d'effectifs via Metabase cela nous permettra de vérifier que la correction s'applique bien aux effectifs non déja présents
            nbEffectifsDuplicateOrganismesNonFiabilisablesMapping++;
          }
        }
      }
    }

    if (nbEffectifsFixedOrganismesNonFiabilisablesMapping > 0) nbOrganismesNonFiabilisablesMappingFixEffectifs++;
  }
};

/**
 * Méthode de MAJ de tous les organismes non fiabilisables sans UAI dans le référentiel >> NON_FIABILISABLE_UAI_NON_VALIDEE
 */
const updateOrganismesNonFiabilisablesUaiNonValidees = async () => {
  logger.info("Identification des organismes non fiabilisables car uai non validée ...");

  const couplesNonFiabilisablesUaiNonValidees = await fiabilisationUaiSiretDb()
    .find({ type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_UAI_NON_VALIDEE })
    .toArray();

  await PromisePool.for(couplesNonFiabilisablesUaiNonValidees).process(
    updateOrganismeForCurrentCoupleNonFiabilisableUaiNonValidee
  );
};

/**
 * Méthode de MAJ unitaire d'un organisme comme étant non fiabilisable sans UAI dans le référentiel >> NON_FIABILISABLE_UAI_NON_VALIDEE
 * @param {*} currentFiabilisationCouple
 */
const updateOrganismeForCurrentCoupleNonFiabilisableUaiNonValidee = async (currentFiabilisationCouple) => {
  const { modifiedCount } = await organismesDb().updateMany(
    { uai: currentFiabilisationCouple.uai, siret: currentFiabilisationCouple.siret },
    { $set: { fiabilisation_statut: STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_UAI_NON_VALIDEE } }
  );
  nbOrganismesNonFiabilisablesUaiNonValidees += modifiedCount;
};
