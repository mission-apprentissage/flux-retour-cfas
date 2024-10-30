import { PromisePool } from "@supercharge/promise-pool";
import { STATUT_FIABILISATION_COUPLES_UAI_SIRET } from "shared";

import logger from "@/common/logger";
import { fiabilisationUaiSiretDb, organismesDb, organismesReferentielDb } from "@/common/model/collections";
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

/**
 * Fonction de construction de la collection des couples de fiabilisation UAI SIRET
 */
export const buildFiabilisationUaiSiret = async () => {
  await fiabilisationUaiSiretDb().deleteMany({});

  logger.info("> Execution du script de fiabilisation sur tous les couples UAI-SIRET...");
  const [organismesFromReferentiel, allCouplesUaiSiretTdb] = await Promise.all([
    organismesReferentielDb().find().toArray(),
    getAllUniqueCouplesUaiSiretTdb(),
  ]);

  // Traitement // sur tous les couples identifiés
  await PromisePool.for(allCouplesUaiSiretTdb).process(async (coupleUaiSiretTdb) => {
    await buildFiabilisationCoupleForTdbCouple(coupleUaiSiretTdb, allCouplesUaiSiretTdb, organismesFromReferentiel);
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

  let percentageCouplesFiables = getPercentage(nbCouplesFiablesFound, allCouplesUaiSiretTdb.length);
  let nbCouplesNonFiabilisables =
    nbCouplesNonFiabilisablesUaiNonValidee +
    nbCouplesNonFiabilisablesUaiValidee +
    nbCouplesNonFiabilisablesPbCollecte +
    nbCouplesNonFiabilisablesInexistants;
  let percentageCouplesNonFiabilisables = getPercentage(nbCouplesNonFiabilisables, allCouplesUaiSiretTdb.length);

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

const getAllUniqueCouplesUaiSiretTdb = async () => {
  const uniqueCouplesUaiSiretToCheck = await organismesDb().find({}).toArray();

  logger.info(">", uniqueCouplesUaiSiretToCheck.length, "couples UAI/SIRET uniques à traiter");
  return uniqueCouplesUaiSiretToCheck;
};
