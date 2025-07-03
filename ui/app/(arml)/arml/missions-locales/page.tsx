"use client";

import SearchBar from "@codegouvfr/react-dsfr/SearchBar";
import { SegmentedControl } from "@codegouvfr/react-dsfr/SegmentedControl";
import { BarChart } from "@mui/x-charts/BarChart";
import { useQuery } from "@tanstack/react-query";
import { SortingState, ColumnFiltersState } from "@tanstack/react-table";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import CustomBreadcrumb from "@/app/_components/Breadcrumb";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import { FullTable } from "@/app/_components/table/FullTable";
import { _get } from "@/common/httpClient";

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
}

const colorMap = {
  rdv_pris: { color: "#2846BC", label: "Rdv pris" },
  nouveau_projet: { color: "#568AC3", label: "Nouveau projet" },
  deja_accompagne: { color: "#00386A", label: "Déjà acco." },
  contacte_sans_retour: { color: "#31A7AE", label: "Sans rép." },
  coordonnees_incorrectes: { color: "#8B53C8", label: "Coord inc." },
  autre: { color: "#A78BCC", label: "Autre" },
};

const computePercentage = (part: number, total: number): string | number => {
  if (total === 0 || part === 0) return "--";
  return Math.round((part / total) * 100);
};

const useTableLogic = (searchTerm: string, defaultSorting?: SortingState) => {
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
      onClick={() => router.push(`/arml/missions-locales/${id}`)}
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

const LegendComponent = () => (
  <div style={{ display: "flex", justifyContent: "space-between", marginLeft: "0.5rem" }}>
    {Object.entries(colorMap).map(([key, { color, label }]) => (
      <div key={key} style={{ display: "flex", alignItems: "center", marginLeft: "0.25rem" }}>
        <div style={{ backgroundColor: color, width: 12, height: 12, marginRight: "0.25rem" }} />
        <span style={{ fontSize: "0.875rem" }}>{label}</span>
      </div>
    ))}
  </div>
);

const GlobalSearchBar = ({
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
const TableauMissionLocale = ({ data, searchTerm }: TableBaseProps) => {
  const { sorting, setSorting, columnFilters, setColumnFilters, createNavigationIcon } = useTableLogic(searchTerm, [
    { id: "total", desc: true },
  ]);

  const transformedData = (data || []).map(({ _id, nom, activated_at, stats }) => ({
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
    activated_at: <ActivationStatus activatedAt={activated_at} />,
    icon: createNavigationIcon(_id),
  }));

  const columns = useMemo(
    () => [
      { label: "Mission Locale", dataKey: "nom", width: 300 },
      { label: "Total", dataKey: "total", width: 100 },
      { label: "À traiter", dataKey: "a_traiter", width: 100 },
      { label: "Traités", dataKey: "traite", width: 100 },
      { label: "Traités %", dataKey: "traite_pourcentage", width: 100 },
      { label: "Activation", dataKey: "activated_at", width: 70 },
      { label: "", dataKey: "icon", width: 10, sortable: false },
    ],
    []
  );

  return (
    <FullTable
      caption="Détails des Missions Locales"
      data={transformedData.map((element) => ({ element, rawData: element }))}
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
const TableauRepartitionTraiteTable = ({ data, searchTerm, headerAction }: TableBaseProps) => {
  const { sorting, setSorting, columnFilters, setColumnFilters, createNavigationIcon } = useTableLogic(searchTerm);

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
      { label: "Sans rép.", dataKey: "contacte_sans_retour", width: 50 },
      { label: "Coord. inc.", dataKey: "coordonnees_incorrectes", width: 50 },
      { label: "Autre", dataKey: "autre", width: 50 },
      { label: "Déjà connu", dataKey: "deja_connu", width: 50 },
      { label: "", dataKey: "icon", width: 10, sortable: false },
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

const TableauRepartitionTraitePercent = ({ data, searchTerm, headerAction }: TableBaseProps) => {
  const { sorting, setSorting, columnFilters, setColumnFilters, createNavigationIcon } = useTableLogic(searchTerm);

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
      { label: "", dataKey: "icon", width: 10, sortable: false },
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

const TableauRepartitionTraiteGraph = ({ data, searchTerm, headerAction }: TableBaseProps) => {
  const { sorting, setSorting, columnFilters, setColumnFilters, createNavigationIcon } = useTableLogic(searchTerm);

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
      { label: "", dataKey: "icon", width: 10, sortable: false },
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

const ViewSelector = ({ typeVue, setTypeVue }: { typeVue: string | null; setTypeVue: (type: string) => void }) => (
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

const RepartitionDataViews = ({
  typeVue,
  data,
  searchTerm,
  onTypeVueChange,
}: {
  typeVue: string | null;
  data?: MissionLocale[];
  searchTerm: string;
  onTypeVueChange: (type: string) => void;
}) => {
  const viewSelector = <ViewSelector typeVue={typeVue} setTypeVue={onTypeVueChange} />;

  switch (typeVue) {
    case "graph":
      return <TableauRepartitionTraiteGraph data={data} searchTerm={searchTerm} headerAction={viewSelector} />;
    case "table":
      return <TableauRepartitionTraiteTable data={data} searchTerm={searchTerm} headerAction={viewSelector} />;
    case "percent":
      return <TableauRepartitionTraitePercent data={data} searchTerm={searchTerm} headerAction={viewSelector} />;
    default:
      return null;
  }
};

function ARMLMissionsLocalesContent() {
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeVue, setTypeVue] = useState<string | null>("graph");

  const { data: armlData } = useQuery<{ mlList: MissionLocale[] }>(
    ["arml"],
    async () => {
      const data = await _get("/api/v1/organisation/arml/mls");
      return data;
    },
    {
      suspense: true,
    }
  );

  return (
    <>
      <CustomBreadcrumb path={pathname} />
      <h2
        className="fr-h2"
        style={{ marginTop: "0.5rem", marginBottom: "2rem", color: "var(--text-title-blue-france)" }}
      >
        Répartitions des données
      </h2>
      <div style={{ marginBottom: "2rem" }}>
        <GlobalSearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      </div>
      <TableauMissionLocale data={armlData!.mlList} searchTerm={searchTerm} />
      <RepartitionDataViews
        typeVue={typeVue}
        data={armlData!.mlList}
        searchTerm={searchTerm}
        onTypeVueChange={setTypeVue}
      />
    </>
  );
}

export default function ARMLMissionsLocalesPage() {
  return (
    <SuspenseWrapper fallback={<TableSkeleton />}>
      <ARMLMissionsLocalesContent />
    </SuspenseWrapper>
  );
}
