"use client";

import { Typography, Stack } from "@mui/material";
import { memo } from "react";

import { MlSuccessCard } from "@/app/_components/card/MlSuccessCard";
import { Table } from "@/app/_components/table/Table";

import { TableRow } from "./TableRow";
import { EffectifData, MonthItem } from "./types";
import { formatMonthAndYear, anchorFromLabel } from "./utils";

type MonthTableProps = {
  monthItem: MonthItem;
  isTraite: boolean;
  searchTerm: string;
  handleSectionChange?: (section: "a-traiter" | "deja-traite") => void;
};

export const MonthTable = memo(function MonthTable({
  monthItem,
  isTraite,
  searchTerm,
  handleSectionChange,
}: MonthTableProps) {
  const label = formatMonthAndYear(monthItem.month);
  const anchorId = anchorFromLabel(label);
  const dataRows = monthItem.data.map((student) => ({ rawData: student, element: TableRow({ student, isTraite }) }));
  const columnWidths = isTraite ? ["30%", "50%", "15%", "5%"] : ["15%", "30%", "50%", "5%"];

  return (
    <div id={anchorId} className="fr-mb-4w">
      {monthItem.data.length === 0 ? (
        <Stack mt={2} alignItems="flex-start" spacing={4}>
          <Typography variant="h4" style={{ color: "var(--text-title-blue-france)", textAlign: "left" }}>
            {`${label} (${monthItem.data.length})`}
          </Typography>
          {monthItem.treated_count && monthItem.treated_count > 0 ? (
            <MlSuccessCard handleSectionChange={handleSectionChange} />
          ) : (
            <Typography
              variant="body1"
              color="textSecondary"
              textAlign="left"
              style={{
                color: "var(--text-disabled-grey)",
                fontStyle: "italic",
              }}
            >
              Pas de rupturant à afficher ce mois-ci
            </Typography>
          )}
        </Stack>
      ) : (
        <Table
          caption={`${label} (${monthItem.data.length})`}
          data={dataRows}
          columnWidths={columnWidths}
          searchTerm={searchTerm}
          searchableColumns={[0, 1, 2]}
          itemsPerPage={5}
          className="fr-pt-1w"
          getRowLink={(rowData: EffectifData) => {
            return `/mission-locale/${rowData.id}`;
          }}
        />
      )}
    </div>
  );
});
