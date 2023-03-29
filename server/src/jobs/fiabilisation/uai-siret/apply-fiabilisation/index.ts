import { createJobEvent } from "../../../../common/actions/jobEvents.actions.js";
import { PromisePool } from "@supercharge/promise-pool/dist/promise-pool.js";
import { MongoServerError } from "mongodb";
import { deleteOrganismeAndEffectifs } from "../../../../common/actions/organismes/organismes.actions.js";
import {
  STATUT_FIABILISATION_COUPLES_UAI_SIRET,
  STATUT_FIABILISATION_ORGANISME,
} from "../../../../common/constants/fiabilisationConstants.js";
import logger from "../../../../common/logger.js";
import {
  effectifsDb,
  fiabilisationUaiSiretDb,
  organismesDb,
  organismesReferentielDb,
} from "../../../../common/model/collections.js";

let nbOrganismesReferentielFiables = 0;
let nbOrganismesFiabilises = 0;
let nbOrganismesNonFiabilisablesMappingSupprimes = 0;
let nbOrganismesNonFiablesUaiSupprimes = 0;
let nbOrganismesNonFiabilisablesMappingFixEffectifs = 0;
let nbEffectifsDuplicateOrganismesAFiabiliser = 0;
let nbEffectifsFixedOrganismesNonFiabilisablesMapping = 0;
let nbEffectifsDuplicateOrganismesNonFiabilisablesMapping = 0;

/**
 * Méthode d'application de la fiabilisation pour les 3 cas :
 *  Couples déja identifiées comme fiables : MAJ le champ fiabilisation_statut des organismes concernés
 *  Couples à fiabiliser : On déplace les effectifs, puis on MAJ le champ fiabilisation_statut des organismes concernés
 *    et on supprime les organismes non fiables restants
 *  Couples identifiés comme non fiabilisables (via Mapping) : MAJ le champ fiabilisation_statut des organismes concernés
 *    et suppression des organismes si on trouve un organisme fiable lié à ce couple
 *  Couples identifiés comme non fiabilisables (UAI non validée référentiel) : MAJ le champ fiabilisation_statut des organismes concernés
 */
export const applyFiabilisationUaiSiret = async () => {
  // Traitement // de l'identification des différents statuts de fiabilisation
  await Promise.all([
    updateOrganismesReferentielFiables(),
    updateOrganismesFiabilise(),
    updateOrganismesNonFiabilisablesMapping(),
    handleOrganismesNonFiabilisablesUaiNonValide(),
  ]);

  // Log
  logger.info(nbOrganismesReferentielFiables, "organismes du référentiel mis à jour en tant que fiables");
  logger.info(nbOrganismesFiabilises, "organismes mis à jour en tant que fiabilisés");

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

  logger.info(
    nbEffectifsDuplicateOrganismesAFiabiliser,
    "Effectifs en doublons sur organismes non fiable en tentative de correction sur un organisme fiable lié"
  );
  logger.info(nbOrganismesNonFiablesUaiSupprimes, "organismes non fiables (uai) supprimés");

  return {
    nbOrganismesReferentielFiables,
    nbOrganismesFiabilises,
    nbOrganismesNonFiabilisablesMappingSupprimes,
    nbOrganismesNonFiablesUaiSupprimes,
  };
};

// #region ORGANISMES REFERENTIEL FIABLES

/**
 * Méthode maj des statuts de fiabilisation FIABLE pour les organismes avec UAI & présents dans le référentiel
 */
const updateOrganismesReferentielFiables = async () => {
  logger.info("Identification des organismes du référentiel comme fiables ...");

  const { modifiedCount } = await organismesDb().updateMany(
    { uai: { $exists: true }, est_dans_le_referentiel: true },
    { $set: { fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.FIABLE } }
  );
  nbOrganismesReferentielFiables += modifiedCount;
};

// #endregion

// #region ORGANISMES A FIABILISER

/**
 * Méthode de MAJ des organismes pour les cas ou l'on bien fiabilisé la donnée
 */
const updateOrganismesFiabilise = async () => {
  logger.info("Traitement des organismes à fiabiliser ...");
  const couplesAFiabiliser = await fiabilisationUaiSiretDb()
    .find({ type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER })
    .toArray();

  await PromisePool.for(couplesAFiabiliser).process(updateOrganismeForCoupleFiabilise);
};

/**
 * Méthode de MAJ unitaire d'un organisme à fiabiliser et de ses effectifs
 * Pour chaque couple identifié on va mettre à jour l'organisme en question comme étant FIABLE
 * Enfin on va déplacer les effectifs de l'organisme non fiable vers le fiable
 * Puis supprimer l'organisme non fiable
 * @param {*} currentFiabilisationCouple
 */
const updateOrganismeForCoupleFiabilise = async ({ uai, uai_fiable, siret, siret_fiable }: any) => {
  // Update de l'organisme lié à un couple UAI-SIRET marqué comme A_FIABILISER en FIABLE
  const { modifiedCount: organismesModifiedCount } = await organismesDb().updateOne(
    { uai: uai_fiable, siret: siret_fiable },
    { $set: { fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.FIABLE } }
  );

  const organismeFiable = await organismesDb().findOne({ uai: uai_fiable, siret: siret_fiable });
  const organismeNonFiable = await organismesDb().findOne({ uai: uai, siret: siret });

  if (organismeFiable && organismeNonFiable) {
    try {
      // Déplacement des effectifs de l'organisme non fiable vers l'organisme fiable
      await effectifsDb().updateMany(
        { organisme_id: organismeNonFiable?._id },
        { $set: { organisme_id: organismeFiable?._id } },
        { upsert: true }
      );
    } catch (error) {
      if (error instanceof MongoServerError) {
        if (error.message.includes("duplicate key error")) {
          // On décompte les effectifs en doublon - pas de rattachement nécessaire vu que l'effectif existe déja
          nbEffectifsDuplicateOrganismesAFiabiliser++;
        }
      }
    }

    // Suppression de l'organisme non fiable et de ses effectifs
    await deleteOrganismeAndEffectifs(organismeNonFiable?._id);
    nbOrganismesNonFiablesUaiSupprimes++;
  }

  nbOrganismesFiabilises += organismesModifiedCount;
};

// #endregion

// #region ORGANISMES NON FIABILISABLES MAPPING

/**
 * Méthode de MAJ de tous les couples non fiabilisables en utilisant le mapping >> NON_FIABILISABLE_MAPPING
 */
const updateOrganismesNonFiabilisablesMapping = async () => {
  logger.info("Traitement des organismes non fiabilisables via mapping ...");

  // Une fois tous les couples ayant permis de maj les organismes on va rattacher les effectifs de chacun des organismes NON_FIABILISABLE_MAPPING
  const organismesNonFiabilisablesMapping = await organismesDb()
    .find({ fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.NON_FIABILISABLE_MAPPING })
    .toArray();

  await PromisePool.for(organismesNonFiabilisablesMapping).process(
    updateOrganismeNonFiabilisableMappingEffectifsToOrganismeFiable
  );

  // Enfin on va supprimer les organismes NON_FIABILISABLE_MAPPING et leurs effectifs
  await PromisePool.for(organismesNonFiabilisablesMapping).process(async ({ _id }: any) => {
    await deleteOrganismeAndEffectifs(_id);
    nbOrganismesNonFiabilisablesMappingSupprimes++;
  });
};

/**
 * Méthode de MAJ unitaire d'un organisme NON_FIABILISABLE_MAPPING en rattachant ses effectifs liés au bon organisme FIABLE s'il en existe un seul
 * @param {*} currentOrganismeNonFiabilisableMapping
 */
const updateOrganismeNonFiabilisableMappingEffectifsToOrganismeFiable = async ({ _id, uai }: any) => {
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
// #endregion

// #region ORGANISMES NON FIABILISABLES UAI NON VALIDEE

const handleOrganismesNonFiabilisablesUaiNonValide = async () => {
  logger.info("Traitement des organismes non fiabilisables car uai non validée ...");

  // Récupération de tous les organismes non fiabilisables car uai non validée
  const organismesNonFiabilisablesUai = await organismesDb()
    .find({ fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.NON_FIABILISABLE_UAI_NON_VALIDEE })
    .toArray();

  await PromisePool.for(organismesNonFiabilisablesUai).process(async ({ uai, siret }: any) => {
    const organismesFiableForSiret = await organismesDb()
      .find({ siret, fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.FIABLE })
      .toArray();

    // S'il existe un unique couple fiable lié au couple non fiable courant on vérifie si l'uai est fermée
    if (organismesFiableForSiret.length === 1) {
      const organismeReferentielUai = await organismesReferentielDb().findOne({ uai });

      // TODO vérifier si l'uai est fermée
      if (organismeReferentielUai) {
        const isUaiNonFiableFerme = organismeReferentielUai?.etat_administratif === "fermé";
        await createJobEvent({
          jobname: "fiabilisation:uai-siret:apply",
          action: "log-handleOrganismesNonFiabilisablesUaiNonValide-1-fiableLie",
          date: new Date(),
          data: {
            uai,
            siret,
            coupleFiableUai: organismesFiableForSiret[0].uai,
            coupleFiableSiret: organismesFiableForSiret[0].siret,
            isUaiNonFiableFerme,
            organismeReferentielUai: organismeReferentielUai || false,
          },
        });
        // TODO Vérifier doublons d'effectifs
        // TODO Si nécessaire suppression de l'organisme non fiable
      }
    } else {
      // Sinon on marque l'organisme comme A_CONTACTER
      await organismesDb().updateOne(
        { uai, siret },
        { $set: { fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.A_CONTACTER } }
      );
    }
  });
};

// #endregion
