"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Typography, Stack } from "@mui/material";
import { memo } from "react";

import { MlSuccessCard } from "@/app/_components/card/MlSuccessCard";
import { Table } from "@/app/_components/table/Table";

import { EffectifData, MonthItem } from "./types";
import { formatMonthAndYear, anchorFromLabel } from "./utils";

type MonthTableProps = {
  monthItem: MonthItem;
  isTraite: boolean;
  searchTerm: string;
  handleSectionChange?: (section: "a-traiter" | "deja-traite") => void;
};

type ColumnData = {
  label: string;
  dataKey: string;
  width?: number | string;
};

function buildRowData(effectif: EffectifData, isTraite: boolean) {
  if (!isTraite) {
    return {
      id: effectif.id,
      name: (
        <div className="fr-text--bold" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {effectif.prioritaire ? (
            <p className="fr-badge fr-badge--orange-terre-battue fr-badge--sm" style={{ gap: "0.2rem" }}>
              <i className="fr-icon-fire-fill fr-icon--xs" />
              Prioritaire
            </p>
          ) : (
            <Badge severity="new" small style={{ whiteSpace: "nowrap" }}>
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
  return {
    id: effectif.id,
    badge: (
      <Badge severity="success" small>
        traité
      </Badge>
    ),
    name: (
      <div className="fr-text--bold" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {`${effectif.nom} ${effectif.prenom}`}
      </div>
    ),
    formation: <span className="line-clamp-1">{effectif.libelle_formation}</span>,
    icon: <i className="fr-icon-arrow-right-line fr-icon--sm" />,
  };
}

export const MonthTable = memo(function MonthTable({
  monthItem,
  isTraite,
  searchTerm,
  handleSectionChange,
}: MonthTableProps) {
  const label = monthItem.month === "plus-de-6-mois" ? "+ de 6 mois" : formatMonthAndYear(monthItem.month);
  const anchorId = anchorFromLabel(label);

  const columns: ColumnData[] = isTraite
    ? [
        { label: "Apprenant", dataKey: "name", width: 200 },
        { label: "Formation", dataKey: "formation", width: 350 },
        { label: "Statut", dataKey: "badge", width: 200 },
        { label: "", dataKey: "icon", width: 10 },
      ]
    : [
        { label: "Apprenant", dataKey: "name", width: 400 },
        { label: "Formation", dataKey: "formation", width: 350 },
        { label: "", dataKey: "icon", width: 10 },
      ];

  const dataRows = monthItem.data.map((effectif) => ({
    rawData: effectif,
    element: buildRowData(effectif, isTraite),
  }));

  return (
    <div id={anchorId} className="fr-mb-4w fr-mt-4w">
      {monthItem.data.length === 0 ? (
        <Stack mt={2} alignItems="flex-start" spacing={4}>
          <Typography
            variant="h4"
            sx={{
              color: "var(--text-title-blue-france)",
              textAlign: "left",
            }}
          >
            {`${label} (${monthItem.data.length})`}
          </Typography>
          {monthItem.treated_count && monthItem.treated_count > 0 ? (
            <MlSuccessCard handleSectionChange={handleSectionChange} />
          ) : (
            <Typography
              variant="body1"
              color="textSecondary"
              textAlign="left"
              style={{ color: "var(--text-disabled-grey)", fontStyle: "italic" }}
            >
              Pas de rupturant à afficher ce mois-ci
            </Typography>
          )}
        </Stack>
      ) : (
        <Table
          caption={`${label} (${monthItem.data.length})`}
          data={dataRows}
          columns={columns}
          searchTerm={searchTerm}
          searchableColumns={[
            "nom",
            "prenom",
            "libelle_formation",
            "organisme_nom",
            "organisme_raison_sociale",
            "organisme_enseigne",
          ]}
          itemsPerPage={7}
          getRowLink={(rowData) => `/mission-locale/${rowData.id}`}
          emptyMessage="Aucun élément à afficher"
        />
      )}
    </div>
  );
});
