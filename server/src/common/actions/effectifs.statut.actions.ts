import { captureException } from "@sentry/node";
import Boom from "boom";
import { cloneDeep } from "lodash-es";
import { MongoServerError, UpdateFilter, type WithoutId } from "mongodb";
import { STATUT_APPRENANT, StatutApprenant } from "shared/constants";
import { IContrat } from "shared/models/data/effectifs/contrat.part";
import { IFormationEffectif } from "shared/models/data/effectifs/formation.part";
import { IEffectif, IEffectifApprenant, IEffectifComputedStatut } from "shared/models/data/effectifs.model";
import type { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import { addDaysUTC } from "shared/utils";

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
export function createComputedStatutObject(
  effectif: IEffectif | WithoutId<IEffectifDECA>,
  evaluationDate: Date
): IEffectifComputedStatut | null {
  try {
    const parcours = generateUnifiedParcours(effectif, evaluationDate);

    return {
      en_cours: parcours[parcours.length - 1].valeur,
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
        effectifId: "_id" in effectif ? effectif._id : null,
        errorStack: error instanceof Error ? error.stack : undefined,
      }
    );
    return null;
  }
}

function createUpdateObject(effectif: IEffectif, evaluationDate: Date): UpdateFilter<IEffectif> {
  return {
    $set: {
      updated_at: new Date(),
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

const handleFinDeFormationStatut = (
  currentParcours: { valeur: StatutApprenant; date: Date }[],
  evaluationDate: Date,
  formation?: IFormationEffectif | null,
  lastContractDate?: Date | null
) => {
  const lastStatus = currentParcours.length > 0 ? currentParcours[currentParcours.length - 1].valeur : null;

  const parcours: { valeur: StatutApprenant; date: Date }[] = [];

  if (lastStatus !== STATUT_APPRENANT.ABANDON) {
    if (formation?.date_fin) {
      if (formation.date_fin <= evaluationDate) {
        if (!lastContractDate) {
          parcours.push({ valeur: STATUT_APPRENANT.FIN_DE_FORMATION, date: new Date(formation.date_fin) });
        } else if (lastContractDate <= formation.date_fin && formation.date_fin <= evaluationDate) {
          parcours.push({ valeur: STATUT_APPRENANT.FIN_DE_FORMATION, date: new Date(formation.date_fin) });
        } else if (formation.date_fin <= lastContractDate && lastContractDate <= evaluationDate) {
          parcours.push({ valeur: STATUT_APPRENANT.FIN_DE_FORMATION_EN_CONTRAT, date: new Date(formation.date_fin) });
          parcours.push({ valeur: STATUT_APPRENANT.FIN_DE_FORMATION, date: new Date(lastContractDate) });
        } else {
          parcours.push({ valeur: STATUT_APPRENANT.FIN_DE_FORMATION_EN_CONTRAT, date: new Date(formation.date_fin) });
        }
      }
    } else if (formation?.periode && formation.periode.length === 2) {
      const [startYear, endYear] = formation.periode;
      let dateFinFormation = new Date(`${endYear}-12-31T00:00:00Z`);
      if (startYear !== endYear) {
        dateFinFormation = new Date(`${endYear}-07-31T00:00:00Z`);
      }
      if (dateFinFormation <= evaluationDate) {
        parcours.push({ valeur: STATUT_APPRENANT.FIN_DE_FORMATION, date: dateFinFormation });
      }
    }
  }

  return parcours;
};

const formatContrats = (contrats: Array<IContrat> | null) => {
  const formattedContrats =
    contrats
      ?.map((contract) => ({
        dateDebut: new Date(contract.date_debut),
        dateRupture: contract.date_rupture ? new Date(contract.date_rupture) : null,
        dateFin: contract.date_fin ? new Date(contract.date_fin) : null,
      }))
      .sort((a, b) => a.dateDebut.getTime() - b.dateDebut.getTime()) || [];

  return {
    contracts: formattedContrats,
    earliestContractBeginDate: formattedContrats[0]?.dateDebut,
    latestContractEndDate: formattedContrats[formattedContrats.length - 1]?.dateFin,
  };
};

const generateUnifiedParcours = (
  effectif: IEffectif | WithoutId<IEffectifDECA>,
  evaluationDate: Date
): { valeur: StatutApprenant; date: Date }[] => {
  let parcours: { valeur: StatutApprenant; date: Date }[] = [];
  const { formation, apprenant } = effectif;

  let status: { valeur: StatutApprenant; date: Date }[] = [];

  const { contracts, earliestContractBeginDate, latestContractEndDate } = formatContrats(
    effectif.contrats as Array<IContrat>
  );

  if (formation && formation.date_entree) {
    status = determineStatutsByContrats(effectif, evaluationDate, contracts, earliestContractBeginDate);
  } else if (apprenant.historique_statut && formation?.periode) {
    status = determineNewStatutFromHistorique(apprenant.historique_statut, formation.periode);
  }

  status.forEach((status) => parcours.push(status));

  const finDeFormationStatuts = handleFinDeFormationStatut(parcours, evaluationDate, formation, latestContractEndDate);
  parcours = parcours.concat(finDeFormationStatuts);

  return deduplicateAndSortParcours(parcours);
};

function deduplicateAndSortParcours(parcours: { valeur: StatutApprenant; date: Date }[]) {
  return parcours
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .filter((event, index, array) => index === 0 || event.valeur !== array[index - 1].valeur);
}

function determineStatutsByContrats(
  effectif: IEffectif | WithoutId<IEffectifDECA>,
  evaluationDate: Date,
  contracts: Array<{
    dateDebut: Date;
    dateRupture: Date | null;
    dateFin: Date | null;
  }>,
  earliestContractBeginDate?: Date
): { valeur: StatutApprenant; date: Date }[] {
  if (!effectif.formation?.date_entree && !effectif.formation?.date_fin) {
    return [];
  }

  const statuts: { valeur: StatutApprenant; date: Date }[] = [];
  const currentDate = evaluationDate || new Date();
  const dateEntree = effectif.formation.date_entree;

  const dateFin = effectif.formation.date_fin ? new Date(effectif.formation.date_fin) : currentDate;
  const effectiveDateFin = dateFin < currentDate ? dateFin : currentDate;

  if (dateEntree && earliestContractBeginDate && earliestContractBeginDate < dateEntree) {
    statuts.push({ valeur: STATUT_APPRENANT.INSCRIT, date: earliestContractBeginDate });
  } else if (dateEntree) {
    statuts.push({ valeur: STATUT_APPRENANT.INSCRIT, date: dateEntree });
  }

  let latestRuptureDate: Date | null = null;

  contracts.forEach((contract, index) => {
    const { dateDebut, dateRupture } = contract;

    if (dateDebut <= effectiveDateFin) {
      statuts.push({ valeur: STATUT_APPRENANT.APPRENTI, date: dateDebut });
    }

    if (dateRupture && dateRupture <= effectiveDateFin) {
      const nextContract = contracts[index + 1];
      if (!nextContract) {
        latestRuptureDate = dateRupture;
      }
      statuts.push({ valeur: STATUT_APPRENANT.RUPTURANT, date: dateRupture });
    }
  });

  if (latestRuptureDate && effectiveDateFin.getTime() - (latestRuptureDate as Date).getTime() > oneEightyDaysInMs) {
    statuts.push({
      valeur: STATUT_APPRENANT.ABANDON,
      date: addDaysUTC(latestRuptureDate, 180),
    });
  }

  if (statuts.length === 1 && dateEntree && effectiveDateFin.getTime() - dateEntree.getTime() > ninetyDaysInMs) {
    statuts.push({ valeur: STATUT_APPRENANT.ABANDON, date: addDaysUTC(dateEntree, 90) });
  }

  return statuts.sort((a, b) => a.date.getTime() - b.date.getTime());
}

function determineNewStatutFromHistorique(
  historiqueStatut: IEffectifApprenant["historique_statut"],
  formationPeriode: number[] | null | undefined
): { valeur: StatutApprenant; date: Date }[] {
  if (!historiqueStatut || historiqueStatut.length === 0) {
    throw new Error("Le statut historique est vide ou indéfini");
  }

  if (!formationPeriode) {
    throw new Error("La période de formation est nulle ou indéfinie");
  }

  const clonedHistoriqueStatut = cloneDeep(historiqueStatut);

  const sortedHistoriqueStatut = clonedHistoriqueStatut.sort(
    (a, b) => new Date(a.date_statut).getTime() - new Date(b.date_statut).getTime()
  );

  const [startYear, endYear] = formationPeriode;
  let inscriptionDate =
    startYear !== endYear ? new Date(`${startYear}-08-01T00:00:00Z`) : new Date(`${startYear}-01-01T00:00:00Z`);

  if (sortedHistoriqueStatut[0].valeur_statut === 2) {
    inscriptionDate = sortedHistoriqueStatut[0].date_statut;
    sortedHistoriqueStatut.shift();
  }

  if (sortedHistoriqueStatut.length > 0 && sortedHistoriqueStatut[0].date_statut) {
    let earliestStatutDate = new Date(sortedHistoriqueStatut[0].date_statut);

    if (earliestStatutDate < inscriptionDate) {
      inscriptionDate = earliestStatutDate;
    }
  }

  const parcours: { valeur: StatutApprenant; date: Date }[] = [
    { valeur: STATUT_APPRENANT.INSCRIT, date: inscriptionDate },
  ];

  sortedHistoriqueStatut.forEach((statut) => {
    parcours.push({
      valeur: mapValeurStatutToStatutApprenant(statut.valeur_statut),
      date: new Date(statut.date_statut),
    });
  });

  return parcours;
}

function mapValeurStatutToStatutApprenant(valeurStatut: number): StatutApprenant {
  switch (valeurStatut) {
    case 0:
      return STATUT_APPRENANT.ABANDON;
    case 2:
      return STATUT_APPRENANT.RUPTURANT;
    case 3:
      return STATUT_APPRENANT.APPRENTI;
  }
  throw Boom.internal("Valeur de statut non trouvé", { valeurStatut });
}
