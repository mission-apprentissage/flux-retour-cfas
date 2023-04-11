import { PromisePool } from "@supercharge/promise-pool";
import { createJobEvent } from "../../../common/actions/jobEvents.actions.js";
import { STATUT_FIABILISATION_COUPLES_UAI_SIRET } from "../../../common/constants/fiabilisationConstants.js";
import logger from "../../../common/logger.js";
import { effectifsDb, fiabilisationUaiSiretDb, organismesReferentielDb } from "../../../common/model/collections.js";
import { getPercentage } from "../../../common/utils/miscUtils.js";
import { insertManualMappingsFromFile } from "./utils.js";
import {
  checkCoupleFiable,
  checkCoupleNonFiabilisable,
  checkMatchReferentielSiretUaiDifferent,
  checkMatchReferentielUaiUniqueSiretDifferent,
  checkSiretMultiplesRelationsAndLieux,
  checkUaiAucunLieuReferentiel,
  checkUaiMultiplesRelationsAndLieux,
} from "./rules.js";

// Filtres année scolaire pour récupération des couples UAI-SIRET
const filters = { annee_scolaire: { $in: ["2022-2022", "2022-2023", "2023-2023"] } };

/**
 * Fonction de construction de la collection des couples de fiabilisation UAI SIRET
 */
export const buildFiabilisationUaiSiret = async () => {
  logger.info("Clear de la table fiabilisation UAI-SIRET...");
  await fiabilisationUaiSiretDb().deleteMany({});

  logger.info("> Execution du script de fiabilisation sur tous les couples UAI-SIRET...");
  await runFiabilisationOnUaiSiretCouples();
};

/**
 * Méthode de création de la collection pour fiabilisation couples UAI SIRET
 */
const runFiabilisationOnUaiSiretCouples = async () => {
  const organismesFromReferentiel = await organismesReferentielDb().find().toArray();

  // on récupère tous les couples UAI/SIRET depuis les effectifs en faisant un lookup effectifs - organismes
  const allCouplesUaiSiretTdb = await effectifsDb()
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

  logger.info(">", allCouplesUaiSiretTdb.length, "couples UAI/SIRET trouvés en db");

  // Traitement // sur tous les couples identifiés
  await PromisePool.for(allCouplesUaiSiretTdb).process(async (coupleUaiSiretTdb) => {
    await buildFiabilisationCoupleForTdbCouple(coupleUaiSiretTdb, allCouplesUaiSiretTdb, organismesFromReferentiel);
  });

  // on insère les mapping de fiabilisation présents dans le fichier JSON créé à la main
  // cette source est prioritaire par rapport à l'analyse faite plus haut
  // on remplace donc la fiabilisation à faire si déjà existante
  await insertManualMappingsFromFile();

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
  const nbCouplesNonFiabilisablesMapping = await fiabilisationUaiSiretDb().countDocuments({
    type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_MAPPING,
  });
  const nbCouplesNonFiabilisablesPbCollecte = await fiabilisationUaiSiretDb().countDocuments({
    type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_PB_COLLECTE,
  });

  logger.info(
    ` -> ${nbCouplesFiablesFound} couples déjà fiables (${getPercentage(
      nbCouplesFiablesFound,
      allCouplesUaiSiretTdb.length
    )}%)`
  );
  logger.info(` -> ${nbCouplesAFiabiliser} nouveaux couples à fiabiliser`);
  logger.info(
    ` -> ${
      nbCouplesNonFiabilisablesUaiNonValidee + nbCouplesNonFiabilisablesMapping + nbCouplesNonFiabilisablesPbCollecte
    } couples ne peuvent pas être fiabilisés automatiquement (${getPercentage(
      nbCouplesNonFiabilisablesUaiNonValidee + nbCouplesNonFiabilisablesMapping + nbCouplesNonFiabilisablesPbCollecte,
      allCouplesUaiSiretTdb.length
    )}%)`
  );

  logger.info(
    ` -> dont ${nbCouplesNonFiabilisablesUaiNonValidee} non fiabilisables car UAI non validée dans le Référentiel`
  );
  logger.info(` -> dont ${nbCouplesNonFiabilisablesMapping} non fiabilisables à cause du mapping.`);
  logger.info(` -> dont ${nbCouplesNonFiabilisablesPbCollecte} non fiabilisables à cause d'un problème de collecte.`);

  await createJobEvent({
    jobname: "fiabilisation:uai-siret:build",
    date: new Date(),
    action: "ending",
    data: {
      nbCouplesDejaFiables: nbCouplesFiablesFound,
      nbCouplesDejaFiablesPercentage: getPercentage(nbCouplesFiablesFound, allCouplesUaiSiretTdb.length),
      nbNouveauxCouplesAFiabiliser: nbCouplesAFiabiliser,
      nbCouplesNonFiabilisablesUaiNonValidee,
      nbCouplesNonFiabilisablesMapping,
      nbCouplesNonFiabilisablesPbCollecte,
      nbCouplesNonFiabilisables:
        nbCouplesNonFiabilisablesUaiNonValidee + nbCouplesNonFiabilisablesMapping + nbCouplesNonFiabilisablesPbCollecte,
      nbCouplesNonFiabilisablesPercentage: getPercentage(
        nbCouplesNonFiabilisablesUaiNonValidee + nbCouplesNonFiabilisablesMapping + nbCouplesNonFiabilisablesPbCollecte,
        allCouplesUaiSiretTdb.length
      ),
    },
  });

  return {
    nbCouplesDejaFiables: nbCouplesFiablesFound,
    nbCouplesDejaFiablesPercentage: getPercentage(nbCouplesFiablesFound, allCouplesUaiSiretTdb.length),
    nbNouveauxCouplesAFiabiliser: nbCouplesAFiabiliser,
    nbCouplesNonFiabilisablesUaiNonValidee,
    nbCouplesNonFiabilisablesMapping,
    nbCouplesNonFiabilisables: nbCouplesNonFiabilisablesUaiNonValidee + nbCouplesNonFiabilisablesMapping,
    nbCouplesNonFiabilisablesPercentage: getPercentage(
      nbCouplesNonFiabilisablesUaiNonValidee + nbCouplesNonFiabilisablesMapping,
      allCouplesUaiSiretTdb.length
    ),
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

  // Règle n°6 on vérifie les UAI non trouvées dans les lieux du référentiel
  if (await checkUaiAucunLieuReferentiel(coupleUaiSiretTdbToCheck)) return;

  // Règle n°7 on vérifie les couples non fiabilisables, si l'UAI est validée cotée référentiel
  if (await checkCoupleNonFiabilisable(coupleUaiSiretTdbToCheck)) return;
};
