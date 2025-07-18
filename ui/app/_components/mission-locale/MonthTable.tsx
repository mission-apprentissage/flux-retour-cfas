"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { useParams } from "next/navigation";
import { memo } from "react";
import { API_EFFECTIF_LISTE, IMissionLocaleEffectifList } from "shared";

import { LightTable } from "@/app/_components/table/LightTable";
import { useAuth } from "@/app/_context/UserContext";

import { MlSuccessCard } from "../card/MlSuccessCard";

import styles from "./MonthTable.module.css";
import { EffectifData, MonthItem, SelectedSection } from "./types";
import { formatMonthAndYear, anchorFromLabel } from "./utils";

type MonthTableProps = {
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

function buildRowData(effectif: EffectifData, listType: IMissionLocaleEffectifList) {
  if (listType === API_EFFECTIF_LISTE.A_TRAITER) {
    return {
      id: effectif.id,
      name: (
        <div className={`fr-text--bold ${styles.monthTableNameContainer}`}>
          {effectif.prioritaire || effectif.a_contacter ? (
            <p className={`fr-badge fr-badge--orange-terre-battue fr-badge--sm ${styles.prioritaireBadge}`}>
              <i className="fr-icon-fire-fill fr-icon--xs" />
              Prioritaire
            </p>
          ) : (
            <Badge severity="new" small className={styles.noWrapBadge}>
              à traiter
            </Badge>
          )}
          {`${effectif.nom} ${effectif.prenom}`}
        </div>
      ),
      formation: <span className="line-clamp-1">{effectif.libelle_formation}</span>,
      icon: <i className="fr-icon-arrow-right-line fr-icon--sm" />,
    };
  }

  if (listType === API_EFFECTIF_LISTE.TRAITE) {
    return {
      id: effectif.id,
      badge: (
        <Badge severity="success" small>
          traité
        </Badge>
      ),
      name: (
        <div className={`fr-text--bold ${styles.monthTableNameContainer}`}>{`${effectif.nom} ${effectif.prenom}`}</div>
      ),
      formation: <span className="line-clamp-1">{effectif.libelle_formation}</span>,
      icon: <i className="fr-icon-arrow-right-line fr-icon--sm" />,
    };
  }

  if (listType === API_EFFECTIF_LISTE.INJOIGNABLE) {
    return {
      id: effectif.id,
      badge: (
        <Badge severity="info" small>
          sans réponse
        </Badge>
      ),
      name: (
        <div className={`fr-text--bold ${styles.monthTableNameContainer}`}>{`${effectif.nom} ${effectif.prenom}`}</div>
      ),
      formation: <span className="line-clamp-1">{effectif.libelle_formation}</span>,
      icon: <i className="fr-icon-arrow-right-line fr-icon--sm" />,
    };
  }

  // Fallback (in case listType is an unexpected value)
  return {
    id: effectif.id,
    name: `${effectif.nom} ${effectif.prenom}`,
    formation: effectif.libelle_formation,
    icon: null,
  };
}

export const MonthTable = memo(function MonthTable({
  monthItem,
  searchTerm,
  handleSectionChange,
  listType,
}: MonthTableProps) {
  const { user } = useAuth();
  const params = useParams();
  const mlId = params?.id as string | undefined;
  const label = monthItem.month === "plus-de-6-mois" ? "+ de 6 mois" : formatMonthAndYear(monthItem.month);
  const anchorId = anchorFromLabel(label);

  function getColumns(listType: API_EFFECTIF_LISTE): ColumnData[] {
    switch (listType) {
      case API_EFFECTIF_LISTE.A_TRAITER:
        return [
          { label: "Apprenant", dataKey: "name", width: 400 },
          { label: "Formation", dataKey: "formation", width: 350 },
          { label: "", dataKey: "icon", width: 10 },
        ];

      case API_EFFECTIF_LISTE.TRAITE:
        return [
          { label: "Apprenant", dataKey: "name", width: 200 },
          { label: "Formation", dataKey: "formation", width: 350 },
          { label: "Statut", dataKey: "badge", width: 200 },
          { label: "", dataKey: "icon", width: 10 },
        ];

      case API_EFFECTIF_LISTE.INJOIGNABLE:
        return [
          { label: "Apprenant", dataKey: "name", width: 200 },
          { label: "Formation", dataKey: "formation", width: 350 },
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
    element: buildRowData(effectif, listType),
  }));

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
          getRowLink={(rowData) => {
            return user.organisation.type === "ADMINISTRATEUR" && mlId
              ? `/admin/mission-locale/${mlId}/edit/${rowData.id}/?nom_liste=${listType}`
              : `/mission-locale/${rowData.id}?nom_liste=${listType}`;
          }}
          emptyMessage="Aucun élément à afficher"
        />
      )}
    </div>
  );
});
