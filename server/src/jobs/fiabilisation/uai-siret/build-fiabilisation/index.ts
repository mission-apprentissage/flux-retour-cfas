import { NATURE_ORGANISME_DE_FORMATION } from "../../../../common/constants/natureOrganismeConstants.js";
import { PromisePool } from "@supercharge/promise-pool";
import { createJobEvent } from "../../../../common/actions/jobEvents.actions.js";
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

  // TODO Refacto split
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

  // TODO Refacto split
  // cas où on trouve un organisme via le SIRET mais que l'UAI lié n'est pas celui du couple
  // alors on remplace l'UAI du couple par celui du référentiel si il existe et que le SIRET du couple n'est
  // pas présent dans un autre couple TDB
  // const siretUniqueAmongAllCouplesTdb =
  //   allCouplesUaiSiretTdb.filter(({ siret }) => {
  //     return siret === coupleUaiSiretTdbToCheck.siret;
  //   }).length === 1;

  // if (
  //   !!organismeFoundInReferentielViaSiret?.uai &&
  //   organismeFoundInReferentielViaSiret.uai !== coupleUaiSiretTdbToCheck.uai &&
  //   siretUniqueAmongAllCouplesTdb
  // ) {
  //   await fiabilisationUaiSiretDb().updateOne(
  //     { uai: coupleUaiSiretTdbToCheck.uai, siret: coupleUaiSiretTdbToCheck.siret },
  //     {
  //       $set: {
  //         uai_fiable: organismeFoundInReferentielViaSiret.uai,
  //         siret_fiable: coupleUaiSiretTdbToCheck.siret,
  //         type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER,
  //       },
  //     },
  //     { upsert: true }
  //   );
  //   return;
  // }

  // TODO Refacto split
  // CAS 2 - UAI Multiples
  // Si SIRET du TdB n'est pas unique dans tous les couples du TDB = Match SIRET & plusieurs UAI pour ce SIRET dans le TDB
  // if (!siretUniqueAmongAllCouplesTdb && organismeFoundInReferentielViaSiret) {
  //   // Récupération de la liste des couples avec UAI multiples pour ce match SIRET
  //   const couplesUaiMultiplesInTdbForSiretMatch = allCouplesUaiSiretTdb.filter(({ siret }) => {
  //     return siret === coupleUaiSiretTdbToCheck.siret;
  //   });

  //   // Pour chaque UAI de la liste on cherche dans le référentiel s’il existe un ou plusieurs responsable ou responsable formateur
  //   await PromisePool.for(couplesUaiMultiplesInTdbForSiretMatch).process(async (currentMultipleUaisCouple: any) => {
  //     // on recherche dans le référentiel un unique organisme avec cet UAI de nature responsable ou responsable formateur
  //     const organismesRespOrRespFormateurForUaiTdb = await organismesReferentielDb()
  //       .find({
  //         uai: currentMultipleUaisCouple.uai,
  //         $or: [
  //           { nature: NATURE_ORGANISME_DE_FORMATION.RESPONSABLE_FORMATEUR },
  //           { nature: NATURE_ORGANISME_DE_FORMATION.RESPONSABLE },
  //         ],
  //       })
  //       .toArray();

  //     // si UAI unique au niveau du référentiel alors on cherche dans les relations puis dans les lieux de formation
  //     if (organismesRespOrRespFormateurForUaiTdb.length === 1) {
  //       // Phase 1. Recherche dans les relations
  //       const relationsReponsableWithSiret =
  //         organismesRespOrRespFormateurForUaiTdb[0]?.relations?.filter((item) => item.siret) || [];

  //       if (relationsReponsableWithSiret) {
  //         // Pour chacune des relations du responsable si l'UAI Match alors on peut fiabiliser en remplacant le siret de la relation
  //         for (const currentRelation of relationsReponsableWithSiret) {
  //           // On vérifie si la relation match sur l'UAI
  //           const relationMatchingUai = await organismesReferentielDb().countDocuments({
  //             siret: currentRelation.siret as string,
  //             uai: currentMultipleUaisCouple.uai,
  //           });

  //           // SI Match Relation UAI alors on ajoute le couple à fiabiliser avec cet UAI
  //           if (relationMatchingUai > 0) {
  //             await fiabilisationUaiSiretDb().updateOne(
  //               { uai: coupleUaiSiretTdbToCheck.uai, siret: coupleUaiSiretTdbToCheck.siret },
  //               {
  //                 $set: {
  //                   uai_fiable: currentMultipleUaisCouple.uai,
  //                   siret_fiable: coupleUaiSiretTdbToCheck.siret,
  //                   type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER,
  //                 },
  //               },
  //               { upsert: true }
  //             );

  //             return;
  //           }
  //         }
  //       }

  //       // Phase 2. Recherche dans les lieux de formation
  //       const lieuFormationFiableMatchUai = organismesRespOrRespFormateurForUaiTdb[0].lieux_de_formation.find(
  //         (item) => item.uai === currentMultipleUaisCouple.uai && item.uai_fiable
  //       );

  //       // Si l'UAI Match sur un des lieux fiables alors on peut fiabiliser tel quel en marquant que c'est un couple de lieu de formation
  //       if (lieuFormationFiableMatchUai) {
  //         await fiabilisationUaiSiretDb().updateOne(
  //           { uai: coupleUaiSiretTdbToCheck.uai, siret: coupleUaiSiretTdbToCheck.siret },
  //           {
  //             $set: {
  //               uai_fiable: coupleUaiSiretTdbToCheck.uai,
  //               siret_fiable: coupleUaiSiretTdbToCheck.siret,
  //               type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER,
  //             },
  //           },
  //           { upsert: true }
  //         );

  //         return;
  //       }
  //     }
  //   });
  // }

  // TODO Refacto split
  // CAS 2 - SIRET Multiples
  // if (!uaiUniqueAmongAllCouplesTdb && organismeUniqueFoundInReferentielViaUai) {
  //   // Récupération de la liste des couples avec SIRET multiples pour ce match UAI
  //   const couplesSIRETMultiplesInTdbForUaiMatch = allCouplesUaiSiretTdb.filter(({ uai }) => {
  //     return uai === coupleUaiSiretTdbToCheck.uai;
  //   });

  //   // Pour chaque SIRET de la liste on cherche dans le référentiel s’il existe un ou plusieurs responsable ou responsable formateur
  //   await PromisePool.for(couplesSIRETMultiplesInTdbForUaiMatch).process(async (currentMultipleSiretCouple: any) => {
  //     // on recherche dans le référentiel un unique organisme avec cet UAI de nature responsable ou responsable formateur
  //     const organismesRespOrRespFormateurForSiretTdb = await organismesReferentielDb()
  //       .find({
  //         siret: currentMultipleSiretCouple.siret,
  //         $or: [
  //           { nature: NATURE_ORGANISME_DE_FORMATION.RESPONSABLE_FORMATEUR },
  //           { nature: NATURE_ORGANISME_DE_FORMATION.RESPONSABLE },
  //         ],
  //       })
  //       .toArray();

  //     // si SIRET unique au niveau du référentiel alors on y associe l'UAI présent dans référentiel
  //     if (organismesRespOrRespFormateurForSiretTdb.length === 1) {
  //       // TODO en attente
  //     }
  //   });
  // }

  // TODO Refacto split
  // Identification des pb de collecte : match via SIRET mais UAI n'est dans aucun lieu du référentiel
  // const organismesMatchsUaiInLieuxReferentiel = await organismesReferentielDb().countDocuments({
  //   "lieux_de_formation.uai": coupleUaiSiretTdbToCheck.uai,
  // });

  // if (organismesMatchsUaiInLieuxReferentiel === 0) {
  //   await fiabilisationUaiSiretDb().updateOne(
  //     { uai: coupleUaiSiretTdbToCheck.uai, siret: coupleUaiSiretTdbToCheck.siret },
  //     { $set: { type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_PB_COLLECTE } },
  //     { upsert: true }
  //   );

  //   // MAJ du statut de l'organisme lié
  //   await organismesDb().updateOne(
  //     { uai: coupleUaiSiretTdbToCheck.uai, siret: coupleUaiSiretTdbToCheck.siret },
  //     { $set: { fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.NON_FIABILISABLE_PB_COLLECTE } }
  //   );
  // }

  // TODO Refacto split
  // // Si aucune entrée déja ajoutée à la table de fiabilisation pour ce couple on marque le couple non fiabilisable selon le cas
  // if (
  //   (await fiabilisationUaiSiretDb().countDocuments({
  //     uai: coupleUaiSiretTdbToCheck.uai,
  //     siret: coupleUaiSiretTdbToCheck.siret,
  //   })) === 0
  // ) {
  //   // On est dans le cas d'un couple NON_FIABILISABLE
  //   // On distingue le cas ou l'UAI du tdb n'est pas présente dans le Référentiel du cas ou l'on ne sait pas mapper le couple
  //   const isUaiPresentInReferentiel =
  //     (await organismesReferentielDb().countDocuments({ uai: coupleUaiSiretTdbToCheck.uai })) > 0;

  //   // Upsert du couple avec statut de fiabilisation comme NON_FIABILISABLE en fonction de la présence de l'uai dans le référentiel
  //   await fiabilisationUaiSiretDb().updateOne(
  //     { uai: coupleUaiSiretTdbToCheck.uai, siret: coupleUaiSiretTdbToCheck.siret },
  //     {
  //       $set: {
  //         type: isUaiPresentInReferentiel
  //           ? STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_MAPPING
  //           : STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_UAI_NON_VALIDEE,
  //       },
  //     },
  //     { upsert: true }
  //   );

  //   // Maj de l'organisme lié avec { bypassDocumentValidation: true } si siret vide
  //   await organismesDb().updateOne(
  //     { uai: coupleUaiSiretTdbToCheck.uai, siret: coupleUaiSiretTdbToCheck.siret },
  //     {
  //       $set: {
  //         fiabilisation_statut: isUaiPresentInReferentiel
  //           ? STATUT_FIABILISATION_ORGANISME.NON_FIABILISABLE_MAPPING
  //           : STATUT_FIABILISATION_ORGANISME.NON_FIABILISABLE_UAI_NON_VALIDEE,
  //       },
  //     },
  //     { bypassDocumentValidation: true }
  //   );
  // }
};

/**
 *
 * @param organismeFoundInReferentielViaSiret
 * @param coupleUaiSiretTdbToCheck
 * @returns
 */
export const checkCoupleFiable = async (coupleUaiSiretTdbToCheck, organismesFromReferentiel) => {
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

    // MAJ du statut de l'organisme lié
    await organismesDb().updateOne(
      { uai: coupleUaiSiretTdbToCheck.uai, siret: coupleUaiSiretTdbToCheck.siret },
      { $set: { fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.FIABLE } }
    );
    return true;
  }

  return false;
};
