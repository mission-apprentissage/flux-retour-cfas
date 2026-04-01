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
    | "contact_opportun"
    | "a_contacter"
    | "mineur"
    | "rqth"
    | "acc_conjoint"
    | "nouveau_contrat"
    | "situation"
    | "whatsapp_callback_requested"
    | "whatsapp_no_help_responded"
  >;
  isHeader?: boolean;
  organisation?: "MISSION_LOCALE" | "ORGANISME_FORMATION";
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
          <p
            className={`fr-badge fr-badge--success-inverted ${styles.mlTreatedBadge}`}
            aria-label="Effectif traité par la ML"
          >
            <i className="fr-icon-success-fill fr-icon--sm" />
            <span className={styles.badgeTextSpacing}>ML</span>
          </p>
        )}
      </>
    );
  }

  // INJOIGNABLE / A TRAITER
  if (effectif.injoignable) {
    return (
      <p className="fr-badge fr-badge--purple-glycine" aria-label="Effectif à recontacter">
        <i className="fr-icon-phone-fill fr-icon--sm" />
        <span className={styles.badgeTextSpacing}>À RECONTACTER</span>
      </p>
    );
  }

  if (effectif.a_traiter) {
    return (
      <p className="fr-badge fr-badge--yellow-tournesol" aria-label="Effectif à traiter">
        <i className="fr-icon-flashlight-fill fr-icon--sm" />
        <span className={styles.badgeTextSpacing}>A TRAITER</span>
      </p>
    );
  }

  // Fallback (in case no conditions are met)
  return null;
}

export function EffectifDetailStatusBadge({ effectif }: EffectifStatusBadgeProps) {
  if (effectif.prioritaire && effectif.a_traiter) {
    return (
      <p className="fr-badge fr-badge--red-inverted" aria-label="Effectif prioritaire">
        <i className="fr-icon-fire-fill fr-icon--sm" />
        <span className={`${styles.badgeTextSpacing} ${styles.fontWeightNormal}`}>À TRAITER EN PRIORITÉ</span>
      </p>
    );
  }

  if (effectif.prioritaire && !effectif.a_traiter && effectif.injoignable) {
    return (
      <p className="fr-badge fr-badge--red-inverted" aria-label="Effectif prioritaire">
        <i className="fr-icon-fire-fill fr-icon--sm" />
        <span className={`${styles.badgeTextSpacing} ${styles.fontWeightNormal}`}>À RECONTACTER EN PRIORITÉ</span>
      </p>
    );
  }

  return <EffectifStatusBadge effectif={effectif} />;
}

function getAllPriorityBadges(
  effectif: EffectifStatusBadgeProps["effectif"],
  {
    fontSize,
    iconSize,
    organisation,
  }: { fontSize: string; iconSize: string; organisation?: EffectifStatusBadgeProps["organisation"] }
): JSX.Element[] {
  const badges: JSX.Element[] = [];

  if (effectif.whatsapp_callback_requested) {
    badges.push(<WhatsAppCallbackBadge key="whatsapp_callback" fontSize={fontSize} />);
  }
  if (effectif.whatsapp_no_help_responded) {
    badges.push(<WhatsAppNoHelpBadge key="whatsapp_no_help" fontSize={fontSize} />);
  }
  if (effectif.contact_opportun) {
    badges.push(<ContactOpportunBadge key="contact_opportun" iconSize={iconSize} fontSize={fontSize} />);
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
    badges.push(
      <AccConjointBadge key="acc_conjoint" withCollab={organisation === "MISSION_LOCALE"} fontSize={fontSize} />
    );
  }

  return badges;
}

export function EffectifPriorityBadgeMultiple({ effectif, isHeader = false, organisation }: EffectifStatusBadgeProps) {
  const fontSize = isHeader ? "12px" : "14px";
  const iconSize = isHeader ? "fr-icon--xs" : "fr-icon--sm";

  const badges = getAllPriorityBadges(effectif, { fontSize, iconSize, organisation });

  if (badges.length === 0) return null;
  if (badges.length === 1) return badges[0];
  return <div className={styles.badgesContainer}>{badges}</div>;
}

export function EffectifPriorityBadgeList({ effectif }: { effectif: IEffectifMissionLocale["effectif"] }) {
  if (!(effectif.prioritaire && (effectif.a_traiter || effectif.injoignable))) {
    return null;
  }

  const badges = getAllPriorityBadges(
    { ...effectif, contact_opportun: false },
    { fontSize: "12px", iconSize: "fr-icon--xs" }
  );

  return badges.length > 0 ? <div className={styles.badgesContainerWithMargin}>{badges}</div> : null;
}

function ContactOpportunBadge({ iconSize, fontSize }: { iconSize: string; fontSize: string }) {
  return (
    <p className={`fr-badge ${styles.contactOpportunBadge}`} aria-label="Contact opportun">
      <i className={`ri-sparkling-fill ${iconSize} ${styles.contactOpportunIcon}`} aria-hidden="true" />
      <span style={{ fontSize }}>CONTACT OPPORTUN</span>
      <Tooltip
        kind="hover"
        title={
          <span className={styles.tooltipContent}>
            <i className={`ri-sparkling-fill fr-icon--sm ${styles.tooltipIcon}`} style={{ color: "#6A6AF4" }} />
            <span>
              D&apos;apr&egrave;s plusieurs crit&egrave;res d&apos;analyse, notre algorithme pense que les chances que
              ce jeune vous r&eacute;ponde sont plus &eacute;lev&eacute;es que la moyenne.{" "}
              <em>Cette suggestion est une pr&eacute;diction, et ne garantit pas le r&eacute;sultat.</em>
            </span>
          </span>
        }
      />
    </p>
  );
}

export function EffectifContactOpportunBadge() {
  return <ContactOpportunBadge iconSize="fr-icon--sm" fontSize="14px" />;
}

function MineurBadge({ iconSize, fontSize }: { iconSize: string; fontSize: string }) {
  return (
    <p className="fr-badge fr-badge--red" aria-label="Effectif mineur">
      <i className={`fr-icon-fire-fill ${iconSize}`} aria-hidden="true" />
      <span className={styles.badgeTextSpacing} style={{ fontSize }}>
        {"16-18 ANS"}
      </span>
    </p>
  );
}

function RQTHBadge({ iconSize, fontSize }: { iconSize: string; fontSize: string }) {
  return (
    <p className="fr-badge fr-badge--red" aria-label="Effectif RQTH">
      <i className={`fr-icon-fire-fill ${iconSize}`} aria-hidden="true" />
      <span className={styles.badgeTextSpacing} style={{ fontSize }}>
        {"RQTH"}
      </span>
    </p>
  );
}

function AccConjointBadge({ withCollab, fontSize }: { withCollab: boolean; fontSize: string }) {
  return (
    <p
      className={`fr-badge ${styles.accConjointBadge}`}
      aria-label="Effectif en collaboration avec un CFA"
      style={{ fontSize }}
    >
      <i className="ri-school-fill fr-icon--xs" aria-hidden="true" />
      {withCollab ? "Collaboration CFA" : "CFA"}
    </p>
  );
}

function AContacterBadge({ iconSize, fontSize }: { iconSize: string; fontSize: string }) {
  return (
    <p className="fr-badge fr-badge--red" aria-label="Effectif ayant répondu à la campagne mail">
      <i className={`fr-icon-time-fill ${iconSize}`} aria-hidden="true" />
      <span className={styles.badgeTextSpacing} style={{ fontSize }}>
        {"CAMPAGNE MAIL"}
      </span>
    </p>
  );
}

function WhatsAppCallbackBadge({ fontSize }: { fontSize: string }) {
  return (
    <p className={`fr-badge ${badgeStyles.whatsappBadgeCallback}`} aria-label="Effectif disponible via WhatsApp">
      <i className="ri-whatsapp-fill fr-icon--sm" style={{ color: "#18753C" }} />
      <span className={styles.availabilityDot} aria-hidden="true">
        <span className={styles.availabilityDotOuter} />
        <span className={styles.availabilityDotInner} />
      </span>
      <span style={{ fontSize }}>DISPONIBLE</span>
      <Tooltip
        kind="hover"
        title={
          <span className={styles.tooltipContent}>
            <span className={styles.tooltipIcon} style={{ display: "inline-flex", alignItems: "center" }}>
              <i className="ri-whatsapp-fill fr-icon--sm" style={{ color: "#18753C" }} />
              <span className={styles.availabilityDot} aria-hidden="true">
                <span className={styles.availabilityDotOuter} />
                <span className={styles.availabilityDotInner} />
              </span>
            </span>
            <span>
              Vous avez contact&eacute; ce jeune, nous lui avons renvoy&eacute; un message sur WhatsApp pour requalifier
              son besoin.{" "}
              <strong>
                Il ou elle a demand&eacute; &agrave; &ecirc;tre recontact&eacute;&middot;e par la Mission Locale.
              </strong>
            </span>
          </span>
        }
      />
    </p>
  );
}

function WhatsAppNoHelpBadge({ fontSize }: { fontSize: string }) {
  return (
    <p
      className={`fr-badge ${badgeStyles.whatsappBadgeNoHelp}`}
      aria-label="Effectif ne souhaitant pas être recontacté via WhatsApp"
    >
      <i className="ri-whatsapp-line fr-icon--sm" aria-hidden="true" />
      <span style={{ fontSize }}>NE SOUHAITE PAS ÊTRE RECONTACTÉ·E</span>
    </p>
  );
}
