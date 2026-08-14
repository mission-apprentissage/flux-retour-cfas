"use client";

import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import { ReactNode } from "react";
import { IndicateursEffectifs, TypeEffectifNominatif } from "shared";

import { formatNumber } from "@/common/utils/stringUtils";

import styles from "./indicateurs.module.scss";

interface CardConfig {
  type: Exclude<TypeEffectifNominatif, "inconnu">;
  label: string;
  count: (indicateurs: IndicateursEffectifs) => number;
  icon: string;
  tooltip: string;
  big?: boolean;
}

const CARDS: CardConfig[] = [
  {
    type: "apprenant",
    label: "apprenants",
    count: (indicateurs) => indicateurs.apprenants,
    icon: "fr-icon-group-line",
    tooltip:
      "Nombre d’apprenants en contrat d’apprentissage. Cet indicateur est basé sur la réception d’un statut transmis par les organismes de formation. Est considéré comme un apprenant, un jeune inscrit en formation dans un organisme de formation en apprentissage : en formation et en recherche d’une entreprise, apprenti en entreprise, ou apprenti en rupture de contrat et à la recherche d’un nouvel employeur.",
    big: true,
  },
  {
    type: "apprenti",
    label: "dont apprentis",
    count: (indicateurs) => indicateurs.apprentis,
    icon: "fr-icon-account-line",
    tooltip:
      "Un apprenti est un jeune apprenant inscrit en centre de formation et ayant signé un contrat dans une entreprise qui le forme.",
  },
  {
    type: "rupturant",
    label: "dont rupturants",
    count: (indicateurs) => indicateurs.rupturants,
    icon: "fr-icon-close-circle-line",
    tooltip:
      "Un jeune est considéré en rupture lorsqu’il ne travaille plus dans l’entreprise qui l’accueillait. Néanmoins, il reste inscrit dans le centre de formation et dispose d’un délai de 6 mois pour retrouver une entreprise auprès de qui se former. Il est considéré comme stagiaire de la formation professionnelle.",
  },
  {
    type: "inscritSansContrat",
    label: "dont jeunes sans contrat",
    count: (indicateurs) => indicateurs.inscrits,
    icon: "fr-icon-file-text-line",
    tooltip:
      "Un jeune sans contrat est un jeune inscrit qui débute sa formation sans contrat signé en entreprise. Le jeune dispose d’un délai de 3 mois pour trouver son entreprise et continuer sereinement sa formation.",
  },
  {
    type: "abandon",
    label: "sorties d’apprentissage",
    count: (indicateurs) => indicateurs.abandons,
    icon: "fr-icon-logout-box-r-line",
    tooltip:
      "Sorties d’apprentissage (anciennement « abandons ») : nombre d’apprenants ou apprentis qui ont définitivement quitté le centre de formation à la date affichée. Ces situations peuvent être consécutives à une rupture de contrat avec départ du centre de formation, à un départ sans que l’apprenant n’ait jamais eu de contrat, ou à un départ pour intégrer une entreprise en CDI ou CDD plus rémunérateur.",
  },
];

interface IndicateursCardsProps {
  indicateursEffectifs: IndicateursEffectifs;
  loading: boolean;
}

function Card({ children, big }: { children: ReactNode; big?: boolean }) {
  return <div className={`${styles.card} ${big ? styles.cardBig : ""}`}>{children}</div>;
}

export function IndicateursCards({ indicateursEffectifs, loading }: IndicateursCardsProps) {
  return (
    <div className={styles.cardsGrid}>
      {CARDS.map((card) => {
        const count = loading ? 0 : card.count(indicateursEffectifs);
        return (
          <Card key={card.type} big={card.big}>
            <i className={`${card.icon} ${styles.cardIcon}`} aria-hidden="true" />
            <div>
              <p className={`${styles.cardCount} ${card.big ? styles.cardCountBig : ""}`}>
                {loading ? "—" : formatNumber(count)}
              </p>
              <p className={styles.cardLabel}>
                {card.label} <Tooltip kind="hover" title={card.tooltip} />
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
