import { PromisePool } from "@supercharge/promise-pool/dist/promise-pool.js";
import { MongoServerError } from "mongodb";
import { deleteOrganismeAndEffectifs } from "../../../common/actions/organismes/organismes.actions.js";
import {
  STATUT_FIABILISATION_COUPLES_UAI_SIRET,
  STATUT_FIABILISATION_ORGANISME,
} from "../../../common/constants/fiabilisationConstants.js";
import logger from "../../../common/logger.js";
import { effectifsDb, fiabilisationUaiSiretDb, organismesDb } from "../../../common/model/collections.js";

let nbOrganismesReferentielFiables = 0;
let nbOrganismesFiabilises = 0;
let nbOrganismesNonFiablesSupprimes = 0;

let nbOrganismesNonFiabilisablesMappingSupprimes = 0;
let nbOrganismesNonFiabilisablesMappingFixEffectifs = 0;

let nbEffectifsDuplicateOrganismesAFiabiliser = 0;
let nbEffectifsFixedOrganismesNonFiabilisablesMapping = 0;
let nbEffectifsDuplicateOrganismesNonFiabilisablesMapping = 0;

/**
 * Méthode d'application de la fiabilisation pour les différents cas :
 *  Organismes du référentiel ayant une UAI valide : MAJ le champ fiabilisation_statut des organismes concernés comme FIABLE
 *  Couples à fiabiliser : On déplace les effectifs, puis on MAJ le champ fiabilisation_statut des organismes concernés
 *    et on supprime les organismes non fiables restants
 *  Couples identifiés comme non fiabilisables (via Mapping) : MAJ le champ fiabilisation_statut des organismes concernés
 *    et suppression des organismes si on trouve un organisme fiable lié à ce couple
 *  Couples identifiés comme non fiabilisables (UAI non validée référentiel) : ????
 */
export const updateOrganismesFiabilisationUaiSiret = async () => {
  // Traitement // de l'identification des différents statuts de fiabilisation
  await Promise.all([
    updateOrganismesReferentielFiables(),
    updateOrganismesFiabilises(),
    updateOrganismesNonFiabilisablesMapping(),
  ]);

  // Log
  logger.info("> MAJ des statuts de fiabilisation des organismes");
  logger.info(" ->", nbOrganismesReferentielFiables, "organismes du référentiel mis à jour en tant que fiables");
  logger.info(" ->", nbOrganismesFiabilises, "organismes mis à jour en tant que fiabilisés");
  logger.info(" ->", nbOrganismesNonFiablesSupprimes, "organismes non fiables supprimés");
  logger.info(" ->", nbEffectifsDuplicateOrganismesAFiabiliser, "effectifs doublons sur fiabilisation d'un organisme");
  logger.info(" ->", nbOrganismesNonFiabilisablesMappingSupprimes, "organismes supprimés (non fiabilisables mapping)");
  logger.info(
    " ->",
    nbEffectifsDuplicateOrganismesNonFiabilisablesMapping,
    "doublons d'effectifs organismes (non fiabilisables mapping)"
  );
  logger.info(
    " ->",
    nbOrganismesNonFiabilisablesMappingFixEffectifs,
    "fix d'effectifs organismes (non fiabilisables mapping)"
  );

  return {
    nbOrganismesReferentielFiables,
    nbOrganismesFiabilises,
    nbOrganismesNonFiablesSupprimes,
    nbEffectifsDuplicateOrganismesAFiabiliser,
    nbOrganismesNonFiabilisablesMappingSupprimes,
    nbEffectifsDuplicateOrganismesNonFiabilisablesMapping,
    nbOrganismesNonFiabilisablesMappingFixEffectifs,
  };
};

// #region ORGANISMES REFERENTIEL FIABLES

/**
 * Méthode maj des statuts de fiabilisation FIABLE pour les organismes avec UAI & présents dans le référentiel
 */
const updateOrganismesReferentielFiables = async () => {
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
const updateOrganismesFiabilises = async () => {
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
    nbOrganismesNonFiablesSupprimes++;
  }

  nbOrganismesFiabilises += organismesModifiedCount;
};

// #endregion

// #region ORGANISMES NON FIABILISABLES UAI VALIDEE

/**
 * Méthode de MAJ de tous les couples non fiabilisables en utilisant le mapping >> NON_FIABILISABLE_UAI_VALIDEE
 */
const updateOrganismesNonFiabilisablesMapping = async () => {
  // Une fois tous les couples ayant permis de maj les organismes on va rattacher les effectifs de chacun des organismes NON_FIABILISABLE_UAI_VALIDEE
  const organismesNonFiabilisablesMapping = await organismesDb()
    .find({ fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.NON_FIABILISABLE_UAI_VALIDEE })
    .toArray();

  await PromisePool.for(organismesNonFiabilisablesMapping).process(
    updateOrganismeNonFiabilisableMappingEffectifsToOrganismeFiable
  );

  // Enfin on va supprimer les organismes NON_FIABILISABLE_UAI_VALIDEE et leurs effectifs
  await PromisePool.for(organismesNonFiabilisablesMapping).process(async ({ _id }: any) => {
    await deleteOrganismeAndEffectifs(_id);
    nbOrganismesNonFiabilisablesMappingSupprimes++;
  });
};

/**
 * Méthode de MAJ unitaire d'un organisme NON_FIABILISABLE_UAI_VALIDEE en rattachant ses effectifs liés au bon organisme FIABLE s'il en existe un seul
 * @param {*} currentOrganismeNonFiabilisableMapping
 */
const updateOrganismeNonFiabilisableMappingEffectifsToOrganismeFiable = async ({ _id, uai }: any) => {
  // Recherche d'un unique organisme fiable lié à l'UAI de l'organisme NON_FIABILISABLE_UAI_VALIDEE
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
