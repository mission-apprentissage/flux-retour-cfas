import { captureException } from "@sentry/node";
import Boom from "boom";
import { addDays, endOfMonth } from "date-fns";
import { MongoServerError, UpdateFilter } from "mongodb";
import { STATUT_APPRENANT, StatutApprenant } from "shared/constants";
import { IEffectif, IEffectifApprenant, IEffectifComputedStatut } from "shared/models/data/effectifs.model";

import logger from "../logger";
import { effectifsDb } from "../model/collections";

const ninetyDaysInMs = 90 * 24 * 60 * 60 * 1000; // 90 jours en millisecondes
const oneEightyDaysInMs = 180 * 24 * 60 * 60 * 1000; // 180 jours en millisecondes

export async function updateEffectifStatut(effectif: IEffectif, evaluationDate: Date): Promise<boolean> {
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

/**
 * Génère un objet de statut pour un effectif basé sur sa date d'entrée ou son statut historique.
 *
 * @param {IEffectif} effectif L'effectif pour lequel générer l'objet de statut.
 * @param {Date} evaluationDate La date à laquelle l'évaluation du statut est effectuée.
 * @returns {IEffectifComputedStatut} L'objet de statut calculé pour l'effectif.
 */
export function createComputedStatutObject(effectif: IEffectif, evaluationDate: Date): IEffectifComputedStatut | null {
  try {
    const hasEntryDate = Boolean(effectif.formation?.date_entree);

    const newStatut = hasEntryDate
      ? determineNewStatut(effectif, evaluationDate)
      : determineNewStatutFromHistorique(effectif.apprenant.historique_statut, effectif.formation?.periode);

    const historiqueStatut = hasEntryDate
      ? genererHistoriqueStatut(effectif, evaluationDate)
      : genererHistoriqueStatutFromApprenant(
          effectif.apprenant.historique_statut,
          effectif.formation?.periode,
          evaluationDate
        );

    const parcours = hasEntryDate
      ? generateParcoursFromDateEntree(effectif, evaluationDate)
      : generateParcoursFromHistorique(effectif.apprenant.historique_statut, effectif.formation?.periode || []);

    return {
      en_cours: newStatut,
      historique: historiqueStatut,
      parcours,
    };
  } catch (error) {
    logger.error(
      `Échec de la création de l'objet statut dans _computed: ${
        error instanceof Error ? error.message : JSON.stringify(error)
      }`,
      {
        context: "createComputedStatutObject",
        evaluationDate,
        effectifId: effectif._id,
        errorStack: error instanceof Error ? error.stack : undefined,
      }
    );
    return null;
  }
}

function createUpdateObject(effectif: IEffectif, evaluationDate: Date): UpdateFilter<IEffectif> {
  return {
    $set: {
      "_computed.statut": createComputedStatutObject(effectif, evaluationDate),
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

export function genererHistoriqueStatut(effectif: IEffectif, evaluationDate: Date) {
  if (!effectif?.formation?.date_entree || !effectif.formation?.date_fin) {
    return [];
  }

  const dateEntreeFormation = new Date(effectif.formation.date_entree);
  const dateFinFormation = new Date(effectif.formation.date_fin);
  const currentDate = new Date(evaluationDate);

  const dateFin = dateFinFormation < currentDate ? dateFinFormation : currentDate;
  const historiqueStatut: { mois: string; annee: string; valeur: StatutApprenant }[] = [];

  for (let date = new Date(dateEntreeFormation); date <= dateFin; date.setMonth(date.getMonth() + 1)) {
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

  throw Boom.internal("Aucun statut trouvé pour l'apprenant", { id: effectif._id });
}

export function determineNewStatutFromHistorique(
  historiqueStatut: IEffectifApprenant["historique_statut"],
  formationPeriode: number[] | null | undefined
): StatutApprenant {
  if (!historiqueStatut || historiqueStatut.length === 0) {
    throw new Error("Le statut historique est vide ou indéfini");
  }

  if (!formationPeriode) {
    throw new Error("La période de formation est nulle ou indéfinie");
  }

  const filteredStatut = historiqueStatut.filter((statut) => {
    const statutYear = new Date(statut.date_statut).getFullYear();
    return statutYear <= formationPeriode[1];
  });

  if (filteredStatut.length === 0) {
    throw new Error("Aucune entrée de l'historique statut ne correspond à la période de formation");
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

    const lastHistoriqueValeur = historique.length > 0 ? historique[historique.length - 1].valeur : undefined;

    const valeur =
      (lastHistoriqueValeur === STATUT_APPRENANT.APPRENTI || lastHistoriqueValeur === STATUT_APPRENANT.RUPTURANT) &&
      sortedStatut[effectiveStatutIndex]?.valeur_statut === 2
        ? STATUT_APPRENANT.RUPTURANT
        : mapValeurStatutToStatutApprenant(sortedStatut[effectiveStatutIndex]?.valeur_statut || 0);

    historique.push({ mois, annee, valeur });

    currentDate.setMonth(currentDate.getMonth() + 1);
    currentDate.setDate(1);
  }

  return historique;
}

function generateParcoursFromDateEntree(
  effectif: IEffectif,
  evaluationDate: Date
): { valeur: StatutApprenant; date: Date }[] {
  let parcours: { valeur: StatutApprenant; date: Date }[] = [];

  const entryDate = effectif.formation!.date_entree!;

  parcours.push({
    valeur: STATUT_APPRENANT.INSCRIT,
    date: entryDate,
  });

  effectif.contrats?.forEach((contract) => {
    const contractStartDate = contract.date_debut;
    const contractEndDate = contract.date_rupture ? contract.date_rupture : null;

    if (contractStartDate >= entryDate) {
      parcours.push({ valeur: STATUT_APPRENANT.APPRENTI, date: contractStartDate });
    }

    if (contractEndDate && contractEndDate <= evaluationDate) {
      parcours.push({ valeur: STATUT_APPRENANT.RUPTURANT, date: contractEndDate });
    }
  });

  const lastParcoursDate = parcours[parcours.length - 1].date;
  const lastParcoursValeur = parcours[parcours.length - 1].valeur;

  const timeSinceEntry = evaluationDate.getTime() - entryDate.getTime();

  if (lastParcoursValeur === STATUT_APPRENANT.INSCRIT && timeSinceEntry > ninetyDaysInMs) {
    parcours.push({
      valeur: STATUT_APPRENANT.ABANDON,
      date: addDays(lastParcoursDate, 90),
    });
  } else if (lastParcoursValeur === STATUT_APPRENANT.RUPTURANT && timeSinceEntry > oneEightyDaysInMs) {
    parcours.push({
      valeur: STATUT_APPRENANT.ABANDON,
      date: addDays(lastParcoursDate, 180),
    });
  }

  if (effectif.formation?.date_fin && effectif.formation.obtention_diplome) {
    parcours.push({
      valeur: STATUT_APPRENANT.DIPLOME,
      date: effectif.formation?.date_fin,
    });
  }

  return deduplicateAndSortParcours(parcours);
}

function generateParcoursFromHistorique(
  historiqueStatut: IEffectifApprenant["historique_statut"],
  formationPeriode: number[]
): { valeur: StatutApprenant; date: Date }[] {
  if (!formationPeriode) {
    console.error("Formation period is undefined or null");
    return [];
  }

  let parcours: { valeur: StatutApprenant; date: Date }[] = [];
  const sortedStatut = historiqueStatut.sort(
    (a, b) => new Date(a.date_statut).getTime() - new Date(b.date_statut).getTime()
  );

  sortedStatut.forEach((historique) => {
    const lastParcoursValeur = parcours.length > 0 ? parcours[parcours.length - 1].valeur : undefined;

    const valeur =
      (lastParcoursValeur === STATUT_APPRENANT.APPRENTI || lastParcoursValeur === STATUT_APPRENANT.RUPTURANT) &&
      historique.valeur_statut === 2
        ? STATUT_APPRENANT.RUPTURANT
        : mapValeurStatutToStatutApprenant(historique.valeur_statut);

    parcours.push({
      valeur,
      date: historique.date_statut,
    });
  });

  return deduplicateAndSortParcours(parcours);
}

function deduplicateAndSortParcours(parcours: { valeur: StatutApprenant; date: Date }[]) {
  return parcours
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .filter((event, index, array) => index === 0 || event.valeur !== array[index - 1].valeur);
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
