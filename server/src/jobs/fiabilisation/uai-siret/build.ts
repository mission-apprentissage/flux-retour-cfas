import { PromisePool } from "@supercharge/promise-pool";
import {
  getAnneesScolaireListFromDate,
  STATUT_FIABILISATION_COUPLES_UAI_SIRET,
  STATUT_PRESENCE_REFERENTIEL,
} from "shared";

import logger from "@/common/logger";
import {
  effectifsDb,
  effectifsQueueDb,
  fiabilisationUaiSiretDb,
  organismesReferentielDb,
} from "@/common/model/collections";
import { getPercentage } from "@/common/utils/miscUtils";

import { addFiabilisationsManuelles } from "./build.manual";
import {
  checkCoupleFiable,
  checkCoupleNonFiabilisable,
  checkMatchReferentielSiretUaiDifferent,
  checkMatchReferentielUaiUniqueSiretDifferent,
  checkSiretMultiplesRelationsAndLieux,
  checkUaiAucunLieuReferentiel,
  checkUaiLieuReferentiel,
  checkUaiMultiplesRelationsAndLieux,
} from "./build.rules";

// Filtres année scolaire pour récupération des couples UAI-SIRET
const filters = { annee_scolaire: { $in: getAnneesScolaireListFromDate(new Date()) } };

/**
 * Fonction de construction de la collection des couples de fiabilisation UAI SIRET
 */
export const buildFiabilisationUaiSiret = async () => {
  await fiabilisationUaiSiretDb().deleteMany({});

  logger.info("> Execution du script de fiabilisation sur tous les couples UAI-SIRET...");
  const [organismesFromReferentiel, allCouplesUaiSiretTdbInReferentiel, uniqueCouplesUaiSiretToCheck] =
    await Promise.all([
      organismesReferentielDb().find().toArray(),
      getAllCouplesUaiSiretTdbInReferentiel(),
      getAllUniqueCouplesUaiSiretToFiabilise(),
    ]);

  // Traitement // sur tous les couples identifiés
  await PromisePool.for(uniqueCouplesUaiSiretToCheck).process(async (coupleUaiSiretTdb) => {
    await buildFiabilisationCoupleForTdbCouple(
      coupleUaiSiretTdb,
      allCouplesUaiSiretTdbInReferentiel,
      organismesFromReferentiel
    );
  });

  // Ajout de fiabilisation manuelles
  await addFiabilisationsManuelles();

  // Stats & log / info
  const nbCouplesFiablesFound = await fiabilisationUaiSiretDb().countDocuments({
    type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.FIABLE,
  });
  const nbCouplesAFiabiliser = await fiabilisationUaiSiretDb().countDocuments({
    type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER,
  });
  const nbCouplesNonFiabilisablesUaiNonValidee = await fiabilisationUaiSiretDb().countDocuments({
    type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_UAI_NON_VALIDEE,
  });
  const nbCouplesNonFiabilisablesUaiValidee = await fiabilisationUaiSiretDb().countDocuments({
    type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_UAI_VALIDEE,
  });
  const nbCouplesNonFiabilisablesPbCollecte = await fiabilisationUaiSiretDb().countDocuments({
    type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_PB_COLLECTE,
  });
  const nbCouplesNonFiabilisablesInexistants = await fiabilisationUaiSiretDb().countDocuments({
    type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_INEXISTANT,
  });

  let percentageCouplesFiables = getPercentage(nbCouplesFiablesFound, uniqueCouplesUaiSiretToCheck.length);
  let nbCouplesNonFiabilisables =
    nbCouplesNonFiabilisablesUaiNonValidee +
    nbCouplesNonFiabilisablesUaiValidee +
    nbCouplesNonFiabilisablesPbCollecte +
    nbCouplesNonFiabilisablesInexistants;
  let percentageCouplesNonFiabilisables = getPercentage(nbCouplesNonFiabilisables, uniqueCouplesUaiSiretToCheck.length);

  logger.info(` -> ${nbCouplesFiablesFound} couples déjà fiables (${percentageCouplesFiables}%)`);
  logger.info(` -> ${nbCouplesAFiabiliser} nouveaux couples à fiabiliser`);
  logger.info(` -> ${nbCouplesNonFiabilisables} couples non fiabilisables (${percentageCouplesNonFiabilisables}%)`);
  logger.info(`  -> dont ${nbCouplesNonFiabilisablesUaiNonValidee} non fiabilisables > UAI non validée Référentiel`);
  logger.info(`  -> dont ${nbCouplesNonFiabilisablesUaiValidee} non fiabilisables > UAI validée Référentiel`);
  logger.info(`  -> dont ${nbCouplesNonFiabilisablesPbCollecte} non fiabilisables > problème de collecte`);
  logger.info(`  -> dont ${nbCouplesNonFiabilisablesInexistants} non fiabilisables > inexistants`);

  return {
    nbCouplesDejaFiables: nbCouplesFiablesFound,
    percentageCouplesFiables,
    nbCouplesAFiabiliser,
    nbCouplesNonFiabilisables,
    percentageCouplesNonFiabilisables,
    nbCouplesNonFiabilisablesUaiNonValidee,
    nbCouplesNonFiabilisablesUaiValidee,
    nbCouplesNonFiabilisablesPbCollecte,
    nbCouplesNonFiabilisablesInexistants,
  };
};

/**
 * Fonction de construction du couple de fiabilisation pour le couple du TDB fourni
 * @param coupleUaiSiretTdbToCheck  Couple UAI-SIRET du Tdb
 * @param allCouplesUaiSiretTdb Liste de tous les couples UAI-SIRET du Tdb
 * @param organismesFromReferentiel Liste des organismes du Référentiel
 * @returns
 */
export const buildFiabilisationCoupleForTdbCouple = async (
  coupleUaiSiretTdbToCheck,
  allCouplesUaiSiretTdb,
  organismesFromReferentiel
) => {
  // Règle n°1 on vérifie si on a un couple fiable
  if (await checkCoupleFiable(coupleUaiSiretTdbToCheck, organismesFromReferentiel)) return;

  // Règle n°2 on vérifie si on a un match sur l'UAI unique dans le référentiel mais avec un SIRET différent
  if (
    await checkMatchReferentielUaiUniqueSiretDifferent(
      coupleUaiSiretTdbToCheck,
      organismesFromReferentiel,
      allCouplesUaiSiretTdb
    )
  )
    return;

  // Règle n°3 on vérifie si on a un match sur le SIRET dans le référentiel mais avec un UAI différent
  if (
    await checkMatchReferentielSiretUaiDifferent(
      coupleUaiSiretTdbToCheck,
      organismesFromReferentiel,
      allCouplesUaiSiretTdb
    )
  )
    return;

  // Règle n°4 on vérifie pour les UAI multiples via les relations et les lieux
  if (
    await checkUaiMultiplesRelationsAndLieux(coupleUaiSiretTdbToCheck, allCouplesUaiSiretTdb, organismesFromReferentiel)
  )
    return;

  // Règle n°5 on vérifie pour les SIRET multiples via les relations et les lieux
  if (
    await checkSiretMultiplesRelationsAndLieux(
      coupleUaiSiretTdbToCheck,
      allCouplesUaiSiretTdb,
      organismesFromReferentiel
    )
  )
    return;

  // Règle n°6 on vérifie les organismes inexistants
  // Cette règle n'existe plus parce qu'on ne regarde plus dans la base ACCE

  // Règle n°7 on vérifie les UAI non trouvées dans les lieux du référentiel
  if (await checkUaiAucunLieuReferentiel(coupleUaiSiretTdbToCheck)) return;

  // Règle n°8 on vérifie les UAI trouvées dans les lieux du référentiel
  if (await checkUaiLieuReferentiel(coupleUaiSiretTdbToCheck)) return;

  // Règle n°9 on vérifie les couples non fiabilisables, si l'UAI est validée cotée référentiel
  if (await checkCoupleNonFiabilisable(coupleUaiSiretTdbToCheck)) return;
};

/**
 * Fonction de récupération de la liste des couples UAI SIRET uniques à fiabiliser
 * Cette liste est construire à partir de tous les couples UAI SIRET lié à des effectifs du TDB + tous les couples
 * liés à des données valides et sans erreurs dans la file d'attente
 * @returns
 */
export const getAllUniqueCouplesUaiSiretToFiabilise = async () => {
  const [allCouplesUaiSiretTdb, allCouplesUaiSiretTdbInQueue] = await Promise.all([
    getAllCouplesUaiSiretTdb(),
    getAllCouplesUaiSiretTdbInQueue(),
  ]);

  logger.info(" >>", allCouplesUaiSiretTdb.length, "couples UAI/SIRET trouvés en db");
  logger.info(" >>", allCouplesUaiSiretTdbInQueue.length, "couples UAI/SIRET trouvés dans la file d'attente");

  // On récupère la liste dédoublonnée des couples depuis les 2 sous ensembles tdb + queue
  const couplesUaiSiret = [...allCouplesUaiSiretTdb, ...allCouplesUaiSiretTdbInQueue];
  const uniqueCouplesUaiSiretToCheck = couplesUaiSiret.filter(
    (obj, index) => couplesUaiSiret.findIndex((item) => item.uai === obj.uai && item.siret === obj.siret) === index
  );

  logger.info(">", uniqueCouplesUaiSiretToCheck.length, "couples UAI/SIRET uniques à traiter");
  return uniqueCouplesUaiSiretToCheck;
};

/**
 * Fonction de récupération de tous les couples UAI/SIRET depuis les effectifs en faisant un lookup effectifs - organismes
 * @returns
 */
const getAllCouplesUaiSiretTdb = async () => {
  return await effectifsDb()
    .aggregate([
      { $match: filters },
      {
        $lookup: {
          from: "organismes",
          localField: "organisme_id",
          foreignField: "_id",
          as: "organismes_info",
        },
      },
      { $unwind: "$organismes_info" },
      { $project: { organisme_uai: "$organismes_info.uai", organisme_siret: "$organismes_info.siret" } },
      { $group: { _id: { uai: "$organisme_uai", siret: "$organisme_siret" } } },
      { $project: { _id: 0, uai: "$_id.uai", siret: "$_id.siret" } },
    ])
    .toArray();
};

const getAllCouplesUaiSiretTdbInReferentiel = async () => {
  return await effectifsDb()
    .aggregate([
      { $match: filters },
      {
        $lookup: {
          from: "organismes",
          localField: "organisme_id",
          foreignField: "_id",
          as: "organismes_info",
          pipeline: [
            {
              $match: {
                est_dans_le_referentiel: {
                  $in: [STATUT_PRESENCE_REFERENTIEL.PRESENT, STATUT_PRESENCE_REFERENTIEL.PRESENT_UAI_MULTIPLES_TDB],
                },
              },
            },
          ],
        },
      },
      { $unwind: "$organismes_info" },
      { $project: { organisme_uai: "$organismes_info.uai", organisme_siret: "$organismes_info.siret" } },
      { $group: { _id: { uai: "$organisme_uai", siret: "$organisme_siret" } } },
      { $project: { _id: 0, uai: "$_id.uai", siret: "$_id.siret" } },
    ])
    .toArray();
};

/**
 * Fonction de récupération de tous les couples UAI/SIRET depuis la file d'attente effectifsQueue sans erreurs de validation
 * @returns
 */
const getAllCouplesUaiSiretTdbInQueue = async () => {
  //
  return await effectifsQueueDb()
    .aggregate([
      { $match: { ...filters } },
      { $group: { _id: { uai: "$uai_etablissement", siret: "$siret_etablissement" } } },
      { $project: { _id: 0, uai: "$_id.uai", siret: "$_id.siret" } },
    ])
    .toArray();
};
