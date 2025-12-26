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
    | "situation"
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
            style={{ marginLeft: "5px" }}
            className="fr-badge fr-badge--success-inverted"
            aria-label="Effectif traité par la ML"
          >
            <i className="fr-icon-success-fill fr-icon--sm" />
            <span style={{ marginLeft: "5px" }}>ML</span>
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

export function EffectifDetailStatusBadge({ effectif }: EffectifStatusBadgeProps) {
  if (effectif.prioritaire && effectif.a_traiter) {
    return (
      <p className="fr-badge fr-badge--red-inverted" aria-label="Effectif prioritaire">
        <i className="fr-icon-fire-fill fr-icon--sm" />
        <span style={{ marginLeft: "5px", fontWeight: "400" }}>À TRAITER EN PRIORITÉ</span>
      </p>
    );
  }

  if (effectif.prioritaire && !effectif.a_traiter && effectif.injoignable) {
    return (
      <p className="fr-badge fr-badge--red-inverted" aria-label="Effectif prioritaire">
        <i className="fr-icon-fire-fill fr-icon--sm" />
        <span style={{ marginLeft: "5px", fontWeight: "400" }}>À RECONTACTER EN PRIORITÉ</span>
      </p>
    );
  }

  return <EffectifStatusBadge effectif={effectif} />;
}

export function EffectifPriorityBadge({ effectif, isHeader = false }: EffectifStatusBadgeProps) {
  const fontSize = isHeader ? "12px" : "14px";
  const iconSize = isHeader ? "fr-icon--xs" : "fr-icon--sm";

  if (effectif.presque_6_mois) {
    return <Presque6MoisBadge iconSize={iconSize} fontSize={fontSize} />;
  }

  if (effectif.mineur) {
    return <MineurBadge iconSize={iconSize} fontSize={fontSize} />;
  }

  if (effectif.rqth) {
    return <RQTHBadge iconSize={iconSize} fontSize={fontSize} />;
  }

  if (effectif.acc_conjoint) {
    return <AccConjointBadge withCollab={true} fontSize={fontSize} />;
  }

  if (effectif.a_contacter) {
    return <AContacterBadge iconSize={iconSize} fontSize={fontSize} />;
  }

  return null;
}

export function EffectifPriorityBadgeMultiple({ effectif, isHeader = false }: EffectifStatusBadgeProps) {
  const fontSize = isHeader ? "12px" : "14px";
  const iconSize = isHeader ? "fr-icon--xs" : "fr-icon--sm";

  const badges: JSX.Element[] = [];

  if (effectif.presque_6_mois) {
    badges.push(<Presque6MoisBadge key="presque_6_mois" iconSize={iconSize} fontSize={fontSize} />);
  } else if (effectif.mineur) {
    badges.push(<MineurBadge key="mineur" iconSize={iconSize} fontSize={fontSize} />);
  } else if (effectif.rqth) {
    badges.push(<RQTHBadge key="rqth" iconSize={iconSize} fontSize={fontSize} />);
  } else if (effectif.a_contacter) {
    badges.push(<AContacterBadge key="a_contacter" iconSize={iconSize} fontSize={fontSize} />);
  }

  if (effectif.acc_conjoint) {
    badges.push(<AccConjointBadge key="acc_conjoint" withCollab={false} fontSize={fontSize} />);
  }

  if (badges.length === 0) {
    return null;
  }

  if (badges.length === 1) {
    return badges[0];
  }

  return <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>{badges}</div>;
}

export function EffectifPriorityBadgeList({ effectif }: { effectif: IEffecifMissionLocale["effectif"] }) {
  if (!(effectif.prioritaire && (effectif.a_traiter || effectif.injoignable))) {
    return null;
  }
  const badgeArray: Array<JSX.Element> = [];

  if (effectif.acc_conjoint) {
    badgeArray.push(<AccConjointBadge key="acc_conjoint" withCollab={true} fontSize="12px" />);
  }

  if (effectif.presque_6_mois) {
    badgeArray.push(<Presque6MoisBadge key="presque_6_mois" iconSize="fr-icon--xs" fontSize="12px" />);
  }

  if (effectif.mineur) {
    badgeArray.push(<MineurBadge key="mineur" iconSize="fr-icon--xs" fontSize="12px" />);
  }

  if (effectif.rqth) {
    badgeArray.push(<RQTHBadge key="rqth" iconSize="fr-icon--xs" fontSize="12px" />);
  }

  if (effectif.a_contacter) {
    badgeArray.push(<AContacterBadge key="a_contacter" iconSize="fr-icon--xs" fontSize="12px" />);
  }
  return badgeArray.length > 0 ? (
    <div style={{ display: "flex", gap: "8px", marginBottom: "1.5rem" }}>{badgeArray}</div>
  ) : null;
}

function Presque6MoisBadge({ iconSize, fontSize }: { iconSize: string; fontSize: string }) {
  return (
    <p className="fr-badge fr-badge--red" aria-label="Effectif à moins d'un mois de l'abandon">
      <i className={`fr-icon-time-fill ${iconSize}`} />
      <span style={{ marginLeft: "5px", fontSize }}>{"<1 MOIS ABANDON"}</span>
    </p>
  );
}

function MineurBadge({ iconSize, fontSize }: { iconSize: string; fontSize: string }) {
  return (
    <p className="fr-badge fr-badge--red" aria-label="Effectif mineur">
      <i className={`fr-icon-fire-fill ${iconSize}`} />
      <span style={{ marginLeft: "5px", fontSize }}>{"16-18 ANS"}</span>
    </p>
  );
}

function RQTHBadge({ iconSize, fontSize }: { iconSize: string; fontSize: string }) {
  return (
    <p className="fr-badge fr-badge--red" aria-label="Effectif RQTH">
      <i className={`fr-icon-fire-fill ${iconSize}`} />
      <span style={{ marginLeft: "5px", fontSize }}>{"RQTH"}</span>
    </p>
  );
}

function AccConjointBadge({ withCollab, fontSize }: { withCollab: boolean; fontSize: string }) {
  return (
    <p
      className="fr-badge"
      aria-label="Effectif en collaboration avec un CFA"
      style={{
        backgroundColor: "#ECECFE",
        color: "#161616",
        fontSize,
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      <div
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          backgroundColor: "#E1000F",
          flexShrink: 0,
        }}
      />
      {withCollab ? "Collab CFA" : "CFA"}
    </p>
  );
}

function AContacterBadge({ iconSize, fontSize }: { iconSize: string; fontSize: string }) {
  return (
    <p className="fr-badge fr-badge--red" aria-label="Effectif ayant répondu à la campagne mail">
      <i className={`fr-icon-time-fill ${iconSize}`} />
      <span style={{ marginLeft: "5px", fontSize }}>{"CAMPAGNE MAIL"}</span>
    </p>
  );
}
