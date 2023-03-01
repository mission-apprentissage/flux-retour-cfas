import { STATUT_FIABILISATION_COUPLES_UAI_SIRET } from "../../../../common/constants/fiabilisationConstants.js";
import logger from "../../../../common/logger.js";
import {
  dossiersApprenantsMigrationDb,
  fiabilisationUaiSiretDb,
  organismesReferentielDb,
} from "../../../../common/model/collections.js";
import { asyncForEach } from "../../../../common/utils/asyncUtils.js";
import { getPercentage } from "../../../../common/utils/miscUtils.js";
import { FIABILISATION_MAPPINGS as manualMapping } from "../mapping.js";

// Filtres année scolaire pour récupération des couples UAI-SIRET des dossiersApprenants
const filters = {
  annee_scolaire: { $in: ["2022-2022", "2022-2023", "2023-2023"] },
};

/**
 * Méthode d'ajout à la collection fiabilisation si non existant
 * @param {*} fiabilisation
 * @returns
 */
const insertInFiabilisationIfNotExist = async (fiabilisation) => {
  const coupleFromDb = await fiabilisationUaiSiretDb().findOne({
    uai: fiabilisation.uai,
    siret: fiabilisation.siret,
    type: fiabilisation.type,
  });
  if (coupleFromDb) return;
  return await fiabilisationUaiSiretDb().insertOne({ created_at: new Date(), ...fiabilisation });
};

/**
 * Méthode de création de la collection pour fiabilisation couples UAI SIRET
 * TODO : optims upsert
 */
export const buildFiabilisationUaiSiret = async () => {
  const organismesFromReferentiel = await organismesReferentielDb().find().toArray();

  // on récupère tous les couples UAI/SIRET depuis les dossiers apprenants (migration)
  const allCouplesUaiSiretTdb = await dossiersApprenantsMigrationDb()
    .aggregate([
      {
        $match: filters,
      },
      {
        $group: {
          _id: {
            uai: "$uai_etablissement",
            siret: "$siret_etablissement",
          },
        },
      },
      {
        $project: {
          uai: "$_id.uai",
          siret: "$_id.siret",
        },
      },
    ])
    .toArray();

  logger.info(allCouplesUaiSiretTdb.length, "couples UAI/SIRET trouvés en db");
  const alreadyAFiabiliserCount = await fiabilisationUaiSiretDb().countDocuments({
    type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER,
  });

  let nbCouplesNonFiabilisablesMapping = 0;
  let nbCouplesNonFiabilisablesUaiNonValidee = 0;
  let nbCouplesFiablesFound = 0;
  let fiabilisationMappingInsertedCount = 0;

  await asyncForEach(allCouplesUaiSiretTdb, async (coupleUaiSiretTdb) => {
    const organismeFoundInReferentielViaSiret = organismesFromReferentiel.find(
      (item) => item.siret === coupleUaiSiretTdb.siret
    );

    // [Couple fiable]
    // Si le SIRET et l'UAI lié trouvés dans le référentiel sont ok, couple déja fiable, on le stocke et passe au suivant
    if (organismeFoundInReferentielViaSiret && organismeFoundInReferentielViaSiret.uai === coupleUaiSiretTdb.uai) {
      await insertInFiabilisationIfNotExist({
        uai: coupleUaiSiretTdb.uai,
        siret: coupleUaiSiretTdb.siret,
        type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.DEJA_FIABLE,
      });
      nbCouplesFiablesFound++;
      return;
    }

    // cas où on trouve un organisme unique dans le référentiel avec l'UAI du couple mais que le SIRET du couple
    // - est vide
    // - n'est pas le même dans le référentiel
    // alors on remplace le SIRET par celui trouvé dans le référentiel si l'UAI n'est pas présent
    // dans un autre couple TDB
    const organismesFoundInReferentielViaUai = organismesFromReferentiel.filter(
      (item) => item.uai === coupleUaiSiretTdb.uai
    );

    const organismeUniqueFoundInReferentielViaUai =
      organismesFoundInReferentielViaUai.length === 1 ? organismesFoundInReferentielViaUai[0] : null;

    const siretIsSubjectToUpdate =
      !coupleUaiSiretTdb.siret || coupleUaiSiretTdb.siret !== organismeUniqueFoundInReferentielViaUai?.siret;

    const uaiUniqueAmongAllCouplesTdb =
      allCouplesUaiSiretTdb.filter(({ uai }) => {
        return uai === coupleUaiSiretTdb.uai;
      }).length === 1;

    if (siretIsSubjectToUpdate && !!organismeUniqueFoundInReferentielViaUai && uaiUniqueAmongAllCouplesTdb) {
      const result = await insertInFiabilisationIfNotExist({
        uai: coupleUaiSiretTdb.uai,
        siret: coupleUaiSiretTdb.siret,
        uai_fiable: coupleUaiSiretTdb.uai,
        siret_fiable: organismeUniqueFoundInReferentielViaUai.siret,
        type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER,
      });
      if (result) {
        fiabilisationMappingInsertedCount++;
      }
      return;
    }

    // cas où on trouve un organisme via le SIRET mais que l'UAI lié n'est pas celui du couple
    // alors on remplace l'UAI du couple par celui du référentiel si il existe et que le SIRET du couple n'est
    // pas présent dans un autre couple TDB
    const siretUniqueAmongAllCouplesTdb =
      allCouplesUaiSiretTdb.filter(({ siret }) => {
        return siret === coupleUaiSiretTdb.siret;
      }).length === 1;

    if (
      !!organismeFoundInReferentielViaSiret?.uai &&
      organismeFoundInReferentielViaSiret.uai !== coupleUaiSiretTdb.uai &&
      siretUniqueAmongAllCouplesTdb
    ) {
      const result = await insertInFiabilisationIfNotExist({
        uai: coupleUaiSiretTdb.uai,
        siret: coupleUaiSiretTdb.siret,
        uai_fiable: organismeFoundInReferentielViaSiret.uai,
        siret_fiable: coupleUaiSiretTdb.siret,
        type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER,
      });

      if (result) {
        fiabilisationMappingInsertedCount++;
      }
      return;
    }

    // On est dans le cas d'un couple NON_FIABILISABLE
    // On distingue le cas ou l'UAI du tdb n'est pas présente dans le Référentiel du cas ou l'on ne sait pas mapper le couple
    const isUaiPresentInReferentiel =
      (await organismesReferentielDb().countDocuments({ uai: coupleUaiSiretTdb.uai })) > 0;

    // Upsert du couple avec statut de fiabilisation comme NON_FIABILISABLE en fonction de la présence de l'uai dans le référentiel
    if (isUaiPresentInReferentiel) {
      await fiabilisationUaiSiretDb().updateOne(
        { uai: coupleUaiSiretTdb.uai, siret: coupleUaiSiretTdb.siret },
        { $set: { type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_MAPPING } },
        { upsert: true }
      );
      nbCouplesNonFiabilisablesMapping++;
    } else {
      await fiabilisationUaiSiretDb().updateOne(
        { uai: coupleUaiSiretTdb.uai, siret: coupleUaiSiretTdb.siret },
        { $set: { type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_UAI_NON_VALIDEE } },
        { upsert: true }
      );
      nbCouplesNonFiabilisablesUaiNonValidee++;
    }
  });

  // on insère les mapping de fiabilisation présents dans le fichier JSON créé à la main
  // cette source est prioritaire par rapport à l'analyse faite plus haut
  // on remplace donc la fiabilisation à faire si déjà existante
  const nbManualMappingInserted = await insertManualMappingsFromFile();
  fiabilisationMappingInsertedCount += nbManualMappingInserted;

  logger.info(
    ` ${nbCouplesFiablesFound} couples déjà fiables (${getPercentage(
      nbCouplesFiablesFound,
      allCouplesUaiSiretTdb.length
    )}%)`
  );
  logger.info(` ${alreadyAFiabiliserCount} couples déja identifiés à fiabiliser`);
  logger.info(` ${fiabilisationMappingInsertedCount} nouveaux couples à fiabiliser`);
  logger.info(
    ` ${
      nbCouplesNonFiabilisablesUaiNonValidee + nbCouplesNonFiabilisablesMapping
    } couples ne peuvent pas être fiabilisés automatiquement (${getPercentage(
      nbCouplesNonFiabilisablesUaiNonValidee + nbCouplesNonFiabilisablesMapping,
      allCouplesUaiSiretTdb.length
    )}%) dont ${nbCouplesNonFiabilisablesUaiNonValidee} non fiabilisables car UAI non validée dans le Référentiel et ${nbCouplesNonFiabilisablesMapping} non fiabilisable à cause du mapping.`
  );

  return {
    nbCouplesDejaFiables: nbCouplesFiablesFound,
    nbCouplesDejaFiablesPercentage: getPercentage(nbCouplesFiablesFound, allCouplesUaiSiretTdb.length),
    nbCouplesExistantsAFiabiliser: alreadyAFiabiliserCount,
    nbNouveauxCouplesAFiabiliser: fiabilisationMappingInsertedCount,
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
 * Insertion des mapping manuels depuis fichier
 * cette source est prioritaire par rapport à l'analyse faite plus haut
 * on remplace donc la fiabilisation à faire si déjà existante
 * @returns
 */
const insertManualMappingsFromFile = async () => {
  let nbInserted = 0;

  await asyncForEach(manualMapping, async (mapping) => {
    const alreadyExists = await fiabilisationUaiSiretDb().findOne({ uai: mapping.uai, siret: mapping.siret });
    if (alreadyExists) {
      await fiabilisationUaiSiretDb().updateOne({ uai: mapping.uai, siret: mapping.siret }, { $set: mapping });
    } else {
      await fiabilisationUaiSiretDb().insertOne({ ...mapping, created_at: new Date() });
      nbInserted++;
    }
  });

  return nbInserted;
};
