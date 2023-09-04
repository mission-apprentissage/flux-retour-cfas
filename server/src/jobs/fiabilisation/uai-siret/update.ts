import { PromisePool } from "@supercharge/promise-pool";
import { MongoServerError, WithId } from "mongodb";

import {
  createOrganisme,
  deleteOrganismeAndEffectifs,
  findOrganismeById,
} from "@/common/actions/organismes/organismes.actions";
import {
  STATUT_CREATION_ORGANISME,
  STATUT_FIABILISATION_COUPLES_UAI_SIRET,
  STATUT_FIABILISATION_ORGANISME,
} from "@/common/constants/fiabilisation";
import { STATUT_PRESENCE_REFERENTIEL } from "@/common/constants/organisme";
import logger from "@/common/logger";
import { Organisme } from "@/common/model/@types";
import {
  effectifsDb,
  fiabilisationUaiSiretDb,
  organismesDb,
  organismesReferentielDb,
} from "@/common/model/collections";

import { getEffectifsDuplicatesFromOrganismes } from "./update.utils";

let nbOrganismesReferentielFiables: number;
let nbOrganismesFiabilises: number;
let nbOrganismesNonFiablesSupprimes: number;
let nbOrganismesFermesAFiabiliser: number;
let nbEffectifsDuplicateOrganismesAFiabiliser: number;
let nbEffectifsDuplicatesOrganismesNonFiables: number;
let nbEffectifsMovedToOrganismeFiable: number;

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
  nbOrganismesNonFiablesSupprimes = 0;
  nbOrganismesFermesAFiabiliser = 0;
  nbEffectifsDuplicateOrganismesAFiabiliser = 0;
  nbEffectifsDuplicatesOrganismesNonFiables = 0;
  nbEffectifsMovedToOrganismeFiable = 0;

  // Traitement // de l'identification des différents statuts de fiabilisation
  await Promise.all([
    updateOrganismesReferentielFiables(),
    updateOrganismesFiabilises(),
    updateOrganismesNonFiablesUaiFermee(),
    updateOrganismesFiablesFermes(),
  ]);

  // Log
  logger.info("> MAJ des statuts de fiabilisation des organismes");
  logger.info(" ->", nbOrganismesReferentielFiables, "organismes du référentiel mis à jour en tant que fiables");
  logger.info(" ->", nbOrganismesFiabilises, "organismes mis à jour en tant que fiabilisés");
  logger.info(" ->", nbOrganismesNonFiablesSupprimes, "organismes non fiables supprimés");
  logger.info(" ->", nbEffectifsDuplicateOrganismesAFiabiliser, "doublons d'effectifs en fiabilisation d'organisme");
  logger.info(" ->", nbEffectifsDuplicatesOrganismesNonFiables, "doublons d'effectifs sur les organismes non fiables");
  logger.info(" ->", nbEffectifsMovedToOrganismeFiable, "effectifs déplacés d'un organisme non fiable vers fiable");
  logger.info(" ->", nbOrganismesFermesAFiabiliser, "organismes fiables fermés à fiabiliser vers organisme ouvert");

  return {
    nbOrganismesReferentielFiables,
    nbOrganismesFiabilises,
    nbOrganismesNonFiablesSupprimes,
    nbEffectifsDuplicateOrganismesAFiabiliser,
    nbEffectifsDuplicatesOrganismesNonFiables,
    nbEffectifsMovedToOrganismeFiable,
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
const updateOrganismeForCoupleFiabilise = async ({ uai, uai_fiable, siret, siret_fiable }: any) => {
  // Update de l'organisme lié à un couple UAI-SIRET marqué comme A_FIABILISER en FIABLE
  const { modifiedCount: organismesModifiedCount } = await organismesDb().updateOne(
    { uai: uai_fiable, siret: siret_fiable },
    { $set: { fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.FIABLE } }
  );

  let organismeFiable = await organismesDb().findOne({ uai: uai_fiable, siret: siret_fiable });
  const organismeNonFiable = await organismesDb().findOne({ uai: uai, siret: siret });

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

/**
 * Fonction de MAJ des organismes non fiables si l'UAI du non fiable est fermée dans le référentiel
 */
export const updateOrganismesNonFiablesUaiFermee = async () => {
  const organismesNonFiabilisables = await organismesDb()
    .find({
      fiabilisation_statut: {
        $in: [
          STATUT_FIABILISATION_ORGANISME.NON_FIABILISABLE_UAI_VALIDEE,
          STATUT_FIABILISATION_ORGANISME.NON_FIABILISABLE_UAI_NON_VALIDEE,
          STATUT_FIABILISATION_ORGANISME.NON_FIABILISABLE_PB_COLLECTE,
        ],
      },
    })
    .toArray();

  await PromisePool.for(organismesNonFiabilisables).process(async ({ _id, uai, siret }: any) => {
    // Recherche d'un unique organisme fiable avec ce SIRET
    const organismesFiableForSiret = await organismesDb()
      .find({ siret, fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.FIABLE })
      .toArray();

    // S'il existe un unique organisme fiable lié au couple non fiable courant on vérifie
    // s'il existe un organisme dans le référentiel avec l'uai non fiable fermée
    if (organismesFiableForSiret.length === 1) {
      const organismeFiable = organismesFiableForSiret[0];
      const organismeNonFiable = (await organismesDb().findOne({ uai, siret })) as WithId<Organisme>;

      const countOrganismeReferentielForUaiFerme = await organismesReferentielDb().countDocuments({
        uai,
        etat_administratif: "fermé",
      });

      // Si l'UAI du référentiel est fermée on essaie de fiabiliser les effectifs et l'organisme
      if (countOrganismeReferentielForUaiFerme > 0) {
        // On vérifie s'il existe des doublons en commun sur l'organisme fiable et non fiable
        const duplicatesForFiableAndNonFiable = await getEffectifsDuplicatesFromOrganismes(
          organismeFiable?._id,
          organismeNonFiable?._id
        );

        if (duplicatesForFiableAndNonFiable.length > 0) {
          // On déplace les effectifs du non fiable vers le fiable
          const effectifsToMoveToFiable = await effectifsDb().find({ organisme_id: organismeNonFiable._id }).toArray();
          for (const currentEffectifToUpdate of effectifsToMoveToFiable) {
            try {
              const { modifiedCount } = await effectifsDb().updateOne(
                { _id: currentEffectifToUpdate._id },
                { $set: { organisme_id: organismeFiable?._id } }
              );
              nbEffectifsMovedToOrganismeFiable += modifiedCount;
            } catch (error) {
              if (error instanceof MongoServerError) {
                if (error.message.includes("duplicate key error")) {
                  nbEffectifsDuplicatesOrganismesNonFiables++;
                }
              }
            }
          }

          // On supprime ensuite l'organisme non fiable
          await deleteOrganismeAndEffectifs(organismeNonFiable?._id);
          nbOrganismesNonFiablesSupprimes++;
        }
      }
    } else {
      // Si pas d'organisme fiable lié on marque l'organisme comme A_CONTACTER
      await organismesDb().updateOne(
        { uai, siret },
        { $set: { fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.A_CONTACTER } }
      );
    }
  });
};

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
