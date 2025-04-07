"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Box, Stack, Typography } from "@mui/material";
import { format } from "date-fns/index";
import { fr } from "date-fns/locale";
import React, { useMemo } from "react";

import { Table } from "@/app/_components/table/Table";

import { EffectifPriorityData } from "./types";

type PriorityTableProps = {
  priorityData: EffectifPriorityData[];
};

function formatMonthAndYear(dateStr: string | undefined): string {
  if (!dateStr) return "Date inconnue";
  const d = new Date(dateStr);
  const raw = format(d, "MMMM yyyy", { locale: fr });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function PriorityBadge({ priorityData }: { priorityData: EffectifPriorityData[] }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
      <Badge noIcon severity="warning" style={{ gap: "0.5rem" }}>
        <i className="fr-icon-fire-fill fr-icon--sm" /> À TRAITER EN PRIORITÉ ({priorityData.length})
      </Badge>
    </div>
  );
}

export function PriorityTable({ priorityData }: PriorityTableProps) {
  const columns = useMemo(() => {
    return [
      { label: "", dataKey: "monthBadge", width: 150 },
      { label: "", dataKey: "name", width: 200 },
      { label: "", dataKey: "formation", width: "auto" },
      { label: "", dataKey: "arrow", width: 40 },
    ];
  }, []);

  const tableData = useMemo(() => {
    return priorityData.map((effectif) => {
      const labelMonth = formatMonthAndYear(effectif.dernier_statut.date || "");
      return {
        rawData: effectif,
        element: {
          id: effectif.id,
          monthBadge: (
            <Badge noIcon severity="warning" small>
              {labelMonth}
            </Badge>
          ),
          name: <strong>{`${effectif.nom} ${effectif.prenom}`}</strong>,
          formation: <span className="line-clamp-1">{effectif.libelle_formation}</span>,
          arrow: <i className="fr-icon-arrow-right-line fr-icon--sm" />,
        },
      };
    });
  }, [priorityData]);

  return (
    <Stack p={{ xs: 2, md: 3 }} mt={4} sx={{ background: "var(--background-alt-blue-france)" }}>
      {priorityData.length === 0 ? (
        <Stack direction="row" justifyContent="space-between">
          <Stack>
            <PriorityBadge priorityData={priorityData} />
            <Typography variant="body2" fontWeight="bold">
              À traiter en priorité ({priorityData.length})
            </Typography>
          </Stack>
          <Box
            component="img"
            src={"/images/mission-locale-valid-tick.svg"}
            alt={""}
            sx={{
              width: "50px",
              height: "auto",
              userSelect: "none",
            }}
          />
        </Stack>
      ) : (
        <>
          <PriorityBadge priorityData={priorityData} />
          <Typography variant="body2">
            Nous affichons dans cette liste <strong>les jeunes âgés de 16 à 18 ans</strong> (obligation de formation)
            ainsi que <strong>les jeunes en situation de handicap (RQTH)</strong>.
          </Typography>
          <Table
            caption=""
            data={tableData}
            columns={columns}
            itemsPerPage={6}
            emptyMessage="Aucun élément prioritaire"
            searchableColumns={["nom", "prenom", "libelle_formation"]}
            getRowLink={(row) => `/mission-locale/${row.id}?nom_liste=prioritaire`}
          />
        </>
      )}
    </Stack>
  );
}
