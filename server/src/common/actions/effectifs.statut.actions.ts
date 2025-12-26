import { captureException } from "@sentry/node";
import { formatISO } from "date-fns";
import { cloneDeep } from "lodash-es";
import { MongoServerError, UpdateFilter } from "mongodb";
import { IContratV2, IEffectifV2 } from "shared/models";
import type { IContrat } from "shared/models/data/effectifs/contrat.part";
import type { IFormationEffectif } from "shared/models/data/effectifs/formation.part";
import { IEffectif, IEffectifApprenant, IEffectifComputedStatut } from "shared/models/data/effectifs.model";

import { IEffectifGenerique } from "@/jobs/hydrate/effectifs/hydrate-effectifs-computed-types";
import { buildEffectifStatus } from "@/jobs/ingestion/status/effectif_status.builder";

import logger from "../logger";

type ICreateComputedStatutObjectParams = Readonly<{
  apprenant: Readonly<Pick<IEffectifApprenant, "historique_statut">>;
  formation?:
    | Readonly<Pick<IFormationEffectif, "date_entree" | "periode" | "date_fin" | "date_exclusion">>
    | null
    | undefined;
  contrats?: Pick<IContrat, "date_debut" | "date_fin" | "cause_rupture" | "date_rupture">[] | null | undefined;
  annee_scolaire: IEffectif["annee_scolaire"];
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
    return generateUnifiedParcours(effectif, evaluationDate);
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

function generateUnifiedParcours(
  effectif: ICreateComputedStatutObjectParams,
  evaluationDate: Date
): IEffectifComputedStatut {
  if (!effectif.formation?.date_entree || !effectif.formation?.date_fin) {
    // Legacy data
    return determineNewStatutFromHistorique(effectif, evaluationDate);
  }

  const dateEntree = effectif.formation.date_entree;
  const dateFin = effectif.formation.date_fin;

  const params: Pick<IEffectifV2, "session" | "contrats" | "exclusion"> = {
    session: {
      debut: dateEntree,
      fin: dateFin,
    },
    contrats:
      effectif.contrats?.reduce<IEffectifV2["contrats"]>((acc, c) => {
        const debut = c.date_debut ?? new Date(0);
        const day = formatISO(debut, { representation: "date" });
        acc[day] = {
          date_debut: debut,
          date_fin: c.date_fin ?? dateFin,
          rupture: c.date_rupture ? { date_rupture: c.date_rupture, cause: c.cause_rupture ?? null } : null,
          employeur: { siret: null },
        };

        return acc;
      }, {}) ?? {},
    exclusion: effectif.formation.date_exclusion
      ? {
          date: effectif.formation.date_exclusion,
          cause: null,
        }
      : null,
  };

  return buildEffectifStatus(params, evaluationDate);
}

function determineNewStatutFromHistorique(
  effectif: ICreateComputedStatutObjectParams,
  evaluationDate: Date
): IEffectifComputedStatut {
  const historiqueStatut = effectif.apprenant.historique_statut;
  if (!historiqueStatut || historiqueStatut.length === 0) {
    throw new Error("Le statut historique est vide ou indéfini");
  }

  const periode = effectif.formation?.periode ?? effectif.annee_scolaire.split("-").map((year) => parseInt(year, 10));

  if (periode.length !== 2) {
    throw new Error("La période de formation est invalide");
  }

  const [startYear, endYear] = periode;
  let dateEntreeFromPeriode =
    startYear !== endYear ? new Date(`${startYear}-08-01T00:00:00Z`) : new Date(`${startYear}-01-01T00:00:00Z`);
  const dateFinFromPeriode =
    startYear !== endYear ? new Date(`${endYear}-07-31T00:00:00Z`) : new Date(`${endYear}-12-31T00:00:00Z`);

  const dateDebut = effectif.formation?.date_entree ?? dateEntreeFromPeriode;
  const dateFin = effectif.formation?.date_fin ?? dateFinFromPeriode;

  const clonedHistoriqueStatut = cloneDeep(historiqueStatut);

  const sortedHistoriqueStatut = clonedHistoriqueStatut.sort(
    (a, b) => new Date(a.date_statut).getTime() - new Date(b.date_statut).getTime()
  );

  const contratsFromHistorique: IContratV2[] = [];
  let currentContratStartDate: Date | null = null;
  for (const statut of sortedHistoriqueStatut) {
    if (currentContratStartDate === null && statut.valeur_statut === 3) {
      currentContratStartDate = statut.date_statut;
      continue;
    }

    if (currentContratStartDate !== null && statut.valeur_statut === 2) {
      contratsFromHistorique.push({
        date_debut: currentContratStartDate,
        date_fin: dateFin,
        rupture: { date_rupture: statut.date_statut, cause: null },
        employeur: { siret: null },
      });
      currentContratStartDate = null;
    }
  }

  const params: Pick<IEffectifV2, "session" | "contrats" | "exclusion"> = {
    session: {
      debut: dateDebut,
      fin: dateFin,
    },
    contrats: Object.fromEntries(
      contratsFromHistorique.map((contrat) => {
        const day = formatISO(contrat.date_debut, { representation: "date" });
        return [
          day,
          {
            date_debut: contrat.date_debut,
            date_fin: contrat.date_fin,
            rupture: contrat.rupture,
            employeur: { siret: null },
          },
        ];
      })
    ),
    exclusion: null,
  };

  return buildEffectifStatus(params, evaluationDate ?? new Date());
}

export const getCurrentAndNextStatus = (
  parcours?: Array<{ date: Date | string; valeur: any }>,
  now = new Date()
): { current: { date: Date; valeur: any } | null; next: { date: Date; valeur: any } | null } => {
  if (!parcours || parcours.length === 0) {
    return { current: null, next: null };
  }

  let current: { date: Date; valeur: any } | null = null;
  let next: { date: Date; valeur: any } | null = null;

  for (let i = 0; i < parcours.length; i++) {
    const sDate = new Date(parcours[i].date);
    if (sDate <= now) {
      current = { date: sDate, valeur: parcours[i].valeur };
      next = parcours[i + 1] ? { date: new Date(parcours[i + 1].date), valeur: parcours[i + 1].valeur } : null;
    } else {
      if (!current) {
        current = null;
        next = { date: sDate, valeur: parcours[i].valeur };
      }
      break;
    }
  }

  return { current, next };
};
