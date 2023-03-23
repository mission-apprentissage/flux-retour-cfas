import { PromisePool } from "@supercharge/promise-pool";
import { createJobEvent } from "../../../../common/actions/jobEvents.actions.js";
import { STATUT_FIABILISATION_COUPLES_UAI_SIRET } from "../../../../common/constants/fiabilisationConstants.js";
import logger from "../../../../common/logger.js";
import { effectifsDb, fiabilisationUaiSiretDb, organismesReferentielDb } from "../../../../common/model/collections.js";
import { getPercentage } from "../../../../common/utils/miscUtils.js";
import { insertManualMappingsFromFile } from "./utils.js";

// Filtres année scolaire pour récupération des couples UAI-SIRET
const filters = { annee_scolaire: { $in: ["2022-2022", "2022-2023", "2023-2023"] } };

/**
 * Fonction de construction de la collection des couples de fiabilisation UAI SIRET
 */
export const buildFiabilisationUaiSiret = async () => {
  logger.info("Clear de la table fiabilisation UAI-SIRET...");
  await fiabilisationUaiSiretDb().deleteMany({});

  // On lance séquentiellement 2 fois la construction de la table de fiabilisation - nécessaire pour prendre en compte tous les cas
  logger.info("Execution du script de fiabilisation sur tous les couples UAI-SIRET...");
  await runFiabilisationOnUaiSiretCouples();
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

  logger.info(allCouplesUaiSiretTdb.length, "couples UAI/SIRET trouvés en db");

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

  logger.info(
    ` -> ${nbCouplesFiablesFound} couples déjà fiables (${getPercentage(
      nbCouplesFiablesFound,
      allCouplesUaiSiretTdb.length
    )}%)`
  );
  logger.info(` -> ${nbCouplesAFiabiliser} nouveaux couples à fiabiliser`);
  logger.info(
    ` -> ${
      nbCouplesNonFiabilisablesUaiNonValidee + nbCouplesNonFiabilisablesMapping
    } couples ne peuvent pas être fiabilisés automatiquement (${getPercentage(
      nbCouplesNonFiabilisablesUaiNonValidee + nbCouplesNonFiabilisablesMapping,
      allCouplesUaiSiretTdb.length
    )}%)`
  );
  logger.info(
    ` -> dont ${nbCouplesNonFiabilisablesUaiNonValidee} non fiabilisables car UAI non validée dans le Référentiel`
  );
  logger.info(` -> dont ${nbCouplesNonFiabilisablesMapping} non fiabilisables à cause du mapping.`);

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
      nbCouplesNonFiabilisables: nbCouplesNonFiabilisablesUaiNonValidee + nbCouplesNonFiabilisablesMapping,
      nbCouplesNonFiabilisablesPercentage: getPercentage(
        nbCouplesNonFiabilisablesUaiNonValidee + nbCouplesNonFiabilisablesMapping,
        allCouplesUaiSiretTdb.length
      ),
    },
  });
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
  const organismeFoundInReferentielViaSiret = organismesFromReferentiel.find(
    (item) => item.siret === coupleUaiSiretTdbToCheck.siret
  );

  // [Couple fiable]
  // Si le SIRET et l'UAI lié trouvés dans le référentiel sont ok, couple déja fiable, on le stocke et passe au suivant
  if (organismeFoundInReferentielViaSiret && organismeFoundInReferentielViaSiret.uai === coupleUaiSiretTdbToCheck.uai) {
    await fiabilisationUaiSiretDb().updateOne(
      { uai: coupleUaiSiretTdbToCheck.uai, siret: coupleUaiSiretTdbToCheck.siret },
      { $set: { type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.FIABLE } },
      { upsert: true }
    );
    return;
  }

  // cas où on trouve un organisme unique dans le référentiel avec l'UAI du couple mais que le SIRET du couple
  // - est vide
  // - n'est pas le même dans le référentiel
  // alors on remplace le SIRET par celui trouvé dans le référentiel si l'UAI n'est pas présent
  // dans un autre couple TDB
  const organismesFoundInReferentielViaUai = organismesFromReferentiel.filter(
    (item) => item.uai === coupleUaiSiretTdbToCheck.uai
  );

  const organismeUniqueFoundInReferentielViaUai =
    organismesFoundInReferentielViaUai.length === 1 ? organismesFoundInReferentielViaUai[0] : null;

  const siretIsSubjectToUpdate =
    !coupleUaiSiretTdbToCheck.siret ||
    coupleUaiSiretTdbToCheck.siret !== organismeUniqueFoundInReferentielViaUai?.siret;

  const uaiUniqueAmongAllCouplesTdb =
    allCouplesUaiSiretTdb.filter(({ uai }) => {
      return uai === coupleUaiSiretTdbToCheck.uai;
    }).length === 1;

  if (siretIsSubjectToUpdate && !!organismeUniqueFoundInReferentielViaUai && uaiUniqueAmongAllCouplesTdb) {
    await fiabilisationUaiSiretDb().updateOne(
      { uai: coupleUaiSiretTdbToCheck.uai, siret: coupleUaiSiretTdbToCheck.siret },
      {
        $set: {
          uai_fiable: coupleUaiSiretTdbToCheck.uai,
          siret_fiable: organismeUniqueFoundInReferentielViaUai.siret,
          type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER,
        },
      },
      { upsert: true }
    );
    return;
  }

  // cas où on trouve un organisme via le SIRET mais que l'UAI lié n'est pas celui du couple
  // alors on remplace l'UAI du couple par celui du référentiel si il existe et que le SIRET du couple n'est
  // pas présent dans un autre couple TDB
  const siretUniqueAmongAllCouplesTdb =
    allCouplesUaiSiretTdb.filter(({ siret }) => {
      return siret === coupleUaiSiretTdbToCheck.siret;
    }).length === 1;

  if (
    !!organismeFoundInReferentielViaSiret?.uai &&
    organismeFoundInReferentielViaSiret.uai !== coupleUaiSiretTdbToCheck.uai &&
    siretUniqueAmongAllCouplesTdb
  ) {
    await fiabilisationUaiSiretDb().updateOne(
      { uai: coupleUaiSiretTdbToCheck.uai, siret: coupleUaiSiretTdbToCheck.siret },
      {
        $set: {
          uai_fiable: organismeFoundInReferentielViaSiret.uai,
          siret_fiable: coupleUaiSiretTdbToCheck.siret,
          type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER,
        },
      },
      { upsert: true }
    );
    return;
  }

  // On est dans le cas d'un couple NON_FIABILISABLE
  // On distingue le cas ou l'UAI du tdb n'est pas présente dans le Référentiel du cas ou l'on ne sait pas mapper le couple
  const isUaiPresentInReferentiel =
    (await organismesReferentielDb().countDocuments({ uai: coupleUaiSiretTdbToCheck.uai })) > 0;

  // Upsert du couple avec statut de fiabilisation comme NON_FIABILISABLE en fonction de la présence de l'uai dans le référentiel
  await fiabilisationUaiSiretDb().updateOne(
    { uai: coupleUaiSiretTdbToCheck.uai, siret: coupleUaiSiretTdbToCheck.siret },
    {
      $set: {
        type: isUaiPresentInReferentiel
          ? STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_MAPPING
          : STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_UAI_NON_VALIDEE,
      },
    },
    { upsert: true }
  );
};
