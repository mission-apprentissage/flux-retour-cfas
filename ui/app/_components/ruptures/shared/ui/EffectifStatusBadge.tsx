import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { IEffecifMissionLocale } from "shared";

interface EffectifStatusBadgeProps {
  effectif: Pick<
    IEffecifMissionLocale["effectif"],
    | "a_traiter"
    | "prioritaire"
    | "injoignable"
    | "presque_6_mois"
    | "a_contacter"
    | "mineur"
    | "rqth"
    | "acc_conjoint"
    | "nouveau_contrat"
  >;
  isHeader?: boolean;
}

export function EffectifStatusBadge({ effectif }: EffectifStatusBadgeProps) {
  if (effectif.nouveau_contrat && effectif.a_traiter && !effectif.injoignable) {
    return <Badge severity="info">Nouveau contrat</Badge>;
  }

  // Effectif traité
  if (!effectif.a_traiter && !effectif.injoignable) {
    return <Badge severity="success">traité</Badge>;
  }

  // INJOIGNABLE / A TRAITER
  if (effectif.injoignable) {
    return (
      <p className="fr-badge fr-badge--purple-glycine" aria-label="Effectif à recontacter">
        <i className="fr-icon-phone-fill fr-icon--sm" />
        <span style={{ marginLeft: "5px" }}>À RECONTACTER</span>
      </p>
    );
  }

  if (effectif.a_traiter) {
    return (
      <p className="fr-badge fr-badge--yellow-tournesol" aria-label="Effectif à traiter">
        <i className="fr-icon-flashlight-fill fr-icon--sm" />
        <span style={{ marginLeft: "5px" }}>A TRAITER</span>
      </p>
    );
  }

  // Fallback (in case no conditions are met)
  return null;
}

export function EffectifPriorityBadge({ effectif, isHeader = false }: EffectifStatusBadgeProps) {
  // PRIORITAIRE

  const fontSize = isHeader ? "12px" : "14px";
  const iconSize = isHeader ? "fr-icon--xs" : "fr-icon--sm";

  if (effectif.presque_6_mois) {
    return (
      <p className="fr-badge fr-badge--red" aria-label="Effectif à moins d'un mois de l'abandon">
        <i className={`fr-icon-time-fill ${iconSize}`} />
        <span style={{ marginLeft: "5px", fontSize }}>{"<1 MOIS ABANDON"}</span>
      </p>
    );
  }

  if (effectif.mineur) {
    return (
      <p className="fr-badge fr-badge--red" aria-label="Effectif mineur">
        <i className={`fr-icon-fire-fill ${iconSize}`} />
        <span style={{ marginLeft: "5px", fontSize }}>{"16-18 ANS"}</span>
      </p>
    );
  }

  if (effectif.rqth) {
    return (
      <p className="fr-badge fr-badge--red" aria-label="Effectif RQTH">
        <i className={`fr-icon-fire-fill ${iconSize}`} />
        <span style={{ marginLeft: "5px", fontSize }}>{"RQTH"}</span>
      </p>
    );
  }

  if (effectif.acc_conjoint) {
    return (
      <p className="fr-badge fr-badge--red" aria-label="Effectif en collaboration avec un CFA">
        <i className={`fr-icon-time-fill ${iconSize}`} />
        <span style={{ marginLeft: "5px", fontSize }}>{"COLLAB CFA"}</span>
      </p>
    );
  }

  if (effectif.a_contacter) {
    return (
      <p className="fr-badge fr-badge--red" aria-label="Effectif ayant répondu à la campagne mail">
        <i className={`fr-icon-time-fill ${iconSize}`} />
        <span style={{ marginLeft: "5px", fontSize }}>{"CAMPAGNE MAIL"}</span>
      </p>
    );
  }

  return null;
}
