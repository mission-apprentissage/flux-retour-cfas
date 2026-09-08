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
    | "fin_de_formation"
  >;
  isHeader?: boolean;
  organisation?: "MISSION_LOCALE" | "ORGANISME_FORMATION";
  permanentOnly?: boolean;
}

export function EffectifStatusBadge({ effectif, organisation }: EffectifStatusBadgeProps) {
  if (effectif.nouveau_contrat && (effectif.a_traiter || effectif.injoignable)) {
    return (
      <span className={`fr-badge fr-badge--sm ${styles.nouveauContratBadge}`} aria-label="Nouveau contrat">
        <i className={`fr-icon-information-fill fr-icon--sm ${styles.nouveauContratIcon}`} aria-hidden="true" />
        <span className={styles.badgeTextSpacing}>Nouveau contrat</span>
      </span>
    );
  }

  // Effectif traité
  if (!effectif.a_traiter && !effectif.injoignable) {
    const badge = (
      <Badge severity="success" small>
        traité
      </Badge>
    );
    return (
      <>
        {badge}
        {organisation === "ORGANISME_FORMATION" && effectif.situation && (
          <span
            className={`fr-badge fr-badge--sm fr-badge--success-inverted ${styles.mlTreatedBadge}`}
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
      <span className="fr-badge fr-badge--sm fr-badge--purple-glycine" aria-label="Effectif à recontacter">
        <i className="fr-icon-phone-fill fr-icon--sm" />
        <span className={styles.badgeTextSpacing}>À RECONTACTER</span>
      </span>
    );
  }

  if (effectif.a_traiter) {
    return (
      <span className="fr-badge fr-badge--sm fr-badge--yellow-tournesol" aria-label="Effectif à traiter">
        <i className="fr-icon-flashlight-fill fr-icon--sm" />
        <span className={styles.badgeTextSpacing}>À TRAITER</span>
      </span>
    );
  }

  // Fallback (in case no conditions are met)
  return null;
}

type BadgeBuilderOptions = { iconSize: string; includeFinDeFormation?: boolean };

function getAllPriorityBadges(
  effectif: EffectifStatusBadgeProps["effectif"],
  { iconSize, includeFinDeFormation = false }: BadgeBuilderOptions
): JSX.Element[] {
  const badges: JSX.Element[] = [];

  // Ordre d'affichage aligné sur l'ordre de priorité : CFA, souhaite un RDV, mineur, RQTH.
  if (effectif.acc_conjoint) {
    badges.push(<AccConjointBadge key="acc_conjoint" />);
  }
  if (effectif.souhaite_rdv) {
    badges.push(<SouhaiteRdvBadge key="souhaite_rdv" />);
  }
  if (effectif.whatsapp_no_help_responded) {
    badges.push(<WhatsAppNoHelpBadge key="whatsapp_no_help" />);
  }
  if (effectif.mineur) {
    badges.push(<MineurBadge key="mineur" iconSize={iconSize} />);
  }
  if (effectif.rqth) {
    badges.push(<RQTHBadge key="rqth" iconSize={iconSize} />);
  }
  if (effectif.a_contacter) {
    badges.push(<AContacterBadge key="a_contacter" iconSize={iconSize} />);
  }
  if (includeFinDeFormation && effectif.fin_de_formation) {
    badges.push(<FinDeFormationBadge key="fin_de_formation" />);
  }

  return badges;
}

export const aDesBadgesDePriorite = (
  effectif: EffectifStatusBadgeProps["effectif"],
  { includeFinDeFormation = false }: { includeFinDeFormation?: boolean } = {}
): boolean => getAllPriorityBadges(effectif, { iconSize: "", includeFinDeFormation }).length > 0;

function getPermanentBadges(
  effectif: EffectifStatusBadgeProps["effectif"],
  { iconSize, includeFinDeFormation = false }: BadgeBuilderOptions
): JSX.Element[] {
  const badges: JSX.Element[] = [];

  if (effectif.acc_conjoint) {
    badges.push(<AccConjointBadge key="acc_conjoint" />);
  }
  if (effectif.mineur) {
    badges.push(<MineurBadge key="mineur" iconSize={iconSize} />);
  }
  if (effectif.rqth) {
    badges.push(<RQTHBadge key="rqth" iconSize={iconSize} />);
  }
  if (includeFinDeFormation && effectif.fin_de_formation) {
    badges.push(<FinDeFormationBadge key="fin_de_formation" />);
  }

  return badges;
}

export function EffectifPriorityBadgeMultiple({
  effectif,
  isHeader = false,
  permanentOnly = false,
}: EffectifStatusBadgeProps) {
  // La taille du texte est celle de `fr-badge--sm` ; seule l'icône reste plus discrète en en-tête.
  const iconSize = isHeader ? "fr-icon--xs" : "fr-icon--sm";

  const badges = permanentOnly
    ? getPermanentBadges(effectif, { iconSize, includeFinDeFormation: !isHeader })
    : getAllPriorityBadges(effectif, { iconSize, includeFinDeFormation: !isHeader });

  if (badges.length === 0) return null;
  if (badges.length === 1) return badges[0];
  return <div className={styles.badgesContainer}>{badges}</div>;
}

function MineurBadge({ iconSize }: { iconSize: string }) {
  return (
    <span className="fr-badge fr-badge--sm fr-badge--red" aria-label="Effectif mineur">
      <i className={`fr-icon-fire-fill ${iconSize}`} aria-hidden="true" />
      <span className={styles.badgeTextSpacing}>{"Mineur"}</span>
    </span>
  );
}

function RQTHBadge({ iconSize }: { iconSize: string }) {
  return (
    <span className="fr-badge fr-badge--sm fr-badge--red" aria-label="Effectif RQTH">
      <i className={`fr-icon-fire-fill ${iconSize}`} aria-hidden="true" />
      <span className={styles.badgeTextSpacing}>{"RQTH"}</span>
    </span>
  );
}

function AccConjointBadge() {
  return (
    <span
      className={`fr-badge fr-badge--sm ${styles.accConjointBadge}`}
      aria-label="Effectif en collaboration avec un CFA"
    >
      <i className="ri-school-fill fr-icon--xs" aria-hidden="true" />
      CFA
    </span>
  );
}

function FinDeFormationBadge() {
  return (
    <span className={`fr-badge fr-badge--sm ${styles.finDeFormationBadge}`} aria-label="Effectif en fin de formation">
      <i className="ri-information-fill fr-icon--sm" aria-hidden="true" />
      Fin de formation
    </span>
  );
}

function AContacterBadge({ iconSize }: { iconSize: string }) {
  return (
    <span className="fr-badge fr-badge--sm fr-badge--red" aria-label="Effectif ayant répondu à la campagne mail">
      <i className={`fr-icon-time-fill ${iconSize}`} aria-hidden="true" />
      <span className={styles.badgeTextSpacing}>{"CAMPAGNE MAIL"}</span>
    </span>
  );
}

function SouhaiteRdvBadge() {
  return (
    <span
      className={`fr-badge fr-badge--sm ${badgeStyles.whatsappBadgeCallback}`}
      aria-label="Effectif souhaite un RDV"
    >
      <i className="ri-chat-check-fill fr-icon--sm" style={{ color: "#18753C" }} />
      <span className={styles.availabilityDot} aria-hidden="true">
        <span className={styles.availabilityDotOuter} />
        <span className={styles.availabilityDotInner} />
      </span>
      <span>SOUHAITE UN RDV</span>
      <Tooltip
        kind="hover"
        title={
          <div className={styles.tooltipContent}>
            <span className={styles.tooltipIcon} style={{ display: "inline-flex", alignItems: "center" }}>
              <i className="ri-chat-check-fill fr-icon--sm" style={{ color: "#18753C" }} />
              <span className={styles.availabilityDot} aria-hidden="true">
                <span className={styles.availabilityDotOuter} />
                <span className={styles.availabilityDotInner} />
              </span>
            </span>
            <div>
              <p className={styles.tooltipText}>Nous avons contacté ce jeune par message pour qualifier son intérêt.</p>
              <p className={styles.tooltipText}>
                <strong>Il ou elle a demandé à être recontacté•e par la Mission Locale.</strong>
              </p>
            </div>
          </div>
        }
      />
    </span>
  );
}

export function SouhaiteRdvBadgeInline() {
  return (
    <span className={`fr-badge fr-badge--sm ${badgeStyles.whatsappBadgeCallback}`} aria-label="Souhaite un RDV">
      <i className="ri-message-3-fill fr-icon--sm" style={{ color: "#18753C" }} />
      <span className={styles.availabilityDot} aria-hidden="true">
        <span className={styles.availabilityDotOuter} />
        <span className={styles.availabilityDotInner} />
      </span>
      <span>SOUHAITE UN RDV</span>
    </span>
  );
}

function WhatsAppNoHelpBadge() {
  return (
    <span
      className={`fr-badge fr-badge--sm ${badgeStyles.whatsappBadgeNoHelp}`}
      aria-label="Effectif ne souhaitant pas être recontacté via WhatsApp"
    >
      <i className="ri-whatsapp-line fr-icon--sm" aria-hidden="true" />
      <span>NE SOUHAITE PAS ÊTRE RECONTACTÉ·E</span>
    </span>
  );
}
