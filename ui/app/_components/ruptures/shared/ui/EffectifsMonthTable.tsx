"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { memo, useState } from "react";
import { API_EFFECTIF_LISTE, IMissionLocaleEffectifList } from "shared";

import { MlSuccessCard } from "@/app/_components/card/MlSuccessCard";
import { SimpleTable } from "@/app/_components/table/SimpleTable";
import { useAuth } from "@/app/_context/UserContext";
import {
  formatMonthAndYear,
  anchorFromLabel,
  DEFAULT_ITEMS_TO_SHOW,
  matchesPostalCodes,
} from "@/app/_utils/ruptures.utils";
import { EffectifData, MonthItem, SelectedSection } from "@/common/types/ruptures";

import { matchesSearchTerm } from "../utils/searchUtils";

import { CommuneCell } from "./CommuneCell";
import { EffectifPriorityBadgeMultiple } from "./EffectifStatusBadge";
import styles from "./MonthTable.module.css";
import notificationStyles from "./NotificationBadge.module.css";
import { StatutDateCell } from "./StatutDateCell";

type EffectifsMonthTableProps = {
  monthItem: MonthItem;
  searchTerm: string;
  handleSectionChange?: (section: SelectedSection) => void;
  listType: IMissionLocaleEffectifList;
  selectedPostalCodes?: string[];
};

type ColumnData = {
  label: string;
  dataKey: string;
  width?: number | string;
};

function buildRowData(effectif: EffectifData, listType: IMissionLocaleEffectifList, isCfaPage: boolean) {
  return {
    id: effectif.id,
    badge: (
      <div style={{ display: "flex", alignItems: "end", width: "100%", justifyContent: "flex-end" }}>
        <StatutDateCell effectif={effectif} organisation={isCfaPage ? "ORGANISME_FORMATION" : "MISSION_LOCALE"} />
      </div>
    ),
    name: (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <EffectifPriorityBadgeMultiple
          effectif={effectif}
          isHeader
          organisation={isCfaPage ? "ORGANISME_FORMATION" : "MISSION_LOCALE"}
          permanentOnly={listType === API_EFFECTIF_LISTE.TRAITE}
        />
        <div className={notificationStyles.badgeContainer}>
          {isCfaPage && effectif.unread_by_current_user && (
            <span className={notificationStyles.notificationDot} title="Nouvelle information de la Mission Locale" />
          )}
          <div className={`fr-text--bold ${styles.monthTableNameContainer}`}>
            {`${effectif.nom} ${effectif.prenom}`}
          </div>
        </div>
      </div>
    ),
    formation: <span className="line-clamp-2">{effectif.libelle_formation}</span>,
    commune: <CommuneCell commune={effectif.commune} code_postal={effectif.code_postal} />,
    icon: (
      <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
        <i className="fr-icon-arrow-right-line fr-icon--sm" />
      </div>
    ),
  };
}

function buildMonthLabel(month: string) {
  if (month === "plus-de-180-j") {
    return { labelElement: "+ de 180j | En abandon", labelString: month };
  }
  return { labelElement: formatMonthAndYear(month), labelString: month };
}

export const EffectifsMonthTable = memo(function EffectifsMonthTable({
  monthItem,
  searchTerm,
  handleSectionChange,
  listType,
  selectedPostalCodes = [],
}: EffectifsMonthTableProps) {
  const { user } = useAuth();
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mlId = params?.id as string | undefined;
  const isCfaPage = pathname && pathname.startsWith("/cfa");
  const { labelElement, labelString } = buildMonthLabel(monthItem.month);
  const anchorId = anchorFromLabel(labelString);
  const [isExpanded, setIsExpanded] = useState(false);

  function getColumns(listType: API_EFFECTIF_LISTE): ColumnData[] {
    switch (listType) {
      case API_EFFECTIF_LISTE.A_TRAITER:
      case API_EFFECTIF_LISTE.INJOIGNABLE:
      case API_EFFECTIF_LISTE.TRAITE:
      case API_EFFECTIF_LISTE.A_TRAITER_OU_RECONTACTER:
        return [
          { label: "Apprenant", dataKey: "name", width: 250 },
          { label: "Formation", dataKey: "formation", width: "auto" },
          ...(isCfaPage ? [] : [{ label: "Commune", dataKey: "commune", width: 120 }]),
          { label: "Statut", dataKey: "badge", width: 230 },
          { label: "", dataKey: "icon", width: 40 },
        ];

      default:
        return [];
    }
  }

  const columns: ColumnData[] = getColumns(listType);

  const isFiltering = !!searchTerm || selectedPostalCodes.length > 0;

  const filteredData = monthItem.data.filter(
    (effectif) =>
      (!searchTerm || matchesSearchTerm(effectif.nom, effectif.prenom, searchTerm)) &&
      matchesPostalCodes(effectif, selectedPostalCodes)
  );

  const hasMoreItems = filteredData.length > DEFAULT_ITEMS_TO_SHOW;
  const remainingItems = filteredData.length - DEFAULT_ITEMS_TO_SHOW;

  const dataToShow = isFiltering
    ? filteredData
    : filteredData.slice(0, isExpanded ? filteredData.length : DEFAULT_ITEMS_TO_SHOW);

  const dataRows = dataToShow.map((effectif) => ({
    rawData: effectif,
    element: buildRowData(effectif, listType, pathname?.startsWith("/cfa") || false),
  }));

  // Transmet le filtre villes à la fiche pour que le calcul précédent/suivant reste dans le sous-ensemble filtré.
  const cpQuery = selectedPostalCodes.length > 0 ? `&cp=${selectedPostalCodes.join(",")}` : "";
  // Les critères ne sont pas connus du serveur : transmis pour que le retour à la liste les retrouve.
  const criteresQuery = searchParams?.get("criteres") ? `&criteres=${searchParams.get("criteres")}` : "";
  // La liste fusionnée alimente aussi la vue « Dossiers prioritaires » : on marque l'origine
  // pour que le fil d'Ariane de la fiche ramène bien à la liste d'où vient le conseiller.
  const origineQuery = pathname?.startsWith("/mission-locale/ruptures") ? "&origine=ruptures" : "";

  const getRowLink = (rawData: EffectifData) => {
    if (pathname && pathname.startsWith("/cfa")) {
      return `/cfa/${rawData.id}?nom_liste=${listType}${cpQuery}`;
    }

    return user.organisation.type === "ADMINISTRATEUR" && mlId
      ? `/admin/mission-locale/${mlId}/edit/${rawData.id}/?nom_liste=${listType}${cpQuery}`
      : `/mission-locale/${rawData.id}?nom_liste=${listType}${cpQuery}${criteresQuery}${origineQuery}`;
  };

  const monthHeaderClassName = styles.monthSection;

  return (
    <div id={anchorId} style={{ marginBottom: "3rem" }}>
      {monthItem.data.length === 0 ? (
        <>
          <div className={monthHeaderClassName}>
            <div className={styles.monthHeader}>
              <h4 className={styles.monthTitle}>{labelElement}</h4>
              <span className={styles.monthCount}>0 jeune</span>
            </div>
          </div>
          <div style={{ marginTop: "1rem" }}>
            {monthItem.treated_count && monthItem.treated_count > 0 ? (
              <MlSuccessCard handleSectionChange={handleSectionChange} />
            ) : (
              <p className={styles.monthTableEmptyText}>Pas de rupturant à afficher ce mois-ci</p>
            )}
          </div>
        </>
      ) : (
        <>
          <div className={monthHeaderClassName}>
            <div className={styles.monthHeader}>
              <h4 className={styles.monthTitle}>{labelElement}</h4>
              <span className={styles.monthCount}>
                {filteredData.length} jeune{filteredData.length > 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <div style={{ marginTop: "1rem" }}>
            <SimpleTable
              data={dataRows}
              columns={columns}
              getRowLink={getRowLink}
              emptyMessage="Aucun élément à afficher"
            />
            {hasMoreItems && !isFiltering && (
              <div style={{ display: "flex", justifyContent: "center", marginTop: "1rem" }}>
                <Button
                  iconId={isExpanded ? "ri-subtract-line" : "ri-add-line"}
                  iconPosition="right"
                  priority="secondary"
                  size="small"
                  onClick={() => {
                    if (isExpanded) {
                      setIsExpanded(false);
                      requestAnimationFrame(() => {
                        document.getElementById(anchorId)?.scrollIntoView({ behavior: "smooth", block: "start" });
                      });
                    } else {
                      setIsExpanded(true);
                    }
                  }}
                >
                  {isExpanded ? "Réduire la liste" : `Afficher tous (${remainingItems} de plus)`}
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
});
