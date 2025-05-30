import { captureException } from "@sentry/node";
import Boom from "boom";
import { cloneDeep } from "lodash-es";
import { MongoServerError, UpdateFilter } from "mongodb";
import { STATUT_APPRENANT, StatutApprenant } from "shared/constants";
import type { IContrat } from "shared/models/data/effectifs/contrat.part";
import type { IFormationEffectif } from "shared/models/data/effectifs/formation.part";
import { IEffectifApprenant, IEffectifComputedStatut } from "shared/models/data/effectifs.model";
import { addDaysUTC } from "shared/utils";

import { IEffectifGenerique } from "@/jobs/hydrate/effectifs/hydrate-effectifs-computed-types";

import logger from "../logger";

const ninetyDaysInMs = 90 * 24 * 60 * 60 * 1000; // 90 jours en millisecondes
const oneEightyDaysInMs = 180 * 24 * 60 * 60 * 1000; // 180 jours en millisecondes

type ICreateComputedStatutObjectParams = Readonly<{
  apprenant: Readonly<Pick<IEffectifApprenant, "historique_statut">>;
  formation?:
    | Readonly<Pick<IFormationEffectif, "date_entree" | "periode" | "date_fin" | "date_exclusion">>
    | null
    | undefined;
  contrats?: Pick<IContrat, "date_debut" | "date_rupture">[] | null | undefined;
}>;

export async function updateEffectifStatut(
  effectif: IEffectifGenerique,
  evaluationDate: Date,
  collection
): Promise<boolean> {
  if (!shouldUpdateStatut(effectif)) {
    return false;
  }

  try {
    const updateObj = createUpdateObject(effectif, evaluationDate);
    const { modifiedCount } = await collection.updateOne({ _id: effectif._id }, updateObj);
    return modifiedCount > 0;
  } catch (err) {
    handleUpdateError(err, effectif);
    return false;
  }
}

function shouldUpdateStatut(effectif: IEffectifGenerique): boolean {
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
  effectif: ICreateComputedStatutObjectParams,
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

function createUpdateObject(effectif: IEffectifGenerique, evaluationDate: Date): UpdateFilter<IEffectifGenerique> {
  return {
    $set: {
      updated_at: new Date(),
      "_computed.statut": createComputedStatutObject(effectif, evaluationDate),
    },
  };
}

function handleUpdateError(err: unknown, effectif: IEffectifGenerique) {
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

const generateUnifiedParcours = (
  effectif: ICreateComputedStatutObjectParams,
  evaluationDate: Date
): { valeur: StatutApprenant; date: Date }[] => {
  let parcours: { valeur: StatutApprenant; date: Date }[] = [];
  const { formation, apprenant } = effectif;

  let status: { valeur: StatutApprenant; date: Date }[] = [];
  if (formation && formation.date_entree) {
    status = determineStatutsByContrats(effectif, evaluationDate);
  } else if (apprenant.historique_statut && formation?.periode) {
    status = determineNewStatutFromHistorique(apprenant.historique_statut, formation.periode);
  }
  status.forEach((status) => parcours.push(status));

  const lastStatus = parcours.length > 0 ? parcours[parcours.length - 1].valeur : null;
  if (lastStatus !== STATUT_APPRENANT.ABANDON) {
    if (formation?.date_fin) {
      if (formation.date_fin <= evaluationDate) {
        parcours.push({ valeur: STATUT_APPRENANT.FIN_DE_FORMATION, date: new Date(formation.date_fin) });
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

  return deduplicateAndSortParcours(parcours);
};

function deduplicateAndSortParcours(parcours: { valeur: StatutApprenant; date: Date }[]) {
  return parcours
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .filter((event, index, array) => index === 0 || event.valeur !== array[index - 1].valeur);
}

function determineStatutsByContrats(
  effectif: ICreateComputedStatutObjectParams,
  evaluationDate?: Date
): { valeur: StatutApprenant; date: Date }[] {
  if (!effectif.formation?.date_entree && !effectif.formation?.date_fin) {
    return [];
  }

  const statuts: { valeur: StatutApprenant; date: Date }[] = [];
  const currentDate = evaluationDate || new Date();
  const dateEntree = effectif.formation.date_entree;
  const dateAbandon = effectif.formation.date_exclusion;

  const dateFin = effectif.formation.date_fin ? new Date(effectif.formation.date_fin) : currentDate;
  const effectiveDateFin = dateFin < currentDate ? dateFin : currentDate;

  let contracts =
    effectif.contrats
      ?.map((contract) => ({
        dateDebut: new Date(contract.date_debut ?? 0),
        dateRupture: contract.date_rupture ? new Date(contract.date_rupture) : null,
      }))
      .sort((a, b) => a.dateDebut.getTime() - b.dateDebut.getTime()) || [];

  const earliestContract = contracts[0]?.dateDebut;

  if (dateEntree && earliestContract && earliestContract < dateEntree) {
    statuts.push({ valeur: STATUT_APPRENANT.INSCRIT, date: earliestContract });
  } else if (dateEntree) {
    statuts.push({ valeur: STATUT_APPRENANT.INSCRIT, date: dateEntree });
  }

  let latestRuptureDate;
  contracts.forEach((contract, index) => {
    const { dateDebut, dateRupture } = contract;

    if (dateDebut) {
      if (!dateRupture || (dateRupture && dateDebut <= dateRupture)) {
        // Gestion des rutptures avant démarrage
        statuts.push({ valeur: STATUT_APPRENANT.APPRENTI, date: dateDebut });
      }
    }

    if (dateRupture && dateDebut <= dateRupture) {
      const nextContract = contracts[index + 1];
      if (!nextContract) {
        latestRuptureDate = dateRupture;
      }
      statuts.push({ valeur: STATUT_APPRENANT.RUPTURANT, date: dateRupture });
    }
  });

  if (dateEntree && dateAbandon && dateAbandon <= effectiveDateFin && dateAbandon >= dateEntree) {
    statuts.push({ valeur: STATUT_APPRENANT.ABANDON, date: dateAbandon });
  } else {
    if (latestRuptureDate && effectiveDateFin.getTime() - latestRuptureDate.getTime() > oneEightyDaysInMs) {
      statuts.push({
        valeur: STATUT_APPRENANT.ABANDON,
        date: addDaysUTC(latestRuptureDate, 180),
      });
    }
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
