"use client";

import SearchBar from "@codegouvfr/react-dsfr/SearchBar";
import PercentIcon from "@mui/icons-material/Percent";
import TimelineIcon from "@mui/icons-material/Timeline";
import TocIcon from "@mui/icons-material/Toc";
import { Box, Grid2, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { pieArcLabelClasses, PieChart } from "@mui/x-charts/PieChart";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { IOrganisationARML } from "shared";

import { PageWithSidebarSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import { LightTable } from "@/app/_components/table/LightTable";
import { _get } from "@/common/httpClient";

const colorMap = {
  rdv_pris: { color: "#2846BC", label: "Rdv pris" },
  nouveau_projet: { color: "#568AC3", label: "Nouveau projet" },
  deja_accompagne: { color: "#00386A", label: "Déjà acco." },
  contacte_sans_retour: { color: "#31A7AE", label: "Sans rép." },
  coordonnees_incorrectes: { color: "#8B53C8", label: "Coord inc." },
  autre: { color: "#A78BCC", label: "Autre" },
};

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

const TableauARML = ({ data }) => {
  const transformedData = data.reduce(
    (acc, { stats }) => {
      return {
        traite: (stats.traite || 0) + (acc.traite || 0),
        a_traiter: (stats.a_traiter || 0) + (acc.a_traiter || 0),
        rdv_pris: (stats.rdv_pris || 0) + (acc.rdv_pris || 0),
        nouveau_projet: (stats.nouveau_projet || 0) + (acc.nouveau_projet || 0),
        deja_accompagne: (stats.deja_accompagne || 0) + (acc.deja_accompagne || 0),
        contacte_sans_retour: (stats.contacte_sans_retour || 0) + (acc.contacte_sans_retour || 0),
        coordonnees_incorrectes: (stats.coordonnees_incorrectes || 0) + (acc.coordonnees_incorrectes || 0),
        autre: (stats.autre || 0) + (acc.autre || 0),
        total: (stats.total || 0) + (acc.total || 0),
      };
    },
    {
      traite: 0,
      a_traiter: 0,
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
      { label: "À traiter", dataKey: "a_traiter", width: 100, sortable: false },
      { label: "Traités", dataKey: "traite", width: 100, sortable: false },
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

const GlobalSearchBar = ({ searchTerm, setSearchTerm }) => {
  return (
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
  );
};
const TableauMissionLocale = ({ data, searchTerm }) => {
  const transformedData = data.map(({ code_postal, nom, activated_at, stats }) => {
    return {
      code_postal,
      nom,
      a_traiter: stats.a_traiter,
      traite: stats.traite,
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

  const columns = useMemo(
    () => [
      { label: "Mission Locale", dataKey: "nom", width: 300 },
      { label: "Total", dataKey: "total", width: 100 },
      { label: "À traiter", dataKey: "a_traiter", width: 100 },
      { label: "Traités", dataKey: "traite", width: 100 },
      { label: "Traités %", dataKey: "traite_pourcentage", width: 100 },
      { label: "Activation", dataKey: "activated_at", width: 70 },
    ],
    []
  );
  return (
    <>
      <Typography
        variant="h5"
        sx={{
          mt: 3,
          mb: 2,
          color: "var(--text-title-blue-france)",
          textAlign: "left",
        }}
      >
        Détails des Missions Locales
      </Typography>
      <LightTable
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
const TableauRepartitionTraiteTable = ({ data, searchTerm }) => {
  const transformedData = data.map(({ code_postal, nom, stats }) => {
    return {
      code_postal,
      nom,
      traite: stats.traite,
      traite_pourcentage: computePercentage(stats.traite, stats.total),
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
      { label: "Sans rép.", dataKey: "contacte_sans_retour", width: 50 },
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
      searchTerm={searchTerm}
      searchableColumns={["nom"]}
      itemsPerPage={50}
      emptyMessage="Aucune mission locale à afficher"
      withHeader={true}
      withStripes={true}
    />
  );
};

const TableauRepartitionTraitePercent = ({ data, searchTerm }) => {
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
      { label: "Rdv pris %", dataKey: "rdv_pris_pourcentage", width: 50 },
      { label: "Nouv. proj. %", dataKey: "nouveau_projet_pourcentage", width: 50 },
      { label: "Déjà acc. %", dataKey: "deja_accompagne_pourcentage", width: 50 },
      { label: "Cont. sans ret. %", dataKey: "contacte_sans_retour_pourcentage", width: 50 },
      { label: "Coord. inc. %", dataKey: "coordonnees_incorrectes_pourcentage", width: 50 },
      { label: "Autre %", dataKey: "autre_pourcentage", width: 50 },
      { label: "Déjà connu %", dataKey: "deja_connu", width: 50 },
    ],
    []
  );

  return (
    <LightTable
      data={transformedData.map((element) => ({ element, rawData: element }))}
      columns={columns}
      searchTerm={searchTerm}
      searchableColumns={["nom"]}
      itemsPerPage={20}
      emptyMessage="Aucune mission locale à afficher"
      withHeader={true}
      withStripes={true}
    />
  );
};

const TableauRepartitionTraiteGraph = ({ data, searchTerm }) => {
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

  const columns = useMemo(
    () => [
      { label: "Mission Locale", dataKey: "nom", width: 300 },
      {
        label: "Répartition",
        dataKey: "graph",
        width: 900,
        extraHeader: <LegendComponent></LegendComponent>,
        sortable: false,
      },
      { label: "Traités", dataKey: "traite", width: 100 },
      {
        label: "Traités %",
        dataKey: "traite_pourcentage",
        width: 150,
      },
    ],
    []
  );

  return (
    <LightTable
      data={transformedData.map((element) => ({ element, rawData: element }))}
      columns={columns}
      searchTerm={searchTerm}
      searchableColumns={["nom"]}
      itemsPerPage={20}
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
  const [searchTerm, setSearchTerm] = useState("");

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
            <Grid2 container spacing={2} mt={6} mb={12}>
              <Grid2 size={12}>
                <Typography
                  variant="h3"
                  sx={{
                    mt: 3,
                    mb: 2,
                    color: "var(--text-title-blue-france)",
                    textAlign: "left",
                  }}
                >
                  Indicateurs Régionaux
                </Typography>
              </Grid2>
              <Grid2 size={6}>
                <TotalPieChart data={armls} />
              </Grid2>
              <Grid2 size={6}>
                <TraitePieChart data={armls} />
              </Grid2>
              <Grid2 size={12} mt={3}>
                <TableauARML data={armls} />
              </Grid2>
            </Grid2>
            <Typography
              variant="h3"
              sx={{
                mt: 3,
                mb: 6,
                color: "var(--text-title-blue-france)",
                textAlign: "left",
              }}
            >
              Indicateurs par Missions Locales
            </Typography>
            <GlobalSearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            <TableauMissionLocale data={armls} searchTerm={searchTerm} />
            <Grid2 container spacing={2} mt={6}>
              <Grid2 container size={12}>
                <Grid2 size={10}>
                  <Typography
                    variant="h5"
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
                {typeVue === "graph" && <TableauRepartitionTraiteGraph data={armls} searchTerm={searchTerm} />}
                {typeVue === "table" && <TableauRepartitionTraiteTable data={armls} searchTerm={searchTerm} />}
                {typeVue === "percent" && <TableauRepartitionTraitePercent data={armls} searchTerm={searchTerm} />}
              </Grid2>
            </Grid2>
          </>
        )}
      </SuspenseWrapper>
    </div>
  );
}
