import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { IEffecifMissionLocale } from "shared";

interface EffectifStatusBadgeProps {
  effectif: IEffecifMissionLocale["effectif"];
  priorityLabel: string;
}

export function EffectifStatusBadge({ effectif, priorityLabel }: EffectifStatusBadgeProps) {
  if (effectif.injoignable) {
    return (
      <p className="fr-badge fr-badge--purple-glycine" aria-label="Effectif à recontacter">
        <i className="fr-icon-phone-fill fr-icon--xs" />
        <span style={{ marginLeft: "5px" }}>À RECONTACTER</span>
      </p>
    );
  }

  if (effectif.a_traiter && (effectif.prioritaire || effectif.a_contacter)) {
    return (
      <p className="fr-badge fr-badge--orange-terre-battue" style={{ gap: "4px" }} aria-label="Effectif prioritaire">
        <i className="fr-icon-fire-fill fr-icon--sm" /> {priorityLabel}
      </p>
    );
  }

  if (effectif.a_traiter) {
    return <Badge severity="new">à traiter</Badge>;
  }

  return <Badge severity="success">traité</Badge>;
}
