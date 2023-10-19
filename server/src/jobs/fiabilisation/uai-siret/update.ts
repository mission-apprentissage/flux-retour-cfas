import { PromisePool } from "@supercharge/promise-pool";

import { createOrganisme, findOrganismeById } from "@/common/actions/organismes/organismes.actions";
import {
  STATUT_CREATION_ORGANISME,
  STATUT_FIABILISATION_COUPLES_UAI_SIRET,
  STATUT_FIABILISATION_ORGANISME,
} from "@/common/constants/fiabilisation";
import { STATUT_PRESENCE_REFERENTIEL } from "@/common/constants/organisme";
import logger from "@/common/logger";
import { fiabilisationUaiSiretDb, organismesDb, organismesReferentielDb } from "@/common/model/collections";

let nbOrganismesReferentielFiables: number;
let nbOrganismesFiabilises: number;
let nbOrganismesFermesAFiabiliser: number;

/**
 * Méthode d'application de la fiabilisation pour les différents cas :
 *  Organismes du référentiel ayant une UAI valide : MAJ le champ fiabilisation_statut des organismes concernés comme FIABLE
 *  Couples à fiabiliser : On déplace les effectifs, puis on MAJ le champ fiabilisation_statut des organismes concernés
 *    et on supprime les organismes non fiables restants
 *  Couples identifiés comme non fiables : si on trouve un couple fiable lié à ce siret et que l'UAI est fermée dans le référentiel alors
 *  si doublons d'effectifs on déplace les effectifs du non fiable vers le fiable et on supprime le non fiable
 */
export const updateOrganismesFiabilisationUaiSiret = async () => {
  // Init counters
  nbOrganismesReferentielFiables = 0;
  nbOrganismesFiabilises = 0;
  nbOrganismesFermesAFiabiliser = 0;

  // Traitement // de l'identification des différents statuts de fiabilisation
  await Promise.all([
    updateOrganismesReferentielFiables(),
    updateOrganismesFiabilises(),
    updateOrganismesFiablesFermes(),
  ]);

  // Log
  logger.info("> MAJ des statuts de fiabilisation des organismes");
  logger.info(" ->", nbOrganismesReferentielFiables, "organismes du référentiel mis à jour en tant que fiables");
  logger.info(" ->", nbOrganismesFiabilises, "organismes mis à jour en tant que fiabilisés");
  logger.info(" ->", nbOrganismesFermesAFiabiliser, "organismes fiables fermés à fiabiliser vers organisme ouvert");

  return {
    nbOrganismesReferentielFiables,
    nbOrganismesFiabilises,
    nbOrganismesFermesAFiabiliser,
  };
};

// #region ORGANISMES REFERENTIEL FIABLES

/**
 * Méthode maj des statuts de fiabilisation FIABLE pour les organismes avec UAI, présents dans le référentiel et encore ouverts
 */
const updateOrganismesReferentielFiables = async () => {
  const { modifiedCount } = await organismesDb().updateMany(
    { uai: { $exists: true }, est_dans_le_referentiel: STATUT_PRESENCE_REFERENTIEL.PRESENT, ferme: false },
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
const updateOrganismeForCoupleFiabilise = async ({ uai_fiable, siret_fiable }: any) => {
  // Update de l'organisme lié à un couple UAI-SIRET marqué comme A_FIABILISER en FIABLE
  const { modifiedCount: organismesModifiedCount } = await organismesDb().updateOne(
    { uai: uai_fiable, siret: siret_fiable },
    { $set: { fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.FIABLE } }
  );

  let organismeFiable = await organismesDb().findOne({ uai: uai_fiable, siret: siret_fiable });

  if (!organismeFiable) {
    // Si on ne trouve aucun organisme fiable pour l'uai fiable / siret_fiable c'est qu'on est dans le cas d'un couple d'un lieu
    // On peut alors créer l'organisme comme étant un organisme "lieu"
    const organismeLieuToCreate = await createOrganisme({
      uai: uai_fiable,
      siret: siret_fiable,
      fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.FIABLE,
      creation_statut: STATUT_CREATION_ORGANISME.ORGANISME_LIEU_FORMATION, // Ajout d'un flag pour identifier que c'est un organisme créé à partir d'un lieu
    });

    organismeFiable = await findOrganismeById(organismeLieuToCreate?._id);
  }

  nbOrganismesFiabilises += organismesModifiedCount;
};

// #endregion

/**
 * Fonction de fiabilisation des organismes fermé si on trouve un unique organisme ouvert lié
 */
export const updateOrganismesFiablesFermes = async () => {
  // Récupération des couples fiables avec lookup sur le référentiel via SIRET et étant marqués comme fermés dans le référentiel
  const couplesFiablesFermesDansReferentiel = await organismesDb()
    .find({ fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.FIABLE, ferme: true })
    .toArray();

  await PromisePool.for(couplesFiablesFermesDansReferentiel).process(async ({ uai, siret }: any) => {
    // On recherche s'il existe un organisme ouvert lié à l'UAI
    const organismesReferentielOpen = await organismesReferentielDb()
      .find({ uai, etat_administratif: "actif" })
      .toArray();

    // S'il existe un unique organisme ouvert lié on ajoute une fiabilisation
    if (organismesReferentielOpen.length === 1) {
      await updateOrganismeForCoupleFiabilise({
        uai,
        uai_fiable: uai,
        siret,
        siret_fiable: organismesReferentielOpen[0].siret,
      });
      nbOrganismesFermesAFiabiliser++;
    }
  });
};
