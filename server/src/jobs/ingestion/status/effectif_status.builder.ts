import Boom from "boom";
import { addDays, differenceInCalendarDays, eachDayOfInterval, formatISO, min } from "date-fns";
import { STATUT_APPRENANT, StatutApprenant } from "shared/constants";
import type { IEffectifComputedStatut, IEffectifV2 } from "shared/models";

export function buildEffectifStatus(effectif: Pick<IEffectifV2, "session" | "contrats" | "exclusion">, now: Date) {
  const parcours = buildEffectifParcours(effectif);
  let enCours: StatutApprenant = STATUT_APPRENANT.INSCRIT;
  for (const p of parcours) {
    if (p.date > now) {
      break;
    }

    enCours = p.valeur;
  }

  return {
    en_cours: enCours,
    parcours,
  };
}

function getDaysBetween({ start, end }: { start: Date; end: Date }): string[] {
  if (start > end) return [];

  return eachDayOfInterval({
    start,
    end,
  }).map((date) => formatISO(date, { representation: "date" }));
}

// Sans rapport avec le délai d'envoi automatique en collab (CFA_COLLAB_AUTO_SEND_DELAI_DAYS).
export const FIN_FORMATION_TOLERANCE_DAYS = 60;

function getContratFinEffective(contrat: IEffectifV2["contrats"][string], sessionFin: Date): Date {
  return contrat.rupture?.date_rupture ? addDays(contrat.rupture.date_rupture, -1) : (contrat.date_fin ?? sessionFin);
}

function buildEffectifParcours(
  effectif: Pick<IEffectifV2, "session" | "contrats" | "exclusion">
): IEffectifComputedStatut["parcours"] {
  const parcoursRaw = new Map<string, StatutApprenant>();

  const contrats = Object.values(effectif.contrats);
  const startDate = min([effectif.session.debut, ...contrats.map((c) => c.date_debut)]);

  const days = getDaysBetween({
    start: startDate,
    end: effectif.session.fin,
  });

  days.forEach((day) => {
    parcoursRaw.set(day, STATUT_APPRENANT.INSCRIT);
  });

  for (const contrat of contrats) {
    // En cas de rupture, le dernier jour effectif en contrat correspond au jour avant la rupture
    const lastDay = getContratFinEffective(contrat, effectif.session.fin);

    getDaysBetween({
      start: contrat.date_debut,
      end: lastDay,
    }).forEach((day) => {
      parcoursRaw.set(day, STATUT_APPRENANT.APPRENTI);
    });
  }

  if (effectif.exclusion) {
    getDaysBetween({
      start: effectif.exclusion.date,
      end: effectif.session.fin,
    }).forEach((day) => {
      parcoursRaw.set(day, STATUT_APPRENANT.ABANDON);
    });
  }

  let consecutiveDaysWithoutContrat = 0;
  let hasContract = false;
  for (const day of days) {
    const statut = parcoursRaw.get(day);
    if (!statut) {
      throw Boom.internal("buildEffectifParcours: unexpected error");
    }

    if (statut === STATUT_APPRENANT.APPRENTI) {
      hasContract = true;
      consecutiveDaysWithoutContrat = 0;
      continue;
    }

    consecutiveDaysWithoutContrat += 1;

    if (statut === STATUT_APPRENANT.INSCRIT) {
      if (hasContract) {
        parcoursRaw.set(
          day,
          consecutiveDaysWithoutContrat > 180 ? STATUT_APPRENANT.ABANDON : STATUT_APPRENANT.RUPTURANT
        );
      } else {
        parcoursRaw.set(day, consecutiveDaysWithoutContrat > 90 ? STATUT_APPRENANT.ABANDON : STATUT_APPRENANT.INSCRIT);
      }
    }
  }

  const lastDayKey = days.at(-1)!;
  const lastDayStatut = parcoursRaw.get(lastDayKey);

  const terminalContrat = contrats.reduce<{ contrat: (typeof contrats)[number]; fin: Date } | null>((acc, contrat) => {
    const fin = getContratFinEffective(contrat, effectif.session.fin);
    if (acc === null || fin > acc.fin || (fin.getTime() === acc.fin.getTime() && contrat.rupture)) {
      return { contrat, fin };
    }
    return acc;
  }, null);

  const hasNaturallyEndedContract = !effectif.exclusion && terminalContrat !== null && !terminalContrat.contrat.rupture;

  if (
    hasNaturallyEndedContract &&
    differenceInCalendarDays(effectif.session.fin, terminalContrat.fin) <= FIN_FORMATION_TOLERANCE_DAYS
  ) {
    getDaysBetween({ start: addDays(terminalContrat.fin, 1), end: effectif.session.fin }).forEach((day) => {
      const statut = parcoursRaw.get(day);
      if (statut === STATUT_APPRENANT.INSCRIT || statut === STATUT_APPRENANT.RUPTURANT) {
        parcoursRaw.set(day, STATUT_APPRENANT.FIN_DE_FORMATION);
      }
    });
  }

  if (
    lastDayStatut === STATUT_APPRENANT.APPRENTI ||
    lastDayStatut === STATUT_APPRENANT.INSCRIT ||
    hasNaturallyEndedContract
  ) {
    parcoursRaw.set(lastDayKey, STATUT_APPRENANT.FIN_DE_FORMATION);
  }

  const parcours: IEffectifComputedStatut["parcours"] = [];

  let currentStatut: StatutApprenant | null = null;
  for (const day of days) {
    const statut = parcoursRaw.get(day);
    if (!statut) {
      throw Boom.internal("buildEffectifParcours: unexpected error");
    }

    if (currentStatut === statut) {
      continue;
    }

    parcours.push({
      date: new Date(`${day}T00:00:00.000Z`),
      valeur: statut,
    });

    currentStatut = statut;
  }

  return parcours;
}
