import Boom from "boom";
import { addDays, eachDayOfInterval, formatISO, min } from "date-fns";
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
    const lastDay = contrat.rupture?.date_rupture
      ? addDays(contrat.rupture?.date_rupture, -1)
      : (contrat.date_fin ?? effectif.session.fin);

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

  parcoursRaw.set(days.at(-1)!, STATUT_APPRENANT.FIN_DE_FORMATION);

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
