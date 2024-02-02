import {
  STATUT_FIABILISATION_COUPLES_UAI_SIRET,
  STATUT_FIABILISATION_ORGANISME,
  NATURE_ORGANISME_DE_FORMATION,
} from "shared";
import { OrganismesReferentiel } from "shared/models/data/@types";

import { isOrganismeFiableForCouple } from "@/common/actions/engine/engine.organismes.utils";
import { fiabilisationUaiSiretDb, organismesDb, organismesReferentielDb } from "@/common/model/collections";

/**
 * Règle de vérification des couples fiables
 * Si le SIRET et l'UAI lié trouvés dans le référentiel sont ok, couple déjà fiable, on le stocke et passe au suivant
 * @param organismeFoundInReferentielViaSiret
 * @param coupleUaiSiretTdbToCheck
 * @returns
 */
export const checkCoupleFiable = async (
  coupleUaiSiretTdbToCheck,
  organismesFromReferentiel: OrganismesReferentiel[] = []
) => {
  const organismeFiableForCouple = await isOrganismeFiableForCouple(
    coupleUaiSiretTdbToCheck.uai,
    coupleUaiSiretTdbToCheck.siret,
    organismesFromReferentiel
  );

  if (organismeFiableForCouple) {
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

/**
 * Règle de vérification des couples à fiabiliser via match Référentiel sur l'UAI
 * cas où on trouve un organisme unique dans le référentiel avec l'UAI du couple mais que le SIRET du couple
 * - est vide
 * - n'est pas le même dans le référentiel
 * alors on remplace le SIRET par celui trouvé dans le référentiel si l'UAI n'est pas présent dans un autre couple du TDB
 */
export const checkMatchReferentielUaiUniqueSiretDifferent = async (
  coupleUaiSiretTdbToCheck,
  organismesFromReferentiel,
  allCouplesUaiSiretTdb
) => {
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
    return true;
  }

  return false;
};

/**
 * Règle de vérification des couples à fiabiliser via match Référentiel sur le SIRET
 * cas où on trouve un organisme via le SIRET mais que l'UAI lié n'est pas celui du couple
 * alors on remplace l'UAI du couple par celui du référentiel si il existe et que le SIRET du couple n'est pas présent dans un autre couple TDB
 */
export const checkMatchReferentielSiretUaiDifferent = async (
  coupleUaiSiretTdbToCheck,
  organismesFromReferentiel,
  allCouplesUaiSiretTdb
) => {
  const organismeFoundInReferentielViaSiret = organismesFromReferentiel.find(
    (item) => item.siret === coupleUaiSiretTdbToCheck.siret
  );

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
    return true;
  }

  return false;
};

/**
 * Règle de vérification des couples à fiabiliser via analyse des UAI Multiples
 * @param coupleUaiSiretTdbToCheck
 * @param allCouplesUaiSiretTdb
 * @param organismesFromReferentiel
 * @returns
 */
export const checkUaiMultiplesRelationsAndLieux = async (
  coupleUaiSiretTdbToCheck,
  allCouplesUaiSiretTdb,
  organismesFromReferentiel
) => {
  const siretUniqueAmongAllCouplesTdb =
    allCouplesUaiSiretTdb.filter(({ siret }) => {
      return siret === coupleUaiSiretTdbToCheck.siret;
    }).length === 1;

  const organismeFoundInReferentielViaSiret = organismesFromReferentiel.find(
    (item) => item.siret === coupleUaiSiretTdbToCheck.siret
  );

  // Si SIRET du TdB n'est pas unique dans tous les couples du TDB = Match SIRET & plusieurs UAI pour ce SIRET dans le TDB
  if (!siretUniqueAmongAllCouplesTdb && organismeFoundInReferentielViaSiret) {
    // Récupération de la liste des couples avec UAI multiples pour ce match SIRET
    const couplesUaiMultiplesInTdbForSiretMatch = allCouplesUaiSiretTdb.filter(({ siret }) => {
      return siret === coupleUaiSiretTdbToCheck.siret;
    });

    // Pour chaque UAI de la liste on cherche dans le référentiel s’il existe un ou plusieurs responsable ou responsable formateur
    for (const currentMultipleUaisCouple of couplesUaiMultiplesInTdbForSiretMatch) {
      // on recherche dans le référentiel un unique organisme avec cet UAI de nature responsable ou responsable formateur
      const organismesRespOrRespFormateurForUaiTdb = await organismesReferentielDb()
        .find({
          uai: currentMultipleUaisCouple.uai,
          $or: [
            { nature: NATURE_ORGANISME_DE_FORMATION.RESPONSABLE_FORMATEUR },
            { nature: NATURE_ORGANISME_DE_FORMATION.RESPONSABLE },
          ],
        })
        .toArray();

      // si UAI unique au niveau du référentiel alors on cherche dans les relations puis dans les lieux de formation
      if (organismesRespOrRespFormateurForUaiTdb.length === 1) {
        // Phase 1. Recherche dans les relations
        const relationsReponsableWithSiret =
          organismesRespOrRespFormateurForUaiTdb[0]?.relations?.filter((item) => item.siret) || [];

        if (relationsReponsableWithSiret) {
          // Pour chacune des relations du responsable si l'UAI Match alors on peut fiabiliser en remplacant le siret de la relation
          for (const currentRelation of relationsReponsableWithSiret) {
            // On vérifie si la relation match sur l'UAI
            const relationMatchingUai = await organismesReferentielDb().countDocuments({
              siret: currentRelation.siret as string,
              uai: currentMultipleUaisCouple.uai,
            });

            // SI Match Relation UAI alors on ajoute le couple à fiabiliser avec cet UAI
            if (relationMatchingUai > 0) {
              await fiabilisationUaiSiretDb().updateOne(
                { uai: coupleUaiSiretTdbToCheck.uai, siret: coupleUaiSiretTdbToCheck.siret },
                {
                  $set: {
                    uai_fiable: currentMultipleUaisCouple.uai,
                    siret_fiable: coupleUaiSiretTdbToCheck.siret,
                    type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER,
                  },
                },
                { upsert: true }
              );

              return true;
            }
          }
        }

        // Phase 2. Recherche dans les lieux de formation
        const lieuFormationFiableMatchUai = organismesRespOrRespFormateurForUaiTdb[0].lieux_de_formation.find(
          (item) => item.uai === currentMultipleUaisCouple.uai && item.uai_fiable
        );

        // Si l'UAI Match sur un des lieux fiables alors on peut fiabiliser tel quel en marquant que c'est un couple de lieu de formation
        if (lieuFormationFiableMatchUai) {
          await fiabilisationUaiSiretDb().updateOne(
            { uai: coupleUaiSiretTdbToCheck.uai, siret: coupleUaiSiretTdbToCheck.siret },
            {
              $set: {
                uai_fiable: coupleUaiSiretTdbToCheck.uai,
                siret_fiable: coupleUaiSiretTdbToCheck.siret,
                type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER,
              },
            },
            { upsert: true }
          );

          return true;
        }
      }
    }
  }

  return false;
};

/**
 * Règle de vérification des couples à fiabiliser via analyse des SIRET Multiples
 * @param coupleUaiSiretTdbToCheck
 * @param allCouplesUaiSiretTdb
 * @param organismesFromReferentiel
 */
export const checkSiretMultiplesRelationsAndLieux = async (
  coupleUaiSiretTdbToCheck,
  allCouplesUaiSiretTdb,
  organismesFromReferentiel
) => {
  const uaiUniqueAmongAllCouplesTdb =
    allCouplesUaiSiretTdb.filter(({ uai }) => {
      return uai === coupleUaiSiretTdbToCheck.uai;
    }).length === 1;

  const organismesFoundInReferentielViaUai = organismesFromReferentiel.filter(
    (item) => item.uai === coupleUaiSiretTdbToCheck.uai
  );

  const organismeUniqueFoundInReferentielViaUai =
    organismesFoundInReferentielViaUai.length === 1 ? organismesFoundInReferentielViaUai[0] : null;

  if (!uaiUniqueAmongAllCouplesTdb && organismeUniqueFoundInReferentielViaUai) {
    // Récupération de la liste des couples avec SIRET multiples pour ce match UAI
    const couplesSIRETMultiplesInTdbForUaiMatch = allCouplesUaiSiretTdb.filter(({ uai }) => {
      return uai === coupleUaiSiretTdbToCheck.uai;
    });

    // Pour chaque SIRET de la liste on cherche dans le référentiel s’il existe un ou plusieurs responsable ou responsable formateur
    for (const currentMultipleSiretCouple of couplesSIRETMultiplesInTdbForUaiMatch) {
      // on recherche dans le référentiel un unique organisme avec cet UAI de nature responsable ou responsable formateur
      const organismesRespOrRespFormateurForSiretTdb = await organismesReferentielDb()
        .find({
          siret: currentMultipleSiretCouple.siret,
          $or: [
            { nature: NATURE_ORGANISME_DE_FORMATION.RESPONSABLE_FORMATEUR },
            { nature: NATURE_ORGANISME_DE_FORMATION.RESPONSABLE },
          ],
        })
        .toArray();

      // si SIRET unique au niveau du référentiel alors on y associe l'UAI présent dans référentiel
      if (organismesRespOrRespFormateurForSiretTdb.length === 1) {
        // Phase 1. Recherche dans les relations
        const relationsReponsableWithSiret =
          organismesRespOrRespFormateurForSiretTdb[0]?.relations?.filter((item) => item.siret) || [];

        if (relationsReponsableWithSiret) {
          // Pour chacune des relations du responsable si l'UAI Match alors on peut fiabiliser en remplacant le siret de la relation
          for (const currentRelation of relationsReponsableWithSiret) {
            // On vérifie si la relation match sur l'UAI
            const relationMatchingUai = await organismesReferentielDb().countDocuments({
              siret: currentRelation.siret as string,
              uai: currentMultipleSiretCouple.uai,
            });

            // SI Match Relation UAI alors on ajoute le couple à fiabiliser avec cet UAI
            if (relationMatchingUai > 0) {
              await fiabilisationUaiSiretDb().updateOne(
                { uai: coupleUaiSiretTdbToCheck.uai, siret: coupleUaiSiretTdbToCheck.siret },
                {
                  $set: {
                    uai_fiable: currentMultipleSiretCouple.uai,
                    siret_fiable: coupleUaiSiretTdbToCheck.siret,
                    type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER,
                  },
                },
                { upsert: true }
              );

              return true;
            }
          }
        }

        // Phase 2. Recherche dans les lieux de formation
        const lieuFormationFiableMatchUai = organismesRespOrRespFormateurForSiretTdb[0].lieux_de_formation.find(
          (item) => item.uai === currentMultipleSiretCouple.uai && item.uai_fiable
        );

        // Si l'UAI Match sur un des lieux fiables alors on peut fiabiliser tel quel en marquant que c'est un couple de lieu de formation
        if (lieuFormationFiableMatchUai) {
          await fiabilisationUaiSiretDb().updateOne(
            { uai: coupleUaiSiretTdbToCheck.uai, siret: coupleUaiSiretTdbToCheck.siret },
            {
              $set: {
                uai_fiable: coupleUaiSiretTdbToCheck.uai,
                siret_fiable: coupleUaiSiretTdbToCheck.siret,
                type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER,
              },
            },
            { upsert: true }
          );

          return true;
        }
      }
    }
  }

  return false;
};

/**
 * Règle de vérification des problèmes de collecte : UAI non trouvée dans les lieux du référentiel
 * @param coupleUaiSiretTdbToCheck
 * @returns
 */
export const checkUaiAucunLieuReferentiel = async (coupleUaiSiretTdbToCheck) => {
  // Identification des pb de collecte : UAI n'est dans aucun lieu du référentiel
  const organismesMatchsUaiInLieuxReferentiel = await organismesReferentielDb().countDocuments({
    "lieux_de_formation.uai": coupleUaiSiretTdbToCheck.uai,
  });

  if (organismesMatchsUaiInLieuxReferentiel === 0) {
    await fiabilisationUaiSiretDb().updateOne(
      { uai: coupleUaiSiretTdbToCheck.uai, siret: coupleUaiSiretTdbToCheck.siret },
      { $set: { type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_PB_COLLECTE } },
      { upsert: true }
    );
    // MAJ du statut de l'organisme lié
    await organismesDb().updateOne(
      { uai: coupleUaiSiretTdbToCheck.uai, siret: coupleUaiSiretTdbToCheck.siret },
      { $set: { fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.NON_FIABILISABLE_PB_COLLECTE } }
    );
    return true;
  }

  return false;
};

/**
 * Règle de vérification de la présence de l'UAI dans les lieux du référentiel
 * Si jamais on trouve l'uai dans un des lieux on peut fiabiliser avec le siret de l'organisme ayant ces lieux
 * @param coupleUaiSiretTdbToCheck
 * @returns
 */
export const checkUaiLieuReferentiel = async ({ uai, siret }) => {
  const organismesMatchsUaiInLieuxReferentiel = await organismesReferentielDb()
    .find({ "lieux_de_formation.uai": uai })
    .toArray();

  if (organismesMatchsUaiInLieuxReferentiel.length === 1) {
    // Si match unique et uai existant dans le référentiel on peut fiabiliser un couple lieu avec le siret de l'organisme du référentiel
    await fiabilisationUaiSiretDb().updateOne(
      { uai, siret },
      {
        $set: {
          siret_fiable: organismesMatchsUaiInLieuxReferentiel[0].siret,
          uai_fiable: uai,
          type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER,
        },
      },
      { upsert: true }
    );

    return true;
  }

  return false;
};

/**
 * Règle de vérification des couples non fiabilisables, si UAI est validée dans le référentiel ou non
 */
export const checkCoupleNonFiabilisable = async (coupleUaiSiretTdbToCheck) => {
  // Si aucune entrée déjà ajoutée à la table de fiabilisation pour ce couple on marque le couple non fiabilisable selon le cas
  if (
    (await fiabilisationUaiSiretDb().countDocuments({
      uai: coupleUaiSiretTdbToCheck.uai,
      siret: coupleUaiSiretTdbToCheck.siret,
    })) === 0
  ) {
    // On est dans le cas d'un couple NON_FIABILISABLE
    // On distingue le cas ou l'UAI du tdb n'est pas présente dans le Référentiel du cas ou l'on ne sait pas mapper le couple
    const isUaiPresentInReferentiel =
      (await organismesReferentielDb().countDocuments({ uai: coupleUaiSiretTdbToCheck.uai })) > 0;

    // Ajout du couple avec statut de fiabilisation comme NON_FIABILISABLE en fonction de la présence de l'uai dans le référentiel
    await fiabilisationUaiSiretDb().insertOne({
      uai: coupleUaiSiretTdbToCheck.uai,
      siret: coupleUaiSiretTdbToCheck.siret,
      type: isUaiPresentInReferentiel
        ? STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_UAI_VALIDEE
        : STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_UAI_NON_VALIDEE,
    });

    // Maj de l'organisme lié avec { bypassDocumentValidation: true } si siret vide
    await organismesDb().updateOne(
      { uai: coupleUaiSiretTdbToCheck.uai, siret: coupleUaiSiretTdbToCheck.siret },
      {
        $set: {
          fiabilisation_statut: isUaiPresentInReferentiel
            ? STATUT_FIABILISATION_ORGANISME.NON_FIABILISABLE_UAI_VALIDEE
            : STATUT_FIABILISATION_ORGANISME.NON_FIABILISABLE_UAI_NON_VALIDEE,
        },
      },
      { bypassDocumentValidation: true }
    );

    return true;
  }

  return false;
};
