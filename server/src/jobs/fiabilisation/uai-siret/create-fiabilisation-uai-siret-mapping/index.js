import logger from "../../../../common/logger.js";
import {
  dossiersApprenantsDb,
  fiabilisationUaiSiretDb,
  referentielSiretUaiDb,
} from "../../../../common/model/collections.js";
import { asyncForEach } from "../../../../common/utils/asyncUtils.js";
import { FIABILISATION_MAPPINGS as manualMapping } from "./mapping.js";

const filters = {
  annee_scolaire: { $in: ["2022-2022", "2022-2023", "2023-2023"] },
};

const insertInFiabilisationMappingIfNotExist = async (mapping) => {
  const coupleFromDb = await fiabilisationUaiSiretDb().findOne({ uai: mapping.uai, siret: mapping.siret });
  if (coupleFromDb) return;

  return await fiabilisationUaiSiretDb().insertOne({ created_at: new Date(), ...mapping });
};

/**
 * Méthode de création de la collection de mapping pour fiabilisation couples UAI SIRET
 */
export const createFiabilisationUaiSiretMapping = async () => {
  // on récupère tous les couples UAI/SIRET depuis les dossiers apprenants
  const allCouplesUaiSiretTdb = await dossiersApprenantsDb()
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

  const cannotMakeFiable = [];
  let couplesFiablesFound = 0;
  let fiabilisationMappingInsertedCount = 0;
  await asyncForEach(allCouplesUaiSiretTdb, async (coupleUaiSiretTdb) => {
    const organismeFoundInReferentielViaSiret = await referentielSiretUaiDb().findOne({
      siret: coupleUaiSiretTdb.siret,
    });

    // si le SIRET et l'UAI lié trouvés dans le référentiel sont ok, rien à faire
    if (organismeFoundInReferentielViaSiret && organismeFoundInReferentielViaSiret.uai === coupleUaiSiretTdb.uai) {
      couplesFiablesFound++;
      return;
    }

    // cas où on trouve un organisme unique dans le référentiel avec l'UAI du couple mais que le SIRET du couple
    // - est vide
    // - n'est pas le même dans le référentiel
    // alors on remplace le SIRET par celui trouvé dans le référentiel si l'UAI n'est pas présent
    // dans un autre couple TDB
    const organismesFoundInReferentielViaUai = await referentielSiretUaiDb()
      .find({
        uai: coupleUaiSiretTdb.uai,
      })
      .toArray();
    const organismeUniqueFoundInReferentielViaUai =
      organismesFoundInReferentielViaUai.length === 1 ? organismesFoundInReferentielViaUai[0] : null;

    const siretIsSubjectToUpdate =
      !coupleUaiSiretTdb.siret || coupleUaiSiretTdb.siret !== organismeUniqueFoundInReferentielViaUai?.siret;
    const uaiUniqueAmongAllCouplesTdb =
      allCouplesUaiSiretTdb.filter(({ uai }) => {
        return uai === coupleUaiSiretTdb.uai;
      }).length === 1;
    if (siretIsSubjectToUpdate && !!organismeUniqueFoundInReferentielViaUai && uaiUniqueAmongAllCouplesTdb) {
      const result = await insertInFiabilisationMappingIfNotExist({
        uai: coupleUaiSiretTdb.uai,
        siret: coupleUaiSiretTdb.siret,
        uai_fiable: coupleUaiSiretTdb.uai,
        siret_fiable: organismeUniqueFoundInReferentielViaUai.siret,
      });
      if (result) fiabilisationMappingInsertedCount++;
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
      const result = await insertInFiabilisationMappingIfNotExist({
        uai: coupleUaiSiretTdb.uai,
        siret: coupleUaiSiretTdb.siret,
        uai_fiable: organismeFoundInReferentielViaSiret.uai,
        siret_fiable: coupleUaiSiretTdb.siret,
      });
      if (result) fiabilisationMappingInsertedCount++;
      return;
    }

    cannotMakeFiable.push({ uai: coupleUaiSiretTdb.uai, siret: coupleUaiSiretTdb.siret });
  });

  // on insère les mapping de fiabilisation présents dans le fichier JSON créé à la main
  // cette source est prioritaire par rapport à l'analyse faite plus haut
  // on remplace donc la fiabilisation à faire si déjà existante
  await asyncForEach(manualMapping, async (mapping) => {
    const alreadyExists = await fiabilisationUaiSiretDb().findOne({ uai: mapping.uai, siret: mapping.siret });
    if (alreadyExists) {
      await fiabilisationUaiSiretDb().updateOne({ uai: mapping.uai, siret: mapping.siret }, { $set: mapping });
    } else {
      await fiabilisationUaiSiretDb().insertOne({ ...mapping, created_at: new Date() });
      fiabilisationMappingInsertedCount++;
    }
  });

  logger.info(couplesFiablesFound, "sont déjà fiables");
  logger.info(fiabilisationMappingInsertedCount, "nouveaux couples à fiabiliser insérés en base");
  logger.info(cannotMakeFiable.length, "couples ne peuvent pas être fiabilisés automatiquement");
};
