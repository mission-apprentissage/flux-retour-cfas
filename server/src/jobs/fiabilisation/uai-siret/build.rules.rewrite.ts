import { STATUT_FIABILISATION_COUPLES_UAI_SIRET, STATUT_FIABILISATION_ORGANISME } from "shared";

import { NATURE_ORGANISME_DE_FORMATION } from "@/common/constants/organisme";
import { organismesReferentielDb } from "@/common/model/collections";

import { ICouple, ICoupleDefined } from "./REWRITE";

/**
 * Fonction de vérification d'un couple UAI-SIRET correspondant à un organisme fiable
 */
export const isCoupleInReferentiel = async ({ siret, uai }: ICoupleDefined) =>
  (await organismesReferentielDb().countDocuments({ siret, uai, etat_administratif: { $ne: "fermé" } })) > 0;

/**
 * Règle de vérification des couples fiables
 * Si le SIRET et l'UAI lié trouvés dans le référentiel sont ok, couple déjà fiable, on le stocke et passe au suivant
 * @param organismeFoundInReferentielViaSiret
 * @param coupleUaiSiretTdbToCheck
 * @returns
 */
export const checkCoupleFiable_rewrite = async (couple: ICouple) => {
  // Si uai ou siret non fourni alors non fiable
  if (!couple.uai || !couple.siret) return null;

  const foundInReferentiel = await isCoupleInReferentiel(couple as ICoupleDefined);

  if (!foundInReferentiel) {
    return null;
  }

  return {
    ...couple,
    uai_fiable: couple.uai,
    siret_fiable: couple.siret,
    statut_fiabilisation: STATUT_FIABILISATION_COUPLES_UAI_SIRET.FIABLE,
    statut_organisme: STATUT_FIABILISATION_ORGANISME.FIABLE, //
    rule: 1,
  };
};

/**
 * Règle de vérification des couples à fiabiliser via match Référentiel sur l'UAI
 * cas où on trouve un organisme unique dans le référentiel avec l'UAI du couple mais que le SIRET du couple
 * - est vide
 * - n'est pas le même dans le référentiel
 * alors on remplace le SIRET par celui trouvé dans le référentiel si l'UAI n'est pas présent dans un autre couple du TDB
 */
export const checkMatchReferentielUaiUniqueSiretDifferent_rewrite = async (couple: ICouple) => {
  if (!couple.uai) return null;

  const organismesReferentiel = await organismesReferentielDb()
    .find({
      uai: couple.uai,
    })
    .toArray();

  if (organismesReferentiel.length !== 1) return null;

  if (!couple.siret || couple.siret !== organismesReferentiel[0].siret) {
    return {
      ...couple,
      uai_fiable: couple.uai,
      siret_fiable: organismesReferentiel[0].siret,
      statut_fiabilisation: STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER,
      rule: 2,
    };
  }

  return null;
};

/**
 * Règle de vérification des couples à fiabiliser via match Référentiel sur le SIRET
 * cas où on trouve un organisme via le SIRET mais que l'UAI lié n'est pas celui du couple
 * alors on remplace l'UAI du couple par celui du référentiel si il existe et que le SIRET du couple n'est pas présent dans un autre couple TDB
 */
export const checkMatchReferentielSiretUaiDifferent_rewrite = async (couple: ICouple) => {
  if (!couple.siret) return null;

  const organismesReferentiel = await organismesReferentielDb()
    .find({
      siret: couple.siret,
    })
    .toArray();

  if (organismesReferentiel.length !== 1) return null;

  if (!!organismesReferentiel[0].uai && couple.uai !== organismesReferentiel[0].uai) {
    return {
      ...couple,
      uai_fiable: organismesReferentiel[0].uai,
      siret_fiable: couple.siret,
      statut_fiabilisation: STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER,
      rule: 3,
    };
  }

  return null;
};

/**
 * Règle de vérification des couples à fiabiliser via analyse des UAI Multiples
 * @returns
 */
export const checkUaiMultiplesRelationsAndLieux_rewrite = async (couple: ICouple) => {
  if (!couple.siret) return null;

  const organismesReferentiel = await organismesReferentielDb()
    .find({
      siret: couple.siret,
    })
    .toArray();

  if (organismesReferentiel.length !== 1) return null;

  // on recherche dans le référentiel un unique organisme avec cet UAI de nature responsable ou responsable formateur
  const organismesRespOrRespFormateurFromUai = await organismesReferentielDb()
    .find({
      uai: couple.uai,
      $or: [
        { nature: NATURE_ORGANISME_DE_FORMATION.RESPONSABLE_FORMATEUR },
        { nature: NATURE_ORGANISME_DE_FORMATION.RESPONSABLE },
      ],
    })
    .toArray();

  if (organismesRespOrRespFormateurFromUai.length !== 1) return null;

  // si UAI unique au niveau du référentiel alors on cherche dans les relations puis dans les lieux de formation

  // Phase 1. Recherche dans les relations
  const relations = organismesRespOrRespFormateurFromUai[0].relations?.filter((item) => item.siret) || [];

  // Pour chacune des relations du responsable si l'UAI Match alors on peut fiabiliser en remplacant le siret de la relation
  for (const relation of relations) {
    // On vérifie si la relation match sur l'UAI
    const relationMatchingUai = await organismesReferentielDb().countDocuments({
      siret: relation.siret as string,
      uai: couple.uai,
    });

    // SI Match Relation UAI alors on ajoute le couple à fiabiliser avec cet UAI
    if (relationMatchingUai > 0) {
      return {
        ...couple,
        uai_fiable: couple.uai, // TODO ??
        siret_fiable: couple.siret, // TODO ??
        statut_fiabilisation: STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER,
        rule: 4,
      };
    }
  }

  // Phase 2. Recherche dans les lieux de formation
  const lieuxFormation = organismesRespOrRespFormateurFromUai[0].lieux_de_formation.find(
    (item) => item.uai === couple.uai && item.uai_fiable
  );

  // Si l'UAI Match sur un des lieux fiables alors on peut fiabiliser tel quel en marquant que c'est un couple de lieu de formation
  if (lieuxFormation) {
    return {
      ...couple,
      uai_fiable: couple.uai, // TODO ??
      siret_fiable: couple.siret, // TODO ??
      statut_fiabilisation: STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER,
      rule: 4,
    };
  }

  return null;
};

/**
 * Règle de vérification des couples à fiabiliser via analyse des SIRET Multiples
 */
export const checkSiretMultiplesRelationsAndLieux_rewrite = async (couple: ICouple) => {
  if (!couple.uai) return null;

  const organismesReferentiel = await organismesReferentielDb()
    .find({
      uai: couple.uai,
    })
    .toArray();

  if (organismesReferentiel.length !== 1) return null;

  // on recherche dans le référentiel un unique organisme avec cet UAI de nature responsable ou responsable formateur
  const organismesRespOrRespFormateurFromSiret = await organismesReferentielDb()
    .find({
      siret: couple.siret,
      $or: [
        { nature: NATURE_ORGANISME_DE_FORMATION.RESPONSABLE_FORMATEUR },
        { nature: NATURE_ORGANISME_DE_FORMATION.RESPONSABLE },
      ],
    })
    .toArray();

  if (organismesRespOrRespFormateurFromSiret.length !== 1) return null;

  // si SIRET unique au niveau du référentiel alors on y associe l'UAI présent dans référentiel

  // Phase 1. Recherche dans les relations
  const relations = organismesRespOrRespFormateurFromSiret[0].relations?.filter((item) => item.siret) || [];

  // Pour chacune des relations du responsable si l'UAI Match alors on peut fiabiliser en remplacant le siret de la relation
  for (const relation of relations) {
    // On vérifie si la relation match sur l'UAI
    const relationMatchingUai = await organismesReferentielDb().countDocuments({
      siret: relation.siret as string,
      uai: couple.uai,
    });

    // SI Match Relation UAI alors on ajoute le couple à fiabiliser avec cet UAI
    if (relationMatchingUai > 0) {
      return {
        ...couple,
        uai_fiable: couple.uai, // TODO ??
        siret_fiable: couple.siret, // TODO ??
        statut_fiabilisation: STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER,
        rule: 5,
      };
    }
  }

  // Phase 2. Recherche dans les lieux de formation
  const lieuxFormation = organismesRespOrRespFormateurFromSiret[0].lieux_de_formation.find(
    (item) => item.uai === couple.uai && item.uai_fiable
  );

  // Si l'UAI Match sur un des lieux fiables alors on peut fiabiliser tel quel en marquant que c'est un couple de lieu de formation
  if (lieuxFormation) {
    return {
      ...couple,
      uai_fiable: couple.uai, // TODO ??
      siret_fiable: couple.siret, // TODO ??
      statut_fiabilisation: STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER,
      rule: 5,
    };
  }

  return null;
};

/**
 * Règle de vérification des problèmes de collecte : UAI non trouvée dans les lieux du référentiel
 */
export const checkUaiAucunLieuReferentiel_rewrite = async (couple: ICouple) => {
  // Identification des pb de collecte : UAI n'est dans aucun lieu du référentiel
  const organismesMatchsUaiInLieuxReferentiel = await organismesReferentielDb().countDocuments({
    "lieux_de_formation.uai": couple.uai,
  });

  if (organismesMatchsUaiInLieuxReferentiel !== 0) return null;

  return {
    ...couple,
    statut_fiabilisation: STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_PB_COLLECTE,
    statut_organisme: STATUT_FIABILISATION_ORGANISME.NON_FIABILISABLE_PB_COLLECTE,
    rule: 7,
  };
};

/**
 * Règle de vérification de la présence de l'UAI dans les lieux du référentiel
 * Si jamais on trouve l'uai dans un des lieux on peut fiabiliser avec le siret de l'organisme ayant ces lieux
 */
export const checkUaiLieuReferentiel_rewrite = async (couple: ICouple) => {
  const organismesMatchsUaiInLieuxReferentiel = await organismesReferentielDb()
    .find({ "lieux_de_formation.uai": couple.uai })
    .toArray();

  if (organismesMatchsUaiInLieuxReferentiel.length !== 1) return null;

  // Si match unique et uai existant dans le référentiel on peut fiabiliser un couple lieu avec le siret de l'organisme du référentiel
  return {
    ...couple,
    siret_fiable: organismesMatchsUaiInLieuxReferentiel[0].siret,
    uai_fiable: couple.uai,
    statut_fiabilisation: STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER,
    rule: 8,
  };
};

/**
 * Règle de vérification des couples non fiabilisables, si UAI est validée dans le référentiel ou non
 */
export const checkCoupleNonFiabilisable_rewrite = async (couple: ICouple) => {
  // Si aucune entrée déjà ajoutée à la table de fiabilisation pour ce couple on marque le couple non fiabilisable selon le cas

  // On est dans le cas d'un couple NON_FIABILISABLE
  // On distingue le cas ou l'UAI du tdb n'est pas présente dans le Référentiel du cas ou l'on ne sait pas mapper le couple
  const isUaiPresentInReferentiel = (await organismesReferentielDb().countDocuments({ uai: couple.uai })) > 0;

  // Ajout du couple avec statut de fiabilisation comme NON_FIABILISABLE en fonction de la présence de l'uai dans le référentiel
  return {
    ...couple,
    statut_fiabilisation: isUaiPresentInReferentiel
      ? STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_UAI_VALIDEE
      : STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_UAI_NON_VALIDEE,
    statut_organisme: isUaiPresentInReferentiel
      ? STATUT_FIABILISATION_ORGANISME.NON_FIABILISABLE_UAI_VALIDEE
      : STATUT_FIABILISATION_ORGANISME.NON_FIABILISABLE_UAI_NON_VALIDEE,
    rule: 9,
  };
};
