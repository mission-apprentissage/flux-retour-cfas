import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { IEffectifMissionLocale } from "shared";

import styles from "./EffectifStatusBadge.module.css";
import badgeStyles from "./WhatsAppBadge.module.css";

interface EffectifStatusBadgeProps {
  effectif: Pick<
    IEffectifMissionLocale["effectif"],
    | "a_traiter"
    | "prioritaire"
    | "injoignable"
    | "presque_6_mois"
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
    return <Badge severity="info">Nouveau contrat</Badge>;
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

function getPrimaryPriorityBadge(
  effectif: EffectifStatusBadgeProps["effectif"],
  { fontSize, iconSize }: { fontSize: string; iconSize: string }
): JSX.Element | null {
  if (effectif.whatsapp_callback_requested) {
    return <WhatsAppCallbackBadge key="whatsapp_callback" fontSize={fontSize} />;
  }
  if (effectif.whatsapp_no_help_responded) {
    return <WhatsAppNoHelpBadge key="whatsapp_no_help" fontSize={fontSize} />;
  }
  if (effectif.presque_6_mois) {
    return <Presque6MoisBadge key="presque_6_mois" iconSize={iconSize} fontSize={fontSize} />;
  }
  if (effectif.mineur) {
    return <MineurBadge key="mineur" iconSize={iconSize} fontSize={fontSize} />;
  }
  if (effectif.rqth) {
    return <RQTHBadge key="rqth" iconSize={iconSize} fontSize={fontSize} />;
  }
  if (effectif.a_contacter) {
    return <AContacterBadge key="a_contacter" iconSize={iconSize} fontSize={fontSize} />;
  }
  return null;
}

export function EffectifPriorityBadge({ effectif, isHeader = false }: EffectifStatusBadgeProps) {
  const fontSize = isHeader ? "12px" : "14px";
  const iconSize = isHeader ? "fr-icon--xs" : "fr-icon--sm";

  const primary = getPrimaryPriorityBadge(effectif, { fontSize, iconSize });
  if (primary) return primary;

  if (effectif.acc_conjoint) {
    return <AccConjointBadge withCollab={true} fontSize={fontSize} />;
  }

  return null;
}

export function EffectifPriorityBadgeMultiple({ effectif, isHeader = false }: EffectifStatusBadgeProps) {
  const fontSize = isHeader ? "12px" : "14px";
  const iconSize = isHeader ? "fr-icon--xs" : "fr-icon--sm";

  const badges: JSX.Element[] = [];

  const primary = getPrimaryPriorityBadge(effectif, { fontSize, iconSize });
  if (primary) badges.push(primary);

  if (effectif.acc_conjoint) {
    badges.push(<AccConjointBadge key="acc_conjoint" withCollab={false} fontSize={fontSize} />);
  }

  if (badges.length === 0) return null;
  if (badges.length === 1) return badges[0];
  return <div className={styles.badgesContainer}>{badges}</div>;
}

export function EffectifPriorityBadgeList({ effectif }: { effectif: IEffectifMissionLocale["effectif"] }) {
  if (!(effectif.prioritaire && (effectif.a_traiter || effectif.injoignable))) {
    return null;
  }

  const badges: JSX.Element[] = [];

  const primary = getPrimaryPriorityBadge(effectif, { fontSize: "12px", iconSize: "fr-icon--xs" });
  if (primary) badges.push(primary);

  if (effectif.acc_conjoint) {
    badges.push(<AccConjointBadge key="acc_conjoint" withCollab={true} fontSize="12px" />);
  }

  return badges.length > 0 ? <div className={styles.badgesContainerWithMargin}>{badges}</div> : null;
}

function Presque6MoisBadge({ iconSize, fontSize }: { iconSize: string; fontSize: string }) {
  return (
    <p className="fr-badge fr-badge--red" aria-label="Effectif à moins d'un mois de l'abandon">
      <i className={`fr-icon-time-fill ${iconSize}`} />
      <span className={styles.badgeTextSpacing} style={{ fontSize }}>
        {"<1 MOIS ABANDON"}
      </span>
    </p>
  );
}

function MineurBadge({ iconSize, fontSize }: { iconSize: string; fontSize: string }) {
  return (
    <p className="fr-badge fr-badge--red" aria-label="Effectif mineur">
      <i className={`fr-icon-fire-fill ${iconSize}`} />
      <span className={styles.badgeTextSpacing} style={{ fontSize }}>
        {"16-18 ANS"}
      </span>
    </p>
  );
}

function RQTHBadge({ iconSize, fontSize }: { iconSize: string; fontSize: string }) {
  return (
    <p className="fr-badge fr-badge--red" aria-label="Effectif RQTH">
      <i className={`fr-icon-fire-fill ${iconSize}`} />
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
      <div className={styles.accConjointDot} />
      {withCollab ? "Collab CFA" : "CFA"}
    </p>
  );
}

function AContacterBadge({ iconSize, fontSize }: { iconSize: string; fontSize: string }) {
  return (
    <p className="fr-badge fr-badge--red" aria-label="Effectif ayant répondu à la campagne mail">
      <i className={`fr-icon-time-fill ${iconSize}`} />
      <span className={styles.badgeTextSpacing} style={{ fontSize }}>
        {"CAMPAGNE MAIL"}
      </span>
    </p>
  );
}

function WhatsAppCallbackBadge({ fontSize }: { fontSize: string }) {
  return (
    <p className={`fr-badge ${badgeStyles.whatsappBadgeCallback}`} aria-label="Effectif disponible via WhatsApp">
      <i className="ri-whatsapp-line fr-icon--sm" />
      <span style={{ fontSize }}>DISPONIBLE</span>
    </p>
  );
}

function WhatsAppNoHelpBadge({ fontSize }: { fontSize: string }) {
  return (
    <p
      className={`fr-badge ${badgeStyles.whatsappBadgeNoHelp}`}
      aria-label="Effectif ne souhaitant pas être recontacté via WhatsApp"
    >
      <i className="ri-whatsapp-line fr-icon--sm" />
      <span style={{ fontSize }}>NE SOUHAITE PAS ÊTRE RECONTACTÉ·E</span>
    </p>
  );
}
