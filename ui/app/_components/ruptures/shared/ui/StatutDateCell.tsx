import { ML_DELAI_RELANCE_JOURS } from "shared/constants";

import { formatDateSuivi, isDelaiRelanceDepasse } from "@/app/_utils/ruptures.utils";

import { EffectifStatusBadge } from "./EffectifStatusBadge";
import styles from "./StatutDateCell.module.css";

type StatutDateCellEffectif = React.ComponentProps<typeof EffectifStatusBadge>["effectif"] & {
  date_reception?: string | Date | null;
  date_traitement?: string | Date | null;
  date_dernier_passage_a_recontacter?: string | Date | null;
};

interface StatutDateCellProps {
  effectif: StatutDateCellEffectif;
  organisation?: "MISSION_LOCALE" | "ORGANISME_FORMATION";
}

function getDerniereActivite(effectif: StatutDateCellEffectif) {
  if (effectif.a_traiter) {
    return { prefixe: "reçu", date: effectif.date_reception, alertable: true, relatif: true };
  }
  // « depuis aujourd'hui » se lit mal : ce préfixe garde toujours la date
  if (effectif.injoignable) {
    return { prefixe: "depuis", date: effectif.date_dernier_passage_a_recontacter, alertable: true, relatif: false };
  }
  return { prefixe: "traité", date: effectif.date_traitement, alertable: false, relatif: true };
}

/** Badge de statut et sa date, en orange au-delà du délai de relance (jamais pour un dossier traité). */
export function StatutDateCell({ effectif, organisation }: StatutDateCellProps) {
  const { prefixe, date, alertable, relatif } = getDerniereActivite(effectif);
  const enRetard = alertable && isDelaiRelanceDepasse(date);
  const dateFormatee = formatDateSuivi(date, { relatif });

  return (
    <div className={styles.statutCell}>
      <EffectifStatusBadge effectif={effectif} organisation={organisation} />
      {dateFormatee && (
        <span
          className={enRetard ? styles.derniereActiviteAlerte : styles.derniereActivite}
          {...(enRetard ? { "aria-label": `En attente depuis plus de ${ML_DELAI_RELANCE_JOURS} jours` } : {})}
        >
          {prefixe} {dateFormatee}
        </span>
      )}
    </div>
  );
}
