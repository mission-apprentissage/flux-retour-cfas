import { captureException } from "@sentry/node";
import Boom from "boom";
import { endOfMonth } from "date-fns";
import { MongoServerError, UpdateFilter } from "mongodb";
import { STATUT_APPRENANT, StatutApprenant } from "shared/constants";
import { IEffectif, IEffectifApprenant, IEffectifComputedStatut } from "shared/models/data/effectifs.model";

import logger from "@/common/logger";
import { effectifsDb } from "@/common/model/collections";

export async function hydrateEffectifsComputedTypes(evaluationDate = new Date()) {
  let nbEffectifsMisAJour = 0;
  let nbEffectifsNonMisAJour = 0;

  try {
    const cursor = effectifsDb().find();

    while (await cursor.hasNext()) {
      const effectif = await cursor.next();

      if (effectif) {
        const isSuccess = await updateEffectifStatut(effectif, evaluationDate);
        if (isSuccess) {
          nbEffectifsMisAJour++;
        } else {
          nbEffectifsNonMisAJour++;
        }
      }
    }

    logger.info(`${nbEffectifsMisAJour} effectifs mis à jour, ${nbEffectifsNonMisAJour} effectifs non mis à jour.`);
  } catch (err) {
    logger.error(`Échec de la mise à jour des effectifs: ${err}`);
    captureException(err);
  }
}

async function updateEffectifStatut(effectif: IEffectif, evaluationDate: Date): Promise<boolean> {
  if (!shouldUpdateStatut(effectif)) {
    return false;
  }

  try {
    const updateObj = createUpdateObject(effectif, evaluationDate);
    const { modifiedCount } = await effectifsDb().updateOne({ _id: effectif._id }, updateObj);
    return modifiedCount > 0;
  } catch (err) {
    handleUpdateError(err, effectif);
    return false;
  }
}

function shouldUpdateStatut(effectif: IEffectif): boolean {
  return !(
    !effectif.formation?.date_entree &&
    (!effectif.apprenant.historique_statut ||
      effectif.apprenant.historique_statut.length === 0 ||
      !effectif.formation?.periode)
  );
}

function createUpdateObject(effectif: IEffectif, evaluationDate: Date): UpdateFilter<IEffectif> {
  const newStatut = effectif.formation?.date_entree
    ? determineNewStatut(effectif, evaluationDate)
    : determineNewStatutFromHistorique(effectif.apprenant.historique_statut, effectif.formation?.periode);
  const historiqueStatut = effectif.formation?.date_entree
    ? genererHistoriqueStatut(effectif, evaluationDate)
    : genererHistoriqueStatutFromApprenant(
        effectif.apprenant.historique_statut,
        effectif.formation?.periode,
        evaluationDate
      );

  return {
    $set: {
      "_computed.statut": {
        en_cours: newStatut,
        historique: historiqueStatut,
      },
    },
  };
}

function handleUpdateError(err: unknown, effectif: IEffectif) {
  console.error("Erreur lors de la mise à jour de l'effectif :", err);
  if (
    err instanceof MongoServerError &&
    err.errInfo &&
    err.errInfo.details &&
    Array.isArray(err.errInfo.details.schemaRulesNotSatisfied)
  ) {
    console.error(
      "Erreurs de validation de schéma détaillées :",
      JSON.stringify(err.errInfo.details.schemaRulesNotSatisfied, null, 2)
    );
  }
  logger.error(
    `Erreur lors de la mise à jour de l'effectif ${effectif._id}: ${
      err instanceof Error ? err.message : JSON.stringify(err)
    }`
  );
  captureException(err);
}

export function genererHistoriqueStatut(effectif: IEffectif, endDate: Date) {
  if (!effectif?.formation?.date_entree) {
    return [];
  }

  const dateEntree = new Date(effectif.formation.date_entree);
  const historiqueStatut: { mois: string; annee: string; valeur: StatutApprenant }[] = [];

  for (let date = new Date(dateEntree); date <= endDate; date.setMonth(date.getMonth() + 1)) {
    const dernierJourDuMois = endOfMonth(date);
    const mois = (dernierJourDuMois.getMonth() + 1).toString().padStart(2, "0");
    const annee = dernierJourDuMois.getFullYear().toString();
    const statutPourLeMois = determineNewStatut(effectif, dernierJourDuMois);

    historiqueStatut.push({ mois, annee, valeur: statutPourLeMois });
  }

  return historiqueStatut;
}

export function determineNewStatut(effectif: IEffectif, evaluationDate?: Date): StatutApprenant {
  const currentDate = evaluationDate || new Date();
  const ninetyDaysInMs = 90 * 24 * 60 * 60 * 1000; // 90 jours en millisecondes
  const oneEightyDaysInMs = 180 * 24 * 60 * 60 * 1000; // 180 jours en millisecondes

  if (
    effectif.formation?.date_fin &&
    new Date(effectif.formation.date_fin) < currentDate &&
    effectif.formation.obtention_diplome
  ) {
    return STATUT_APPRENANT.DIPLOME;
  }

  let hasCurrentContract = false;
  let hasRecentRupture = false;
  let ruptureDateAfterEntry = false;

  const dateEntree = effectif.formation?.date_entree ? new Date(effectif.formation.date_entree) : null;

  effectif.contrats?.forEach((contract) => {
    const dateDebut = new Date(contract.date_debut);
    const dateFin = contract.date_fin ? new Date(contract.date_fin) : Infinity;
    const dateRupture = contract.date_rupture ? new Date(contract.date_rupture) : null;

    if (dateDebut <= currentDate && currentDate <= dateFin && (!dateRupture || currentDate < dateRupture)) {
      hasCurrentContract = true;
    }

    if (dateEntree && dateRupture && currentDate.getTime() - dateRupture.getTime() <= oneEightyDaysInMs) {
      hasRecentRupture = true;
      ruptureDateAfterEntry = dateRupture > dateEntree;
    }
  });

  if (hasCurrentContract) return STATUT_APPRENANT.APPRENTI;

  if (
    hasRecentRupture &&
    ruptureDateAfterEntry &&
    dateEntree &&
    currentDate.getTime() - dateEntree.getTime() <= ninetyDaysInMs
  ) {
    return STATUT_APPRENANT.INSCRIT;
  } else if (hasRecentRupture) {
    return STATUT_APPRENANT.RUPTURANT;
  }

  if (dateEntree && currentDate.getTime() - dateEntree.getTime() <= ninetyDaysInMs) {
    return STATUT_APPRENANT.INSCRIT;
  }

  if (dateEntree && currentDate.getTime() - dateEntree.getTime() > ninetyDaysInMs) {
    return STATUT_APPRENANT.ABANDON;
  }

  throw Boom.internal("No status found for the learner", { id: effectif._id });
}

export function determineNewStatutFromHistorique(
  historiqueStatut: IEffectifApprenant["historique_statut"],
  formationPeriode: number[] | null | undefined
): StatutApprenant {
  if (!historiqueStatut || historiqueStatut.length === 0) {
    throw new Error("Historique statut is empty or undefined");
  }

  if (!formationPeriode) {
    throw new Error("Formation period is null or undefined");
  }

  const filteredStatut = historiqueStatut.filter((statut) => {
    const statutYear = new Date(statut.date_statut).getFullYear();
    return statutYear <= formationPeriode[1];
  });

  if (filteredStatut.length === 0) {
    throw new Error("No historique statut entries match the formation period");
  }

  const latestStatut = filteredStatut.sort(
    (a, b) => new Date(b.date_statut).getTime() - new Date(a.date_statut).getTime()
  )[0];

  return mapValeurStatutToStatutApprenant(latestStatut.valeur_statut);
}

function genererHistoriqueStatutFromApprenant(
  historiqueStatut: IEffectifApprenant["historique_statut"],
  formationPeriode: number[] | null | undefined,
  evaluationEndDate: Date
): IEffectifComputedStatut["historique"] {
  if (!formationPeriode) {
    console.error("Formation period is undefined or null");
    return [];
  }
  const periodeEndDate = new Date(formationPeriode[1], 11, 31);
  const sortedStatut = historiqueStatut.sort(
    (a, b) => new Date(a.date_statut).getTime() - new Date(b.date_statut).getTime()
  );

  const startDate =
    sortedStatut.length > 0 ? new Date(sortedStatut[0].date_statut) : new Date(formationPeriode[0], 0, 1);
  const endDate = periodeEndDate < evaluationEndDate ? periodeEndDate : evaluationEndDate;

  let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const historique: IEffectifComputedStatut["historique"] = [];
  let currentStatutIndex = 0;

  while (currentDate <= endDate) {
    const mois = (currentDate.getMonth() + 1).toString().padStart(2, "0");
    const annee = currentDate.getFullYear().toString();

    while (
      currentStatutIndex < sortedStatut.length - 1 &&
      currentDate > new Date(sortedStatut[currentStatutIndex + 1].date_statut)
    ) {
      currentStatutIndex++;
    }

    let effectiveStatutIndex = currentStatutIndex;
    if (currentStatutIndex < sortedStatut.length - 1) {
      const nextStatutDate = new Date(sortedStatut[currentStatutIndex + 1].date_statut);
      if (
        nextStatutDate.getMonth() === currentDate.getMonth() &&
        nextStatutDate.getFullYear() === currentDate.getFullYear()
      ) {
        effectiveStatutIndex = currentStatutIndex + 1;
      }
    }

    const valeur = mapValeurStatutToStatutApprenant(sortedStatut[effectiveStatutIndex]?.valeur_statut || 0);

    historique.push({ mois, annee, valeur });

    currentDate.setMonth(currentDate.getMonth() + 1);
    currentDate.setDate(1);
  }

  return historique;
}

function mapValeurStatutToStatutApprenant(valeurStatut: number): StatutApprenant {
  switch (valeurStatut) {
    case 0:
      return STATUT_APPRENANT.ABANDON;
    case 2:
      return STATUT_APPRENANT.INSCRIT;
    case 3:
      return STATUT_APPRENANT.APPRENTI;
  }
  throw Boom.internal("Valeur de statut non trouvé", { valeurStatut });
}
