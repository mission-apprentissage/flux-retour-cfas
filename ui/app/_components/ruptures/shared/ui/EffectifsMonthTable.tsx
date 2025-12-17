"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { useParams, usePathname } from "next/navigation";
import { memo, useState } from "react";
import { API_EFFECTIF_LISTE, IMissionLocaleEffectifList } from "shared";

import { MlSuccessCard } from "@/app/_components/card/MlSuccessCard";
import { SimpleTable } from "@/app/_components/table/SimpleTable";
import { useAuth } from "@/app/_context/UserContext";
import { formatMonthAndYear, anchorFromLabel, DEFAULT_ITEMS_TO_SHOW } from "@/app/_utils/ruptures.utils";
import { EffectifData, MonthItem, SelectedSection } from "@/common/types/ruptures";

import { matchesSearchTerm } from "../utils/searchUtils";

import { EffectifPriorityBadgeMultiple, EffectifStatusBadge } from "./EffectifStatusBadge";
import styles from "./MonthTable.module.css";
import notificationStyles from "./NotificationBadge.module.css";

type EffectifsMonthTableProps = {
  monthItem: MonthItem;
  searchTerm: string;
  handleSectionChange?: (section: SelectedSection) => void;
  listType: IMissionLocaleEffectifList;
  onDownloadMonth?: (month: string, listType: IMissionLocaleEffectifList) => void;
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
        <EffectifStatusBadge effectif={effectif} organisation={isCfaPage ? "ORGANISME_FORMATION" : "MISSION_LOCALE"} />
      </div>
    ),
    name: (
      <div style={{ display: "flex", flexDirection: "column" }}>
        {listType !== API_EFFECTIF_LISTE.TRAITE && <EffectifPriorityBadgeMultiple effectif={effectif} isHeader />}
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
    formation: <span className="line-clamp-1">{effectif.libelle_formation}</span>,
    icon: <i className="fr-icon-arrow-right-line fr-icon--sm" />,
  };
}

function buildMonthLabel(month: string) {
  if (month === "plus-de-180-j") {
    return {
      labelElement: "+ de 180j",
      labelString: month,
      downloadLabel: "+ de 180j",
    };
  }

  const formattedMonth = formatMonthAndYear(month);
  return {
    labelElement: formattedMonth,
    labelString: month,
    downloadLabel: formattedMonth,
  };
}

export const EffectifsMonthTable = memo(function EffectifsMonthTable({
  monthItem,
  searchTerm,
  handleSectionChange,
  listType,
  onDownloadMonth,
}: EffectifsMonthTableProps) {
  const { user } = useAuth();
  const params = useParams();
  const pathname = usePathname();
  const mlId = params?.id as string | undefined;
  const isCfaPage = pathname && pathname.startsWith("/cfa");
  const { labelElement, labelString, downloadLabel } = buildMonthLabel(monthItem.month);
  const anchorId = anchorFromLabel(labelString);
  const [isExpanded, setIsExpanded] = useState(false);

  const hasMoreItems = monthItem.data.length > DEFAULT_ITEMS_TO_SHOW;
  const remainingItems = monthItem.data.length - DEFAULT_ITEMS_TO_SHOW;

  function getColumns(listType: API_EFFECTIF_LISTE): ColumnData[] {
    switch (listType) {
      case API_EFFECTIF_LISTE.A_TRAITER:
        return [
          { label: "Apprenant", dataKey: "name", width: 200 },
          { label: "Formation", dataKey: "formation", width: 300 },
          { label: "Statut", dataKey: "badge", width: 320 },
          { label: "", dataKey: "icon", width: 10 },
        ];

      case API_EFFECTIF_LISTE.TRAITE:
        return [
          { label: "Apprenant", dataKey: "name", width: 200 },
          { label: "Formation", dataKey: "formation", width: 300 },
          { label: "Statut", dataKey: "badge", width: 200 },
          { label: "", dataKey: "icon", width: 10 },
        ];

      case API_EFFECTIF_LISTE.INJOIGNABLE:
        return [
          { label: "Apprenant", dataKey: "name", width: 200 },
          { label: "Formation", dataKey: "formation", width: 300 },
          { label: "Statut", dataKey: "badge", width: 320 },
          { label: "", dataKey: "icon", width: 10 },
        ];

      default:
        return [];
    }
  }

  const columns: ColumnData[] = getColumns(listType);

  const filteredData = searchTerm
    ? monthItem.data.filter((effectif) => matchesSearchTerm(effectif.nom, effectif.prenom, searchTerm))
    : monthItem.data;

  const dataToShow = searchTerm
    ? filteredData
    : filteredData.slice(0, isExpanded ? filteredData.length : DEFAULT_ITEMS_TO_SHOW);

  const dataRows = dataToShow.map((effectif) => ({
    rawData: effectif,
    element: buildRowData(effectif, listType, pathname?.startsWith("/cfa") || false),
  }));

  const getRowLink = (rawData: EffectifData) => {
    if (pathname && pathname.startsWith("/cfa")) {
      return `/cfa/${rawData.id}?nom_liste=${listType}`;
    }

    return user.organisation.type === "ADMINISTRATEUR" && mlId
      ? `/admin/mission-locale/${mlId}/edit/${rawData.id}/?nom_liste=${listType}`
      : `/mission-locale/${rawData.id}?nom_liste=${listType}`;
  };

  const monthHeaderClassName = styles.monthSection;

  return (
    <div id={anchorId} style={{ marginBottom: "3rem" }}>
      {monthItem.data.length === 0 ? (
        <>
          <div className={monthHeaderClassName}>
            <h4 className={styles.monthTitle}>
              {labelElement}
              {` (${monthItem.data.length})`}
            </h4>
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
              <h4 className={styles.monthTitle}>
                {labelElement}
                {` (${filteredData.length})`}
              </h4>
              {!isCfaPage && onDownloadMonth && (
                <Button
                  priority="secondary"
                  size="small"
                  iconId="ri-download-line"
                  iconPosition="right"
                  onClick={() => onDownloadMonth(monthItem.month, listType)}
                >
                  Ruptures en {downloadLabel}
                </Button>
              )}
            </div>
          </div>
          <div style={{ marginTop: "1rem" }}>
            <SimpleTable
              data={dataRows}
              columns={columns}
              getRowLink={getRowLink}
              emptyMessage="Aucun élément à afficher"
            />
            {hasMoreItems && !searchTerm && (
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
