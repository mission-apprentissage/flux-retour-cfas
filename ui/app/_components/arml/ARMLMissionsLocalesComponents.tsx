"use client";

import SearchBar from "@codegouvfr/react-dsfr/SearchBar";
import { SegmentedControl } from "@codegouvfr/react-dsfr/SegmentedControl";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import { BarChart } from "@mui/x-charts/BarChart";
import { SortingState, ColumnFiltersState } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { FullTable } from "@/app/_components/table/FullTable";

interface MissionLocaleStats {
  a_traiter: number;
  traite: number;
  total: number;
  rdv_pris: number;
  nouveau_projet: number;
  deja_accompagne: number;
  contacte_sans_retour: number;
  coordonnees_incorrectes: number;
  autre: number;
  deja_connu: number;
}

interface MissionLocale {
  _id: string;
  nom: string;
  activated_at?: string;
  stats: MissionLocaleStats;
}

interface TableBaseProps {
  data?: MissionLocale[];
  searchTerm: string;
  headerAction?: React.ReactNode;
  customNavigationPath?: (id: string) => string;
}

const colorMap = {
  rdv_pris: { color: "#2846BC", label: "Rdv pris" },
  nouveau_projet: { color: "#568AC3", label: "Nouveau projet" },
  deja_accompagne: { color: "#00386A", label: "Déjà acco." },
  contacte_sans_retour: { color: "#31A7AE", label: "Sans retour" },
  coordonnees_incorrectes: { color: "#8B53C8", label: "Coord inc." },
  autre: { color: "#A78BCC", label: "Autre" },
};

const computePercentage = (part: number, total: number): string | number => {
  if (total === 0 || part === 0) return "--";
  return Math.round((part / total) * 100);
};

const useTableLogic = (
  searchTerm: string,
  customNavigationPath?: (id: string) => string,
  defaultSorting?: SortingState
) => {
  const [sorting, setSorting] = useState<SortingState>(defaultSorting || []);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const router = useRouter();

  useMemo(() => {
    if (searchTerm) {
      setColumnFilters([{ id: "nom", value: searchTerm }]);
    } else {
      setColumnFilters([]);
    }
  }, [searchTerm]);

  const createNavigationIcon = (id: string) => (
    <i
      className="fr-icon-arrow-right-line fr-icon--sm"
      style={{ cursor: "pointer" }}
      onClick={() => customNavigationPath && router.push(customNavigationPath(id))}
    />
  );

  return {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    createNavigationIcon,
  };
};

export const LegendComponent = () => (
  <div style={{ display: "flex", justifyContent: "space-between", marginLeft: "0.5rem" }}>
    {Object.entries(colorMap).map(([key, { color, label }]) => (
      <div key={key} style={{ display: "flex", alignItems: "center", marginLeft: "0.25rem" }}>
        <div style={{ backgroundColor: color, width: 12, height: 12, marginRight: "0.25rem" }} />
        <span style={{ fontSize: "0.875rem" }}>{label}</span>
      </div>
    ))}
  </div>
);

export const GlobalSearchBar = ({
  searchTerm,
  setSearchTerm,
}: {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}) => (
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

const ActivationStatus = ({ activatedAt }: { activatedAt?: string }) => {
  if (!activatedAt) {
    return <span style={{ color: "var(--text-default-error)" }}>Non activée</span>;
  }
  return <>{new Date(activatedAt).toLocaleDateString("fr-FR")}</>;
};

export const TableauMissionLocale = ({ data, searchTerm, customNavigationPath }: TableBaseProps) => {
  const { sorting, setSorting, columnFilters, setColumnFilters, createNavigationIcon } = useTableLogic(
    searchTerm,
    customNavigationPath,
    [{ id: "total", desc: true }]
  );

  const transformedData = (data || []).map(({ _id, nom, activated_at, stats }) => {
    const rawData = {
      _id,
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
      activated_at,
    };

    const displayData = {
      ...rawData,
      total: <strong>{stats.total}</strong>,
      activated_at: <ActivationStatus activatedAt={activated_at} />,
      icon: createNavigationIcon(_id),
    };

    return { element: displayData, rawData };
  });

  const columns = useMemo(
    () => [
      { label: "Mission Locale", dataKey: "nom", width: 300 },
      { label: "Total", dataKey: "total", width: 100 },
      { label: "À traiter", dataKey: "a_traiter", width: 100 },
      { label: "Traités", dataKey: "traite", width: 100 },
      { label: "Traités %", dataKey: "traite_pourcentage", width: 100 },
      {
        label: (
          <>
            <span style={{ marginRight: "0.5rem" }}>Activation</span>
            <Tooltip
              kind="hover"
              title="Une Mission Locale est activée dès lors qu’il existe au moins un compte utilisateur pour cette Mission Locale sur le Tableau de Bord."
            />
          </>
        ),
        dataKey: "activated_at",
        width: 70,
      },
      ...(customNavigationPath ? [{ label: "", dataKey: "icon", width: 10, sortable: false }] : []),
    ],
    []
  );

  return (
    <FullTable
      caption="Détails des Missions Locales"
      data={transformedData}
      columns={columns}
      pageSize={50}
      emptyMessage="Aucune mission locale à afficher"
      sorting={sorting}
      onSortingChange={setSorting}
      columnFilters={columnFilters}
      onColumnFiltersChange={setColumnFilters}
      pagination={{ page: 1, lastPage: 1, total: transformedData.length, limit: 50 }}
    />
  );
};

const TableauRepartitionTraiteTable = ({ data, searchTerm, headerAction, customNavigationPath }: TableBaseProps) => {
  const { sorting, setSorting, columnFilters, setColumnFilters, createNavigationIcon } = useTableLogic(
    searchTerm,
    customNavigationPath
  );

  const transformedData = (data || []).map(({ _id, nom, stats }) => ({
    _id,
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
    icon: createNavigationIcon(_id),
  }));

  const columns = useMemo(
    () => [
      { label: "Mission Locale", dataKey: "nom", width: 200 },
      { label: "Traités", dataKey: "traite", width: 50 },
      { label: "Traités %", dataKey: "traite_pourcentage", width: 50 },
      { label: "Rdv pris", dataKey: "rdv_pris", width: 50 },
      { label: "Nouv. proj.", dataKey: "nouveau_projet", width: 50 },
      { label: "Déjà acc.", dataKey: "deja_accompagne", width: 50 },
      { label: "Sans retour", dataKey: "contacte_sans_retour", width: 50 },
      { label: "Coord. inc.", dataKey: "coordonnees_incorrectes", width: 50 },
      { label: "Autre", dataKey: "autre", width: 50 },
      { label: "Déjà connu", dataKey: "deja_connu", width: 50 },
      ...(customNavigationPath ? [{ label: "", dataKey: "icon", width: 10, sortable: false }] : []),
    ],
    []
  );

  return (
    <FullTable
      caption="Répartition des données traitées par Mission Locale"
      data={transformedData.map((element) => ({ element, rawData: element }))}
      columns={columns}
      pageSize={50}
      emptyMessage="Aucune mission locale à afficher"
      sorting={sorting}
      onSortingChange={setSorting}
      columnFilters={columnFilters}
      onColumnFiltersChange={setColumnFilters}
      pagination={{ page: 1, lastPage: 1, total: transformedData.length, limit: 50 }}
      headerAction={headerAction}
    />
  );
};

const TableauRepartitionTraitePercent = ({ data, searchTerm, headerAction, customNavigationPath }: TableBaseProps) => {
  const { sorting, setSorting, columnFilters, setColumnFilters, createNavigationIcon } = useTableLogic(
    searchTerm,
    customNavigationPath
  );

  const transformedData = (data || []).map(({ _id, nom, stats }) => ({
    _id,
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
    icon: createNavigationIcon(_id),
  }));

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
      ...(customNavigationPath ? [{ label: "", dataKey: "icon", width: 10, sortable: false }] : []),
    ],
    []
  );

  return (
    <FullTable
      caption="Répartition des données traitées par Mission Locale"
      data={transformedData.map((element) => ({ element, rawData: element }))}
      columns={columns}
      pageSize={20}
      emptyMessage="Aucune mission locale à afficher"
      sorting={sorting}
      onSortingChange={setSorting}
      columnFilters={columnFilters}
      onColumnFiltersChange={setColumnFilters}
      pagination={{ page: 1, lastPage: 1, total: transformedData.length, limit: 20 }}
      headerAction={headerAction}
    />
  );
};

const StatsBarChart = ({ stats, nom }: { stats: MissionLocaleStats; nom: string }) => {
  if (!stats.traite) {
    return <span style={{ fontStyle: "italic" }}>Aucune donnée traitée</span>;
  }

  return (
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
      xAxis={[{ position: "none" }]}
      yAxis={[{ position: "none", data: [nom] }]}
      margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
    />
  );
};

const TableauRepartitionTraiteGraph = ({ data, searchTerm, headerAction, customNavigationPath }: TableBaseProps) => {
  const { sorting, setSorting, columnFilters, setColumnFilters, createNavigationIcon } = useTableLogic(
    searchTerm,
    customNavigationPath
  );

  const transformedData = (data || []).map(({ _id, nom, stats }) => ({
    _id,
    nom,
    traite: stats.traite,
    traite_pourcentage: computePercentage(stats.traite, stats.total),
    icon: createNavigationIcon(_id),
    graph: <StatsBarChart stats={stats} nom={nom} />,
  }));

  const columns = useMemo(
    () => [
      { label: "Mission Locale", dataKey: "nom", width: 300 },
      {
        label: "Répartition",
        dataKey: "graph",
        width: 900,
        extraHeader: <LegendComponent />,
        sortable: false,
      },
      { label: "Traités", dataKey: "traite", width: 100 },
      { label: "Traités %", dataKey: "traite_pourcentage", width: 150 },
      ...(customNavigationPath ? [{ label: "", dataKey: "icon", width: 10, sortable: false }] : []),
    ],
    []
  );

  return (
    <FullTable
      caption={"Répartition des données traitées par Mission Locale"}
      data={transformedData.map((element) => ({ element, rawData: element }))}
      columns={columns}
      pageSize={20}
      emptyMessage="Aucune mission locale à afficher"
      sorting={sorting}
      onSortingChange={setSorting}
      columnFilters={columnFilters}
      onColumnFiltersChange={setColumnFilters}
      pagination={{ page: 1, lastPage: 1, total: transformedData.length, limit: 20 }}
      headerAction={headerAction}
    />
  );
};

export const ViewSelector = ({
  typeVue,
  setTypeVue,
}: {
  typeVue: string | null;
  setTypeVue: (type: string) => void;
}) => (
  <SegmentedControl
    segments={[
      {
        label: <i className="fr-icon-line-chart-line" />,
        nativeInputProps: {
          checked: typeVue === "graph",
          onChange: () => setTypeVue("graph"),
        },
      },
      {
        label: <i className="fr-icon-table-line" />,
        nativeInputProps: {
          checked: typeVue === "table",
          onChange: () => setTypeVue("table"),
        },
      },
      {
        label: "%",
        nativeInputProps: {
          checked: typeVue === "percent",
          onChange: () => setTypeVue("percent"),
        },
      },
    ]}
    name="typeVue"
    small
    hideLegend
  />
);

export const RepartitionDataViews = ({
  typeVue,
  data,
  searchTerm,
  onTypeVueChange,
  customNavigationPath,
}: {
  typeVue: string | null;
  data?: MissionLocale[];
  searchTerm: string;
  onTypeVueChange: (type: string) => void;
  customNavigationPath?: (id: string) => string;
}) => {
  const viewSelector = <ViewSelector typeVue={typeVue} setTypeVue={onTypeVueChange} />;

  switch (typeVue) {
    case "graph":
      return (
        <TableauRepartitionTraiteGraph
          data={data}
          searchTerm={searchTerm}
          headerAction={viewSelector}
          customNavigationPath={customNavigationPath}
        />
      );
    case "table":
      return (
        <TableauRepartitionTraiteTable
          data={data}
          searchTerm={searchTerm}
          headerAction={viewSelector}
          customNavigationPath={customNavigationPath}
        />
      );
    case "percent":
      return (
        <TableauRepartitionTraitePercent
          data={data}
          searchTerm={searchTerm}
          headerAction={viewSelector}
          customNavigationPath={customNavigationPath}
        />
      );
    default:
      return null;
  }
};

export type { MissionLocale, MissionLocaleStats };
