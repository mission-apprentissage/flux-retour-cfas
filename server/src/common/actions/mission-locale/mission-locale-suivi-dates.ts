import { IMissionLocaleEffectif } from "shared/models";
import { SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";

type SuiviDatesSet = Partial<
  Pick<IMissionLocaleEffectif, "date_traitement" | "date_dernier_passage_a_recontacter" | "date_derniere_action_ml">
>;

/**
 * Dates de suivi à poser lors d'une écriture d'un utilisateur ML. `date_derniere_action_ml`
 * sert de référence au nudge : les événements automatiques ne doivent pas la toucher.
 */
export const computeSuiviDatesSet = (
  situation: SITUATION_ENUM | null | undefined,
  hasWrite: boolean,
  now: Date
): SuiviDatesSet => {
  if (!hasWrite) {
    return {};
  }

  const set: SuiviDatesSet = { date_derniere_action_ml: now };

  if (situation === undefined) {
    return set;
  }

  if (situation === SITUATION_ENUM.CONTACTE_SANS_RETOUR) {
    return { ...set, date_dernier_passage_a_recontacter: now, date_traitement: null };
  }

  // situation null : retour à « à traiter », le traitement précédent n'a plus lieu d'être
  if (situation === null) {
    return { ...set, date_traitement: null };
  }

  return { ...set, date_traitement: now };
};
