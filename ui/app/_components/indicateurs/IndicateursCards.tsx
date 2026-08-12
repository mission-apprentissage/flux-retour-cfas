"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import { ReactNode, useState } from "react";
import {
  IndicateursEffectifs,
  PlausibleGoalType,
  shouldDisplayContactInEffectifNominatif,
  TypeEffectifNominatif,
} from "shared";

import { useAuth } from "@/app/_context/UserContext";
import { usePlausibleAppTracking } from "@/app/_hooks/plausible";
import { getEffectifsExportColumnFromOrganisationType } from "@/common/actions/organisation.actions";
import { _get } from "@/common/httpClient";
import { exportDataAsXlsx } from "@/common/utils/exportUtils";
import { formatNumber } from "@/common/utils/stringUtils";
import { convertEffectifsFiltersToQuery, EffectifsFiltersFull } from "@/modules/models/effectifs-filters";

import styles from "./indicateurs.module.scss";

const nominatifModal = createModal({ id: "indicateurs-effectifs-nominatifs", isOpenedByDefault: false });

const typeToGoalPlausible: { [_key in Exclude<TypeEffectifNominatif, "inconnu">]: PlausibleGoalType } = {
  inscritSansContrat: "telechargement_liste_sans_contrats",
  rupturant: "telechargement_liste_rupturants",
  abandon: "telechargement_liste_abandons",
  apprenti: "telechargement_liste_apprentis",
  apprenant: "telechargement_liste_apprenants",
};

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
  /** Sans filtres ni organisme, les téléchargements de listes nominatives ne sont pas proposés. */
  effectifsFilters?: EffectifsFiltersFull;
  organismeId?: string;
}

function Card({ children, big }: { children: ReactNode; big?: boolean }) {
  return <div className={`${styles.card} ${big ? styles.cardBig : ""}`}>{children}</div>;
}

export function IndicateursCards({
  indicateursEffectifs,
  loading,
  effectifsFilters,
  organismeId,
}: IndicateursCardsProps) {
  const { user } = useAuth();
  const { trackPlausibleEvent } = usePlausibleAppTracking();
  const [pendingType, setPendingType] = useState<Exclude<TypeEffectifNominatif, "inconnu"> | null>(null);

  const organisationType = (user?.organisation as any)?.type;
  const acl = (user as any)?.acl;
  const permissionEffectifsNominatifs = acl
    ? Object.entries(acl.effectifsNominatifs)
        .filter(([, value]) => value !== false)
        .map(([key]) => key)
    : [];

  const downloadEffectifsNominatifs = async (type: Exclude<TypeEffectifNominatif, "inconnu">) => {
    if (!effectifsFilters || !organismeId) return;
    trackPlausibleEvent(typeToGoalPlausible[type]);
    const effectifs = await _get(`/api/v1/organismes/${organismeId}/indicateurs/effectifs/${type}`, {
      params: convertEffectifsFiltersToQuery(effectifsFilters),
    });
    exportDataAsXlsx(
      `tdb-effectifs-${type}-${effectifsFilters.date.toISOString().substring(0, 10)}.xlsx`,
      effectifs,
      getEffectifsExportColumnFromOrganisationType(organisationType)
    );
  };

  const onDownloadClick = async (type: Exclude<TypeEffectifNominatif, "inconnu">) => {
    if (shouldDisplayContactInEffectifNominatif(organisationType)) {
      setPendingType(type);
      nominatifModal.open();
      return;
    }
    await downloadEffectifsNominatifs(type);
  };

  return (
    <>
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
                {permissionEffectifsNominatifs.includes(card.type) && effectifsFilters && organismeId && (
                  <Button
                    priority="tertiary no outline"
                    size="small"
                    iconId="fr-icon-download-line"
                    iconPosition="right"
                    disabled={count === 0}
                    title={count === 0 ? "Aucun effectif à télécharger" : undefined}
                    onClick={() => onDownloadClick(card.type)}
                  >
                    Télécharger la liste
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <nominatifModal.Component
        title="Téléchargement des listes nominatives"
        buttons={[
          { children: "Annuler", priority: "secondary", doClosesModal: true },
          {
            children: "J’ai compris",
            priority: "primary",
            doClosesModal: false,
            nativeButtonProps: { type: "button" },
            onClick: async () => {
              if (pendingType) await downloadEffectifsNominatifs(pendingType);
              nominatifModal.close();
              setPendingType(null);
            },
          },
        ]}
      >
        <p>
          Pour appuyer le travail des cellules régionales interministérielles d’accompagnement vers l’apprentissage,
          vous avez à votre disposition des listes nominatives des jeunes sans contrat, rupturants et sortie
          d’apprentissage.
        </p>
        <p>
          Il est recommandé, dans le respect de la mission d’accompagnement des OFA, de prévenir ces derniers de la
          prise en charge des jeunes dont ils portent la responsabilité.
        </p>
      </nominatifModal.Component>
    </>
  );
}
