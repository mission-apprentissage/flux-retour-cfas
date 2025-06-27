"use client";

import { Box, Grid2, Typography } from "@mui/material";
import { pieArcLabelClasses, PieChart } from "@mui/x-charts/PieChart";
import { useMemo } from "react";

import { LightTable } from "@/app/_components/table/LightTable";
import { _get } from "@/common/httpClient";

const computePercentage = (part: number, total: number) => {
  if (total === 0 || part === 0) return "--";

  return Math.round((part / total) * 100);
};

const TotalPieChart = ({ data }) => {
  const transformedData = data.reduce(
    (acc, { stats }) => {
      return {
        traite: (stats.traite || 0) + (acc.traite || 0),
        a_traiter: (stats.a_traiter || 0) + (acc.a_traiter || 0),
        total: (stats.total || 0) + (acc.total || 0),
      };
    },
    { traite: 0, a_traiter: 0, total: 0 }
  );

  if (transformedData.total === 0) {
    return (
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Typography variant="body1">Aucune donnée disponible</Typography>
      </Box>
    );
  }

  return (
    <PieChart
      series={[
        {
          arcLabel: (item) => `${computePercentage(item.value, transformedData.total)}%`,
          arcLabelMinAngle: 35,
          arcLabelRadius: "60%",
          labelMarkType: "square",
          data: [
            {
              id: "traite",
              value: transformedData.traite,
              label: "Traités",
              labelMarkType: "square",
              color: "#2846BC",
            },
            {
              id: "a_traiter",
              value: transformedData.a_traiter,
              label: "À traiter",
              labelMarkType: "square",
              color: "#31A7AE",
            },
          ],
        },
      ]}
      sx={{
        [`& .${pieArcLabelClasses.root}`]: {
          fill: "white",
        },
      }}
      width={200}
      height={200}
    />
  );
};

const TraitePieChart = ({ data }) => {
  const transformedData = data.reduce(
    (acc, { stats }) => {
      return {
        rdv_pris: (stats.rdv_pris || 0) + (acc.rdv_pris || 0),
        nouveau_projet: (stats.nouveau_projet || 0) + (acc.nouveau_projet || 0),
        deja_accompagne: (stats.deja_accompagne || 0) + (acc.deja_accompagne || 0),
        contacte_sans_retour: (stats.contacte_sans_retour || 0) + (acc.contacte_sans_retour || 0),
        coordonnees_incorrectes: (stats.coordonnees_incorrectes || 0) + (acc.coordonnees_incorrectes || 0),
        autre: (stats.autre || 0) + (acc.autre || 0),
        total: (stats.traite || 0) + (acc.total || 0),
      };
    },
    {
      rdv_pris: 0,
      nouveau_projet: 0,
      deja_accompagne: 0,
      contacte_sans_retour: 0,
      coordonnees_incorrectes: 0,
      autre: 0,
      total: 0,
    }
  );

  if (transformedData.total === 0) {
    return (
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Typography variant="body1">Aucune donnée disponible</Typography>
      </Box>
    );
  }

  return (
    <PieChart
      series={[
        {
          arcLabel: (item) => `${computePercentage(item.value, transformedData.total)}%`,
          arcLabelMinAngle: 35,
          arcLabelRadius: "60%",

          data: [
            {
              id: 0,
              value: transformedData.rdv_pris,
              label: "Rendez-vous pris",
              labelMarkType: "square",
              color: "#2846BC",
            },
            {
              id: 1,
              value: transformedData.nouveau_projet,
              label: "Nouveau projet",
              labelMarkType: "square",
              color: "#568AC3",
            },
            {
              id: 2,
              value: transformedData.deja_accompagne,
              label: "Déjà accompagné",
              labelMarkType: "square",
              color: "#00386A",
            },
            {
              id: 3,
              value: transformedData.contacte_sans_retour,
              label: "Contacté sans retour",
              labelMarkType: "square",
              color: "#31A7AE",
            },
            {
              id: 4,
              value: transformedData.coordonnees_incorrectes,
              label: "Coordonnées incorrectes",
              labelMarkType: "square",
              color: "#8B53C8",
            },
            { id: 5, value: transformedData.autre, label: "Autre", labelMarkType: "square", color: "#A78BCC" },
          ],
        },
      ]}
      sx={{
        [`& .${pieArcLabelClasses.root}`]: {
          fill: "white",
        },
      }}
      width={200}
      height={200}
    />
  );
};

const TableauARMLTotal = ({ data }) => {
  const transformedData = data.reduce(
    (acc, { stats }) => {
      return {
        traite: (stats.traite || 0) + (acc.traite || 0),
        a_traiter: (stats.a_traiter || 0) + (acc.a_traiter || 0),
        total: (stats.total || 0) + (acc.total || 0),
      };
    },
    {
      traite: 0,
      a_traiter: 0,
      total: 0,
    }
  );

  const columns = useMemo(
    () => [
      { label: "Total", dataKey: "total", width: 50, sortable: false },
      { label: "À traiter", dataKey: "a_traiter", width: 50, sortable: false },
      { label: "Traités", dataKey: "traite", width: 50, sortable: false },
    ],
    []
  );
  return (
    <>
      <LightTable
        data={[{ element: transformedData, rawData: transformedData }]}
        columns={columns}
        itemsPerPage={1}
        searchableColumns={["nom"]}
        emptyMessage="Aucune mission locale à afficher"
        withStripes={true}
        withHeader={true}
        defaultSort={{ order: "desc", orderBy: "total" }}
      />
    </>
  );
};

const TableauARMLTraite = ({ data }) => {
  const transformedData = data.reduce(
    (acc, { stats }) => {
      return {
        rdv_pris: (stats.rdv_pris || 0) + (acc.rdv_pris || 0),
        nouveau_projet: (stats.nouveau_projet || 0) + (acc.nouveau_projet || 0),
        deja_accompagne: (stats.deja_accompagne || 0) + (acc.deja_accompagne || 0),
        contacte_sans_retour: (stats.contacte_sans_retour || 0) + (acc.contacte_sans_retour || 0),
        coordonnees_incorrectes: (stats.coordonnees_incorrectes || 0) + (acc.coordonnees_incorrectes || 0),
        autre: (stats.autre || 0) + (acc.autre || 0),
        total: (stats.traite || 0) + (acc.total || 0),
      };
    },
    {
      rdv_pris: 0,
      nouveau_projet: 0,
      deja_accompagne: 0,
      contacte_sans_retour: 0,
      coordonnees_incorrectes: 0,
      autre: 0,
      total: 0,
    }
  );

  const columns = useMemo(
    () => [
      { label: "Total", dataKey: "total", width: 100, sortable: false },
      { label: "Rdv pris", dataKey: "rdv_pris", width: 100, sortable: false },
      { label: "Nouv. proj.", dataKey: "nouveau_projet", width: 100, sortable: false },
      { label: "Déjà acc.", dataKey: "deja_accompagne", width: 100, sortable: false },
      { label: "Sans rép.", dataKey: "contacte_sans_retour", width: 100, sortable: false },
      { label: "Coord. inc.", dataKey: "coordonnees_incorrectes", width: 100, sortable: false },
      { label: "Autre", dataKey: "autre", width: 100, sortable: false },
    ],
    []
  );
  return (
    <>
      <LightTable
        data={[{ element: transformedData, rawData: transformedData }]}
        columns={columns}
        itemsPerPage={1}
        searchableColumns={["nom"]}
        emptyMessage="Aucune mission locale à afficher"
        withStripes={true}
        withHeader={true}
        defaultSort={{ order: "desc", orderBy: "total" }}
      />
    </>
  );
};

export default function ARMLIndicateurGlobal({ armls }) {
  return (
    <>
      <Grid2 size={4}>
        <TotalPieChart data={armls} />
      </Grid2>
      <Grid2 size={8}>
        <TraitePieChart data={armls} />
      </Grid2>
      <Grid2 size={4}>
        <TableauARMLTotal data={armls} />
      </Grid2>
      <Grid2 size={8} alignContent={"flex-start"}>
        <TableauARMLTraite data={armls} />
      </Grid2>
    </>
  );
}
