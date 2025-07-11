"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import SearchBar from "@codegouvfr/react-dsfr/SearchBar";
import { SegmentedControl } from "@codegouvfr/react-dsfr/SegmentedControl";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import { BarChart } from "@mui/x-charts/BarChart";
import mime from "mime";
import { useMemo, useState } from "react";

import { FullTable } from "@/app/_components/table/FullTable";
import { useVirtualizedPagination } from "@/app/_hooks/useVirtualizedPagination";
import { _getBlob } from "@/common/httpClient";
import { downloadObject } from "@/common/utils/browser";

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
  arml?: string;
  stats: MissionLocaleStats;
}

interface TableBaseProps {
  data?: MissionLocale[];
  searchTerm: string;
  headerAction?: React.ReactNode;
  customNavigationPath?: (id: string) => string;
  showArml?: boolean;
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
  if (total === 0 || part === 0) return 0;
  return Math.round((part / total) * 100);
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

export const ExportButton = ({ onError, onSuccess }: { onError?: (error: string) => void; onSuccess?: () => void }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { data } = await _getBlob("/api/v1/organisation/arml/export/mls");
      const fileName = `ARML_${new Date().toISOString().split("T")[0]}.xlsx`;
      downloadObject(
        data,
        fileName,
        mime.getType("xlsx") ?? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      onSuccess?.();
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      onError?.("Une erreur est survenue lors de l'export des données. Veuillez réessayer.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      iconId={isExporting ? "ri-loader-line" : "ri-file-excel-2-line"}
      priority="secondary"
      size="small"
    >
      {isExporting ? "Export en cours..." : "Exporter en Excel"}
    </Button>
  );
};

export const GlobalSearchBar = ({
  searchTerm,
  setSearchTerm,
}: {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}) => (
  <SearchBar
    label="Rechercher une Mission Locale par son nom"
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

export const TableauMissionLocale = ({ data, searchTerm, customNavigationPath, showArml }: TableBaseProps) => {
  const transformedData = (data || []).map(({ _id, nom, activated_at, stats, arml }) => {
    const rawData = {
      _id,
      nom,
      arml,
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
    };

    return { element: displayData, rawData };
  });

  const {
    data: paginatedData,
    pagination,
    sorting,
    setSorting,
    onPageChange,
    onPageSizeChange,
    pageSize,
    createNavigationIcon,
  } = useVirtualizedPagination(transformedData, searchTerm, 20, [{ id: "total", desc: true }], customNavigationPath);

  const dataWithIcons = paginatedData.map((item) => ({
    ...item,
    element: {
      ...item.element,
      ...(createNavigationIcon && { icon: createNavigationIcon(item.rawData._id) }),
      traite_pourcentage: <>{item.element.traite_pourcentage}%</>,
    },
  }));

  const columns = useMemo(
    () => [
      ...(showArml ? [{ label: "ARML", dataKey: "arml", width: 100 }] : []),
      { label: "Mission Locale", dataKey: "nom", width: 300 },
      { label: "Total jeunes", dataKey: "total", width: 100 },
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
    [customNavigationPath]
  );

  return (
    <FullTable
      caption="Activation et traitement"
      data={dataWithIcons}
      columns={columns}
      pageSize={pageSize}
      emptyMessage="Aucune mission locale à afficher"
      sorting={sorting}
      onSortingChange={setSorting}
      pagination={pagination}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
    />
  );
};

const TableauRepartitionTraitePercent = ({
  data,
  searchTerm,
  headerAction,
  customNavigationPath,
  showArml,
}: TableBaseProps) => {
  const transformedData = (data || []).map(({ _id, nom, stats, arml }) => {
    const rawData = {
      _id,
      nom,
      arml,
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

    return { element: rawData, rawData };
  });

  const {
    data: paginatedData,
    pagination,
    sorting,
    setSorting,
    onPageChange,
    onPageSizeChange,
    pageSize,
    createNavigationIcon,
  } = useVirtualizedPagination(transformedData, searchTerm, 20, [{ id: "traite", desc: true }], customNavigationPath);

  const dataWithIcons = paginatedData.map((item) => ({
    ...item,
    element: {
      ...item.element,
      ...(createNavigationIcon && { icon: createNavigationIcon(item.rawData._id) }),
      rdv_pris_pourcentage: <>{item.rawData.rdv_pris_pourcentage}%</>,
      nouveau_projet_pourcentage: <>{item.rawData.nouveau_projet_pourcentage}%</>,
      deja_accompagne_pourcentage: <>{item.rawData.deja_accompagne_pourcentage}%</>,
      contacte_sans_retour_pourcentage: <>{item.rawData.contacte_sans_retour_pourcentage}%</>,
      coordonnees_incorrectes_pourcentage: <>{item.rawData.coordonnees_incorrectes_pourcentage}%</>,
      autre_pourcentage: <>{item.rawData.autre_pourcentage}%</>,
      deja_connu: <>{item.rawData.deja_connu}%</>,
      traite: <strong>{item.rawData.traite}</strong>,
      traite_pourcentage: <>{item.rawData.traite_pourcentage}%</>,
    },
  }));

  const columns = useMemo(
    () => [
      ...(showArml ? [{ label: "ARML", dataKey: "arml", width: 100 }] : []),
      { label: "Mission Locale", dataKey: "nom", width: 200 },
      { label: "Rdv pris %", dataKey: "rdv_pris_pourcentage", width: 50 },
      { label: "Nouv. proj. %", dataKey: "nouveau_projet_pourcentage", width: 50 },
      { label: "Déjà acc. %", dataKey: "deja_accompagne_pourcentage", width: 50 },
      { label: "Cont. sans ret. %", dataKey: "contacte_sans_retour_pourcentage", width: 50 },
      { label: "Coord. inc. %", dataKey: "coordonnees_incorrectes_pourcentage", width: 50 },
      { label: "Autre %", dataKey: "autre_pourcentage", width: 50 },
      { label: "Déjà connu %", dataKey: "deja_connu", width: 50 },
      { label: "Traités", dataKey: "traite", width: 50 },
      { label: "Traités %", dataKey: "traite_pourcentage", width: 50 },
      ...(customNavigationPath ? [{ label: "", dataKey: "icon", width: 10, sortable: false }] : []),
    ],
    [customNavigationPath]
  );

  return (
    <FullTable
      caption="Résultats obtenus"
      data={dataWithIcons}
      columns={columns}
      pageSize={pageSize}
      emptyMessage="Aucune mission locale à afficher"
      sorting={sorting}
      onSortingChange={setSorting}
      pagination={pagination}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      headerAction={headerAction}
    />
  );
};

const StatsBarChart = ({ stats, nom }: { stats: MissionLocaleStats; nom: string }) => {
  if (!stats.traite) {
    return <span style={{ fontStyle: "italic" }}>Pas encore de dossier traité</span>;
  }

  // Convertir les valeurs absolues en pourcentages pour homogénéiser l'affichage
  const total = stats.traite;
  const rdv_pris_pct = (stats.rdv_pris / total) * 100;
  const nouveau_projet_pct = (stats.nouveau_projet / total) * 100;
  const deja_accompagne_pct = (stats.deja_accompagne / total) * 100;
  const contacte_sans_retour_pct = (stats.contacte_sans_retour / total) * 100;
  const coordonnees_incorrectes_pct = (stats.coordonnees_incorrectes / total) * 100;
  const autre_pct = (stats.autre / total) * 100;

  return (
    <BarChart
      height={50}
      layout="horizontal"
      series={[
        {
          id: "rdv_pris",
          data: [rdv_pris_pct],
          label: "Rdv pris",
          stack: "stack1",
          color: colorMap.rdv_pris.color,
          valueFormatter: () => stats.rdv_pris.toString(),
        },
        {
          id: "nouveau_projet",
          data: [nouveau_projet_pct],
          label: "Nouveau projet",
          stack: "stack1",
          color: colorMap.nouveau_projet.color,
          valueFormatter: () => stats.nouveau_projet.toString(),
        },
        {
          id: "deja_accompagne",
          data: [deja_accompagne_pct],
          label: "Déjà accompagné",
          stack: "stack1",
          color: colorMap.deja_accompagne.color,
          valueFormatter: () => stats.deja_accompagne.toString(),
        },
        {
          id: "contacte_sans_retour",
          data: [contacte_sans_retour_pct],
          label: "Sans réponse",
          stack: "stack1",
          color: colorMap.contacte_sans_retour.color,
          valueFormatter: () => stats.contacte_sans_retour.toString(),
        },
        {
          id: "coordonnees_incorrectes",
          data: [coordonnees_incorrectes_pct],
          label: "Coordonnées incorrectes",
          stack: "stack1",
          color: colorMap.coordonnees_incorrectes.color,
          valueFormatter: () => stats.coordonnees_incorrectes.toString(),
        },
        {
          id: "autre",
          data: [autre_pct],
          label: "Autre",
          stack: "stack1",
          color: colorMap.autre.color,
          valueFormatter: () => stats.autre.toString(),
        },
      ]}
      hideLegend={true}
      xAxis={[{ min: 0, max: 100, position: "none" }]}
      yAxis={[{ position: "none", data: [nom] }]}
      margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
    />
  );
};

const TableauRepartitionTraiteGraph = ({
  data,
  searchTerm,
  headerAction,
  customNavigationPath,
  showArml,
}: TableBaseProps) => {
  const transformedData = (data || []).map(({ _id, nom, stats, arml }) => {
    const rawData = {
      _id,
      nom,
      traite: stats.traite,
      traite_pourcentage: computePercentage(stats.traite, stats.total),
      arml,
      graph: <StatsBarChart stats={stats} nom={nom} />,
    };

    return { element: rawData, rawData };
  });

  const {
    data: paginatedData,
    pagination,
    sorting,
    setSorting,
    onPageChange,
    onPageSizeChange,
    pageSize,
    createNavigationIcon,
  } = useVirtualizedPagination(transformedData, searchTerm, 20, [{ id: "traite", desc: true }], customNavigationPath);

  const dataWithIcons = paginatedData.map((item) => ({
    ...item,
    element: {
      ...item.element,
      ...(createNavigationIcon && { icon: createNavigationIcon(item.rawData._id) }),
      traite: <strong>{item.rawData.traite}</strong>,
      traite_pourcentage: <>{item.rawData.traite_pourcentage}%</>,
    },
  }));

  const columns = useMemo(
    () => [
      ...(showArml ? [{ label: "ARML", dataKey: "arml", width: 100 }] : []),
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
    [customNavigationPath]
  );

  return (
    <FullTable
      caption="Résultats obtenus"
      data={dataWithIcons}
      columns={columns}
      pageSize={pageSize}
      emptyMessage="Aucune mission locale à afficher"
      sorting={sorting}
      onSortingChange={setSorting}
      pagination={pagination}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
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
  showArml = false,
}: {
  typeVue: string | null;
  data?: MissionLocale[];
  searchTerm: string;
  onTypeVueChange: (type: string) => void;
  customNavigationPath?: (id: string) => string;
  showArml?: boolean;
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
          showArml={showArml}
        />
      );
    case "percent":
      return (
        <TableauRepartitionTraitePercent
          data={data}
          searchTerm={searchTerm}
          headerAction={viewSelector}
          customNavigationPath={customNavigationPath}
          showArml={showArml}
        />
      );
    default:
      return null;
  }
};

export type { MissionLocale, MissionLocaleStats };
