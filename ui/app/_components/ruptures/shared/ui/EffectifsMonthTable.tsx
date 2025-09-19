"use client";

import { useParams, usePathname } from "next/navigation";
import { memo } from "react";
import { API_EFFECTIF_LISTE, IMissionLocaleEffectifList } from "shared";

import { MlSuccessCard } from "@/app/_components/card/MlSuccessCard";
import { LightTable } from "@/app/_components/table/LightTable";
import { useAuth } from "@/app/_context/UserContext";
import { formatMonthAndYear, anchorFromLabel } from "@/app/_utils/ruptures.utils";
import { EffectifData, MonthItem, SelectedSection } from "@/common/types/ruptures";

import { EffectifStatusBadge } from "./EffectifStatusBadge";
import styles from "./MonthTable.module.css";

type EffectifsMonthTableProps = {
  monthItem: MonthItem;
  searchTerm: string;
  handleSectionChange?: (section: SelectedSection) => void;
  listType: IMissionLocaleEffectifList;
};

type ColumnData = {
  label: string;
  dataKey: string;
  width?: number | string;
};

function buildRowData(effectif: EffectifData) {
  return {
    id: effectif.id,
    badge: (
      <div style={{ display: "flex", alignItems: "end", width: "100%", justifyContent: "flex-end" }}>
        <EffectifStatusBadge effectif={effectif} />
      </div>
    ),
    name: (
      <div className={`fr-text--bold ${styles.monthTableNameContainer}`}>{`${effectif.nom} ${effectif.prenom}`}</div>
    ),
    formation: <span className="line-clamp-1">{effectif.libelle_formation}</span>,
    icon: <i className="fr-icon-arrow-right-line fr-icon--sm" />,
  };
}

export const EffectifsMonthTable = memo(function EffectifsMonthTable({
  monthItem,
  searchTerm,
  handleSectionChange,
  listType,
}: EffectifsMonthTableProps) {
  const { user } = useAuth();
  const params = useParams();
  const pathname = usePathname();
  const mlId = params?.id as string | undefined;
  const label = monthItem.month === "plus-de-180-j" ? "+ de 180j" : formatMonthAndYear(monthItem.month);
  const anchorId = anchorFromLabel(label);

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
          { label: "Apprenant", dataKey: "name", width: 300 },
          { label: "Formation", dataKey: "formation", width: 300 },
          { label: "Statut", dataKey: "badge", width: 200 },
          { label: "", dataKey: "icon", width: 10 },
        ];

      default:
        return [];
    }
  }

  const columns: ColumnData[] = getColumns(listType);

  const dataRows = monthItem.data.map((effectif) => ({
    rawData: effectif,
    element: buildRowData(effectif),
  }));

  const getRowLink = (rowData) => {
    if (pathname && pathname.startsWith("/cfa")) {
      return `/cfa/${rowData.id}?nom_liste=${listType}`;
    }

    return user.organisation.type === "ADMINISTRATEUR" && mlId
      ? `/admin/mission-locale/${mlId}/edit/${rowData.id}/?nom_liste=${listType}`
      : `/mission-locale/${rowData.id}?nom_liste=${listType}`;
  };

  return (
    <div id={anchorId} className="fr-mb-4w fr-mt-4w">
      {monthItem.data.length === 0 ? (
        <div className={styles.monthTableEmpty}>
          <h4 className={styles.monthTableTitle}>{`${label} (${monthItem.data.length})`}</h4>
          {monthItem.treated_count && monthItem.treated_count > 0 ? (
            <MlSuccessCard handleSectionChange={handleSectionChange} />
          ) : (
            <p className={styles.monthTableEmptyText}>Pas de rupturant à afficher ce mois-ci</p>
          )}
        </div>
      ) : (
        <LightTable
          caption={`${label} (${monthItem.data.length})`}
          data={dataRows}
          columns={columns}
          searchTerm={searchTerm}
          searchableColumns={["nom", "prenom"]}
          itemsPerPage={7}
          getRowLink={getRowLink}
          emptyMessage="Aucun élément à afficher"
        />
      )}
    </div>
  );
});
