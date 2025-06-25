"use client";

import SearchBar from "@codegouvfr/react-dsfr/SearchBar";
import { Box, Grid2, Typography } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { IOrganisationARML } from "shared";

import { PageWithSidebarSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import { LightTable } from "@/app/_components/table/LightTable";
import { _get } from "@/common/httpClient";

const computeDataWithPercentage = (part: number, total: number) => {
  if (total === 0 || part === 0) return part;

  const per = ((part / total) * 100).toFixed(2);
  return (
    <Box component="span">
      {part}{" "}
      <Typography display="inline" sx={{ fontSize: "11px", color: "var(--text-muted)" }}>
        ({per} %){" "}
      </Typography>
    </Box>
  );
};

const TableauMissionLocale = ({ data }) => {
  const transformedData = data.map(({ code_postal, nom, activated_at, stats }) => {
    return {
      code_postal,
      nom,
      a_traiter: computeDataWithPercentage(stats.a_traiter, stats.total),
      traite: computeDataWithPercentage(stats.traite, stats.total),
      a_traiter_pourcentage: stats.total ? (stats.a_traiter / stats.total) * 100 : null,
      traite_pourcentage: stats.total ? (stats.traite / stats.total) * 100 : null,
      rdv_pris: stats.rdv_pris,
      nouveau_projet: stats.nouveau_projet,
      deja_accompagne: stats.deja_accompagne,
      contacte_sans_retour: stats.contacte_sans_retour,
      coordonnees_incorrectes: stats.coordonnees_incorrectes,
      autre: stats.autre,
      total: stats.total,
      abandon: computeDataWithPercentage(stats.abandon, stats.total),
      mineur: computeDataWithPercentage(stats.mineur, stats.total),
      activated_at: activated_at ? (
        new Date(activated_at).toLocaleDateString("fr-FR")
      ) : (
        <Typography color="error">Non activée</Typography>
      ),
    };
  });

  const [searchTerm, setSearchTerm] = useState("");
  const columns = useMemo(
    () => [
      { label: "Mission Locale", dataKey: "nom", width: 300 },
      { label: "Total", dataKey: "total", width: 100 },
      { label: "À traiter", dataKey: "a_traiter", width: 100 },
      { label: "Traités", dataKey: "traite", width: 100 },
      { label: "Mineur", dataKey: "mineur", width: 100 },
      { label: "+6 mois", dataKey: "abandon", width: 100 },
      { label: "Activation", dataKey: "activated_at", width: 100 },
    ],
    []
  );
  return (
    <>
      <SearchBar
        label="Recherche de mission locale"
        renderInput={({ id, className, placeholder }) => (
          <input
            id={id}
            className={className}
            placeholder={placeholder}
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        )}
      />
      <LightTable
        caption={`Tableau des Mission Locales (${transformedData.length})`}
        data={transformedData.map((element) => ({ element, rawData: element }))}
        columns={columns}
        itemsPerPage={10}
        searchTerm={searchTerm}
        searchableColumns={["nom"]}
        emptyMessage="Aucune mission locale à afficher"
        withHeader={true}
        withStripes={true}
        defaultSort={{ order: "desc", orderBy: "total" }}
      />
    </>
  );
};

const TableauRepartitionTraite = ({ data }) => {
  const colorMap = {
    rdv_pris: { color: "#4e79a7", label: "Rdv pris" },
    nouveau_projet: { color: "#f28e2c", label: "Nouveau projet" },
    deja_accompagne: { color: "#e15759", label: "Déjà acco." },
    contacte_sans_retour: { color: "#76b7b2", label: "Injoign." },
    coordonnees_incorrectes: { color: "#59a14f", label: "Coord inc" },
    autre: { color: "#edc949", label: "Autre" },
  };
  const transformedData = data.map(({ code_postal, nom, stats }) => {
    return {
      code_postal,
      nom,
      graph: stats.traite ? (
        <BarChart
          height={50}
          layout="horizontal"
          series={[
            {
              id: "rdv_pris",
              data: [stats.rdv_pris],
              label: "Rdv pris",
              stack: "stack1",
              color: colorMap.rdv_pris.color,
            },
            {
              id: "nouveau_projet",
              data: [stats.nouveau_projet],
              label: "Nouveau projet",
              stack: "stack1",
              color: colorMap.nouveau_projet.color,
            },
            {
              id: "deja_accompagne",
              data: [stats.deja_accompagne],
              label: "Déjà accompagné",
              stack: "stack1",
              color: colorMap.deja_accompagne.color,
            },
            {
              id: "contacte_sans_retour",
              data: [stats.contacte_sans_retour],
              label: "Contacté sans retour",
              stack: "stack1",
              color: colorMap.contacte_sans_retour.color,
            },
            {
              id: "coordonnees_incorrectes",
              data: [stats.coordonnees_incorrectes],
              label: "Coordonnées incorrectes",
              stack: "stack1",
              color: colorMap.coordonnees_incorrectes.color,
            },
            {
              id: "autre",
              data: [stats.autre],
              label: "Autre",
              stack: "stack1",
              color: colorMap.autre.color,
            },
          ]}
          hideLegend={true}
          xAxis={[
            {
              position: "none",
            },
          ]}
          yAxis={[
            {
              position: "none",
              data: [nom],
            },
          ]}
          margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
        />
      ) : (
        <Typography fontStyle="italic">Aucune donnée traitée</Typography>
      ),
      deja_connu: computeDataWithPercentage(stats.deja_connu, stats.traite),
    };
  });

  const LegendComponent = () => {
    return (
      <Box sx={{ display: "flex", justifyContent: "space-between", ml: 2 }}>
        {Object.entries(colorMap).map(([key, { color, label }]) => (
          <Box key={key} sx={{ display: "flex", alignItems: "center", ml: 1 }}>
            <Box sx={{ bgcolor: color, width: 12, height: 12, mr: 1 }} />
            <Typography variant="body2">{label}</Typography>
          </Box>
        ))}
      </Box>
    );
  };

  const columns = useMemo(
    () => [
      { label: "Mission Locale", dataKey: "nom", width: 300 },
      { label: "Répartition", dataKey: "graph", width: 1000, extraHeader: <LegendComponent></LegendComponent> },
      { label: "Déjà connu", dataKey: "deja_connu", width: 100 },
    ],
    []
  );

  return (
    <LightTable
      caption={`Répartition des missions locales traitées (${data.length})`}
      data={transformedData.map((element) => ({ element, rawData: element }))}
      columns={columns}
      itemsPerPage={10}
      emptyMessage="Aucune mission locale à afficher"
      withHeader={true}
      withStripes={true}
    />
  );
};

export default function Page() {
  const { data: armls = [], isLoading } = useQuery<Array<IOrganisationARML>>(["arml"], async () => {
    const data = await _get("/api/v1/organisation/arml/mls");
    return data;
  });

  return (
    <div className="fr-container">
      <SuspenseWrapper fallback={<PageWithSidebarSkeleton />}>
        {isLoading && !armls ? (
          <p>Chargement…</p>
        ) : (
          <>
            <TableauMissionLocale data={armls} />
            <Grid2 container spacing={2} mt={6}>
              <Grid2 size={12}>
                <TableauRepartitionTraite data={armls} />
              </Grid2>
            </Grid2>
          </>
        )}
      </SuspenseWrapper>
    </div>
  );
}
