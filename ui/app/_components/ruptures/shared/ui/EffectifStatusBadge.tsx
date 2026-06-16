import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import { IEffectifMissionLocale } from "shared";

import styles from "./EffectifStatusBadge.module.css";
import badgeStyles from "./WhatsAppBadge.module.css";

interface EffectifStatusBadgeProps {
  effectif: Pick<
    IEffectifMissionLocale["effectif"],
    | "a_traiter"
    | "prioritaire"
    | "injoignable"
    | "a_contacter"
    | "mineur"
    | "rqth"
    | "acc_conjoint"
    | "nouveau_contrat"
    | "situation"
    | "whatsapp_callback_requested"
    | "whatsapp_no_help_responded"
    | "souhaite_rdv"
  >;
  isHeader?: boolean;
  organisation?: "MISSION_LOCALE" | "ORGANISME_FORMATION";
  permanentOnly?: boolean;
}

export function EffectifStatusBadge({ effectif, organisation }: EffectifStatusBadgeProps) {
  if (effectif.nouveau_contrat && (effectif.a_traiter || effectif.injoignable)) {
    return (
      <span className={`fr-badge ${styles.nouveauContratBadge}`} aria-label="Nouveau contrat">
        <i className={`fr-icon-information-fill fr-icon--sm ${styles.nouveauContratIcon}`} aria-hidden="true" />
        <span className={styles.badgeTextSpacing}>Nouveau contrat</span>
      </span>
    );
  }

  // Effectif traité
  if (!effectif.a_traiter && !effectif.injoignable) {
    const badge = <Badge severity="success">traité</Badge>;
    return (
      <>
        {badge}
        {organisation === "ORGANISME_FORMATION" && effectif.situation && (
          <span
            className={`fr-badge fr-badge--success-inverted ${styles.mlTreatedBadge}`}
            aria-label="Effectif traité par la ML"
          >
            <i className="fr-icon-success-fill fr-icon--sm" />
            <span className={styles.badgeTextSpacing}>ML</span>
          </span>
        )}
      </>
    );
  }

  // INJOIGNABLE / A TRAITER
  if (effectif.injoignable) {
    return (
      <span className="fr-badge fr-badge--purple-glycine" aria-label="Effectif à recontacter">
        <i className="fr-icon-phone-fill fr-icon--sm" />
        <span className={styles.badgeTextSpacing}>À RECONTACTER</span>
      </span>
    );
  }

  if (effectif.a_traiter) {
    return (
      <span className="fr-badge fr-badge--yellow-tournesol" aria-label="Effectif à traiter">
        <i className="fr-icon-flashlight-fill fr-icon--sm" />
        <span className={styles.badgeTextSpacing}>À TRAITER</span>
      </span>
    );
  }

  // Fallback (in case no conditions are met)
  return null;
}

export function EffectifDetailStatusBadge({ effectif }: EffectifStatusBadgeProps) {
  if (effectif.prioritaire && effectif.a_traiter) {
    return (
      <span className="fr-badge fr-badge--red-inverted" aria-label="Effectif prioritaire">
        <i className="fr-icon-fire-fill fr-icon--sm" />
        <span className={`${styles.badgeTextSpacing} ${styles.fontWeightNormal}`}>À TRAITER EN PRIORITÉ</span>
      </span>
    );
  }

  if (effectif.prioritaire && !effectif.a_traiter && effectif.injoignable) {
    return (
      <span className="fr-badge fr-badge--red-inverted" aria-label="Effectif prioritaire">
        <i className="fr-icon-fire-fill fr-icon--sm" />
        <span className={`${styles.badgeTextSpacing} ${styles.fontWeightNormal}`}>À RECONTACTER EN PRIORITÉ</span>
      </span>
    );
  }

  return <EffectifStatusBadge effectif={effectif} />;
}

function getAllPriorityBadges(
  effectif: EffectifStatusBadgeProps["effectif"],
  { fontSize, iconSize }: { fontSize: string; iconSize: string }
): JSX.Element[] {
  const badges: JSX.Element[] = [];

  if (effectif.souhaite_rdv) {
    badges.push(<SouhaiteRdvBadge key="souhaite_rdv" fontSize={fontSize} />);
  }
  if (effectif.whatsapp_no_help_responded) {
    badges.push(<WhatsAppNoHelpBadge key="whatsapp_no_help" fontSize={fontSize} />);
  }
  if (effectif.mineur) {
    badges.push(<MineurBadge key="mineur" iconSize={iconSize} fontSize={fontSize} />);
  }
  if (effectif.rqth) {
    badges.push(<RQTHBadge key="rqth" iconSize={iconSize} fontSize={fontSize} />);
  }
  if (effectif.a_contacter) {
    badges.push(<AContacterBadge key="a_contacter" iconSize={iconSize} fontSize={fontSize} />);
  }
  if (effectif.acc_conjoint) {
    badges.push(<AccConjointBadge key="acc_conjoint" fontSize={fontSize} />);
  }

  return badges;
}

function getPermanentBadges(
  effectif: EffectifStatusBadgeProps["effectif"],
  { fontSize, iconSize }: { fontSize: string; iconSize: string }
): JSX.Element[] {
  const badges: JSX.Element[] = [];

  if (effectif.mineur) {
    badges.push(<MineurBadge key="mineur" iconSize={iconSize} fontSize={fontSize} />);
  }
  if (effectif.rqth) {
    badges.push(<RQTHBadge key="rqth" iconSize={iconSize} fontSize={fontSize} />);
  }
  if (effectif.acc_conjoint) {
    badges.push(<AccConjointBadge key="acc_conjoint" fontSize={fontSize} />);
  }

  return badges;
}

export function EffectifPriorityBadgeMultiple({
  effectif,
  isHeader = false,
  permanentOnly = false,
}: EffectifStatusBadgeProps) {
  const fontSize = isHeader ? "12px" : "14px";
  const iconSize = isHeader ? "fr-icon--xs" : "fr-icon--sm";

  const badges = permanentOnly
    ? getPermanentBadges(effectif, { fontSize, iconSize })
    : getAllPriorityBadges(effectif, { fontSize, iconSize });

  if (badges.length === 0) return null;
  if (badges.length === 1) return badges[0];
  return <div className={styles.badgesContainer}>{badges}</div>;
}

export function EffectifPriorityBadgeList({ effectif }: { effectif: IEffectifMissionLocale["effectif"] }) {
  if (!(effectif.prioritaire && (effectif.a_traiter || effectif.injoignable))) {
    return null;
  }

  const badges = getAllPriorityBadges(effectif, { fontSize: "12px", iconSize: "fr-icon--xs" });

  return badges.length > 0 ? <div className={styles.badgesContainerWithMargin}>{badges}</div> : null;
}

function MineurBadge({ iconSize, fontSize }: { iconSize: string; fontSize: string }) {
  return (
    <span className="fr-badge fr-badge--red" aria-label="Effectif mineur">
      <i className={`fr-icon-fire-fill ${iconSize}`} aria-hidden="true" />
      <span className={styles.badgeTextSpacing} style={{ fontSize }}>
        {"16-18 ANS"}
      </span>
    </span>
  );
}

function RQTHBadge({ iconSize, fontSize }: { iconSize: string; fontSize: string }) {
  return (
    <span className="fr-badge fr-badge--red" aria-label="Effectif RQTH">
      <i className={`fr-icon-fire-fill ${iconSize}`} aria-hidden="true" />
      <span className={styles.badgeTextSpacing} style={{ fontSize }}>
        {"RQTH"}
      </span>
    </span>
  );
}

function AccConjointBadge({ fontSize }: { fontSize: string }) {
  return (
    <span
      className={`fr-badge ${styles.accConjointBadge}`}
      aria-label="Effectif en collaboration avec un CFA"
      style={{ fontSize }}
    >
      <i className="ri-school-fill fr-icon--xs" aria-hidden="true" />
      Collab CFA
    </span>
  );
}

function AContacterBadge({ iconSize, fontSize }: { iconSize: string; fontSize: string }) {
  return (
    <span className="fr-badge fr-badge--red" aria-label="Effectif ayant répondu à la campagne mail">
      <i className={`fr-icon-time-fill ${iconSize}`} aria-hidden="true" />
      <span className={styles.badgeTextSpacing} style={{ fontSize }}>
        {"CAMPAGNE MAIL"}
      </span>
    </span>
  );
}

function SouhaiteRdvBadge({ fontSize }: { fontSize: string }) {
  return (
    <span className={`fr-badge ${badgeStyles.whatsappBadgeCallback}`} aria-label="Effectif souhaite un RDV">
      <i className="ri-message-3-fill fr-icon--sm" style={{ color: "#18753C" }} />
      <span className={styles.availabilityDot} aria-hidden="true">
        <span className={styles.availabilityDotOuter} />
        <span className={styles.availabilityDotInner} />
      </span>
      <span style={{ fontSize }}>SOUHAITE UN RDV</span>
      <Tooltip
        kind="hover"
        title={
          <span className={styles.tooltipContent}>
            <span className={styles.tooltipIcon} style={{ display: "inline-flex", alignItems: "center" }}>
              <i className="ri-message-3-fill fr-icon--sm" style={{ color: "#18753C" }} />
              <span className={styles.availabilityDot} aria-hidden="true">
                <span className={styles.availabilityDotOuter} />
                <span className={styles.availabilityDotInner} />
              </span>
            </span>
            <span>
              Le jeune a indiqu&eacute; via WhatsApp qu&apos;il souhaite &ecirc;tre recontact&eacute; par la Mission
              Locale.
            </span>
          </span>
        }
      />
    </span>
  );
}

export function SouhaiteRdvBadgeInline() {
  return (
    <span className={`fr-badge ${badgeStyles.whatsappBadgeCallback}`} aria-label="Souhaite un RDV">
      <i className="ri-message-3-fill fr-icon--sm" style={{ color: "#18753C" }} />
      <span className={styles.availabilityDot} aria-hidden="true">
        <span className={styles.availabilityDotOuter} />
        <span className={styles.availabilityDotInner} />
      </span>
      <span style={{ fontSize: "12px" }}>SOUHAITE UN RDV</span>
    </span>
  );
}

function WhatsAppNoHelpBadge({ fontSize }: { fontSize: string }) {
  return (
    <span
      className={`fr-badge ${badgeStyles.whatsappBadgeNoHelp}`}
      aria-label="Effectif ne souhaitant pas être recontacté via WhatsApp"
    >
      <i className="ri-whatsapp-line fr-icon--sm" aria-hidden="true" />
      <span style={{ fontSize }}>NE SOUHAITE PAS ÊTRE RECONTACTÉ·E</span>
    </span>
  );
}
