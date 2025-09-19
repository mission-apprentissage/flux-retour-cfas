import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { IEffecifMissionLocale } from "shared";

interface EffectifStatusBadgeProps {
  effectif: Pick<
    IEffecifMissionLocale["effectif"],
    "a_traiter" | "prioritaire" | "injoignable" | "presque_6_mois" | "a_contacter" | "mineur" | "rqth" | "acc_conjoint"
  >;
  //priorityLabel: string;
}

export function EffectifStatusBadge({ effectif }: EffectifStatusBadgeProps) {
  // Effectif traité
  if (!effectif.a_traiter && !effectif.injoignable) {
    return <Badge severity="success">traité</Badge>;
  }

  // PRIORITAIRE

  if (effectif.presque_6_mois) {
    return (
      <p className="fr-badge fr-badge--red" aria-label="Effectif à moins d'un mois de l'abandon">
        <i className="fr-icon-time-fill fr-icon--xs" />
        <span style={{ marginLeft: "5px" }}>{"<1 MOIS ABANDON"}</span>
      </p>
    );
  }

  if (effectif.mineur) {
    return (
      <p className="fr-badge fr-badge--red" aria-label="Effectif mineur">
        <i className="fr-icon-fire-fill fr-icon--xs" />
        <span style={{ marginLeft: "5px" }}>{"16-18 ANS"}</span>
      </p>
    );
  }

  if (effectif.rqth) {
    return (
      <p className="fr-badge fr-badge--red" aria-label="Effectif RQTH">
        <i className="fr-icon-fire-fill fr-icon--xs" />
        <span style={{ marginLeft: "5px" }}>{"RQTH"}</span>
      </p>
    );
  }

  if (effectif.acc_conjoint) {
    return (
      <p className="fr-badge fr-badge--red" aria-label="Effectif en collaboration avec un CFA">
        <i className="fr-icon-time-fill fr-icon--xs" />
        <span style={{ marginLeft: "5px" }}>{"COLLAB CFA"}</span>
      </p>
    );
  }

  if (effectif.a_contacter) {
    return (
      <p className="fr-badge fr-badge--red" aria-label="Effectif ayant répondu à la campagne mail">
        <i className="fr-icon-time-fill fr-icon--xs" />
        <span style={{ marginLeft: "5px" }}>{"CAMPAGNE MAIL"}</span>
      </p>
    );
  }

  // INJOIGNABLE / A TRAITER
  if (effectif.injoignable) {
    return (
      <p className="fr-badge fr-badge--purple-glycine" aria-label="Effectif à recontacter">
        <i className="fr-icon-phone-fill fr-icon--xs" />
        <span style={{ marginLeft: "5px" }}>À RECONTACTER</span>
      </p>
    );
  }

  if (effectif.a_traiter) {
    return <Badge severity="new">à traiter</Badge>;
  }

  // Fallback (in case no conditions are met)
  return null;
}
