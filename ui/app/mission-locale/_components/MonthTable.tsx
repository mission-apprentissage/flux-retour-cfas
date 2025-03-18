"use client";

import { memo } from "react";

import { Table } from "@/app/_components/table/Table";

import { TableRow } from "./TableRow";
import { MonthItem } from "./types";
import { formatMonthAndYear, anchorFromLabel } from "./utils";

type MonthTableProps = {
  monthItem: MonthItem;
  isTraite: boolean;
  searchTerm: string;
};

export const MonthTable = memo(function MonthTable({ monthItem, isTraite, searchTerm }: MonthTableProps) {
  const label = formatMonthAndYear(monthItem.month);
  const anchorId = anchorFromLabel(label);

  const dataRows = monthItem.data.map((student) => TableRow({ student, isTraite }));

  return (
    <div id={anchorId} className="fr-mb-4w">
      <Table
        caption={`${label} (${monthItem.data.length})`}
        data={dataRows}
        columnWidths={["46%", "46%", "8%"]}
        searchTerm={searchTerm}
        searchableColumns={[0, 1]}
        itemsPerPage={5}
        className="fr-pt-1w"
        getRowLink={(rowIndex) => {
          const item = monthItem.data[rowIndex];
          return `/mission-locale/${item.id}`;
        }}
        emptyMessage={isTraite ? "Aucun jeune déjà traité ce mois-ci" : "Pas de rupturant à afficher ce mois-ci"}
      />
    </div>
  );
});
