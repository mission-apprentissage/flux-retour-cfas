"use client";

import SearchBar from "@codegouvfr/react-dsfr/SearchBar";
import PercentIcon from "@mui/icons-material/Percent";
import TimelineIcon from "@mui/icons-material/Timeline";
import TocIcon from "@mui/icons-material/Toc";
import { Box, Grid2, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { IOrganisationARML } from "shared";

import { PageWithSidebarSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import { LightTable } from "@/app/_components/table/LightTable";
import { _get } from "@/common/httpClient";

const computePercentage = (part: number, total: number) => {
  if (total === 0 || part === 0) return "--";

  return ((part / total) * 100).toFixed(1);
};

const TableauMissionLocale = ({ data }) => {
  const transformedData = data.map(({ code_postal, nom, activated_at, stats }) => {
    return {
      code_postal,
      nom,
      a_traiter: stats.a_traiter,
      traite: stats.traite,
      a_traiter_pourcentage: computePercentage(stats.a_traiter, stats.total),
      traite_pourcentage: computePercentage(stats.traite, stats.total),
      rdv_pris: stats.rdv_pris,
      nouveau_projet: stats.nouveau_projet,
      deja_accompagne: stats.deja_accompagne,
      contacte_sans_retour: stats.contacte_sans_retour,
      coordonnees_incorrectes: stats.coordonnees_incorrectes,
      autre: stats.autre,
      total: stats.total,
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
      { label: "À traiter %", dataKey: "a_traiter_pourcentage", width: 100 },
      { label: "Traités", dataKey: "traite", width: 100 },
      { label: "Traités %", dataKey: "traite_pourcentage", width: 100 },
      { label: "Activation", dataKey: "activated_at", width: 70 },
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
        itemsPerPage={50}
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
const TableauRepartitionTraiteTable = ({ data }) => {
  const transformedData = data.map(({ code_postal, nom, stats }) => {
    return {
      code_postal,
      nom,
      traite: stats.traite,
      traite_pourcentage: stats.total ? ((stats.traite / stats.total) * 100).toFixed(1) : null,
      rdv_pris: stats.rdv_pris,
      nouveau_projet: stats.nouveau_projet,
      deja_accompagne: stats.deja_accompagne,
      contacte_sans_retour: stats.contacte_sans_retour,
      coordonnees_incorrectes: stats.coordonnees_incorrectes,
      autre: stats.autre,
      deja_connu: stats.deja_connu,
    };
  });

  const columns = useMemo(
    () => [
      { label: "Mission Locale", dataKey: "nom", width: 200 },
      { label: "Traités", dataKey: "traite", width: 50 },
      { label: "Traités %", dataKey: "traite_pourcentage", width: 50 },
      { label: "Rdv pris", dataKey: "rdv_pris", width: 50 },
      { label: "Nouv. proj.", dataKey: "nouveau_projet", width: 50 },
      { label: "Déjà acc.", dataKey: "deja_accompagne", width: 50 },
      { label: "Cont. sans ret.", dataKey: "contacte_sans_retour", width: 50 },
      { label: "Coord. inc.", dataKey: "coordonnees_incorrectes", width: 50 },
      { label: "Autre", dataKey: "autre", width: 50 },
      { label: "Déjà connu", dataKey: "deja_connu", width: 50 },
    ],
    []
  );

  return (
    <LightTable
      data={transformedData.map((element) => ({ element, rawData: element }))}
      columns={columns}
      itemsPerPage={50}
      emptyMessage="Aucune mission locale à afficher"
      withHeader={true}
      withStripes={true}
    />
  );
};

const TableauRepartitionTraitePercent = ({ data }) => {
  const transformedData = data.map(({ code_postal, nom, stats }) => {
    return {
      code_postal,
      nom,
      traite: stats.traite,
      traite_pourcentage: computePercentage(stats.traite, stats.total),
      rdv_pris_pourcentage: computePercentage(stats.rdv_pris, stats.traite),
      nouveau_projet_pourcentage: computePercentage(stats.nouveau_projet, stats.traite),
      deja_accompagne_pourcentage: computePercentage(stats.deja_accompagne, stats.traite),
      contacte_sans_retour_pourcentage: computePercentage(stats.contacte_sans_retour, stats.traite),
      coordonnees_incorrectes_pourcentage: computePercentage(stats.coordonnees_incorrectes, stats.traite),
      autre_pourcentage: computePercentage(stats.autre, stats.traite),
      deja_connu: computePercentage(stats.deja_connu, stats.traite),
    };
  });

  const columns = useMemo(
    () => [
      { label: "Mission Locale", dataKey: "nom", width: 200 },
      { label: "Traités", dataKey: "traite", width: 50 },
      { label: "Traités %", dataKey: "traite_pourcentage", width: 50 },
      { label: "Rdv pris", dataKey: "rdv_pris_pourcentage", width: 50 },
      { label: "Nouv. proj.", dataKey: "nouveau_projet_pourcentage", width: 50 },
      { label: "Déjà acc.", dataKey: "deja_accompagne_pourcentage", width: 50 },
      { label: "Cont. sans ret.", dataKey: "contacte_sans_retour_pourcentage", width: 50 },
      { label: "Coord. inc.", dataKey: "coordonnees_incorrectes_pourcentage", width: 50 },
      { label: "Autre", dataKey: "autre_pourcentage", width: 50 },
      { label: "Déjà connu", dataKey: "deja_connu", width: 50 },
    ],
    []
  );

  return (
    <LightTable
      data={transformedData.map((element) => ({ element, rawData: element }))}
      columns={columns}
      itemsPerPage={50}
      emptyMessage="Aucune mission locale à afficher"
      withHeader={true}
      withStripes={true}
    />
  );
};

const TableauRepartitionTraiteGraph = ({ data }) => {
  const colorMap = {
    rdv_pris: { color: "#4e79a7", label: "Rdv pris" },
    nouveau_projet: { color: "#f28e2c", label: "Nouveau projet" },
    deja_accompagne: { color: "#e15759", label: "Déjà acco." },
    contacte_sans_retour: { color: "#76b7b2", label: "Sans rép." },
    coordonnees_incorrectes: { color: "#59a14f", label: "Coord inc" },
    autre: { color: "#edc949", label: "Autre" },
  };
  const transformedData = data.map(({ code_postal, nom, stats }) => {
    return {
      code_postal,
      nom,
      traite: stats.traite,
      traite_pourcentage: computePercentage(stats.traite, stats.total),
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
              label: "Sans réponse",
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
      { label: "Répartition", dataKey: "graph", width: 900, extraHeader: <LegendComponent></LegendComponent> },
      { label: "Traités", dataKey: "traite", width: 100 },
      { label: "Traités %", dataKey: "traite_pourcentage", width: 150 },
    ],
    []
  );

  return (
    <LightTable
      data={transformedData.map((element) => ({ element, rawData: element }))}
      columns={columns}
      itemsPerPage={50}
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

  const [typeVue, setTypeVue] = useState<string | null>("graph");
  const handleAlignment = (_event: React.MouseEvent<HTMLElement>, newVue: string | null) => {
    if (newVue === null) {
      return;
    }
    setTypeVue(newVue);
  };
  return (
    <div className="fr-container">
      <SuspenseWrapper fallback={<PageWithSidebarSkeleton />}>
        {isLoading && !armls ? (
          <p>Chargement…</p>
        ) : (
          <>
            <TableauMissionLocale data={armls} />
            <Grid2 container spacing={2} mt={6}>
              <Grid2 container size={12}>
                <Grid2 size={10}>
                  <Typography
                    variant="h4"
                    sx={{
                      mt: 3,
                      mb: 2,
                      color: "var(--text-title-blue-france)",
                      textAlign: "left",
                    }}
                  >
                    Répartition des données traitées par Mission Locale
                  </Typography>
                </Grid2>
                <Grid2 size={2} sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                  <ToggleButtonGroup value={typeVue} exclusive onChange={handleAlignment} aria-label="text alignment">
                    <ToggleButton value="graph" aria-label="left aligned">
                      <TimelineIcon />
                    </ToggleButton>
                    <ToggleButton value="table" aria-label="centered">
                      <TocIcon />
                    </ToggleButton>
                    <ToggleButton value="percent" aria-label="centered">
                      <PercentIcon />
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Grid2>
              </Grid2>
              <Grid2 size={12}>
                {typeVue === "graph" && <TableauRepartitionTraiteGraph data={armls} />}
                {typeVue === "table" && <TableauRepartitionTraiteTable data={armls} />}
                {typeVue === "percent" && <TableauRepartitionTraitePercent data={armls} />}
              </Grid2>
            </Grid2>
          </>
        )}
      </SuspenseWrapper>
    </div>
  );
}
