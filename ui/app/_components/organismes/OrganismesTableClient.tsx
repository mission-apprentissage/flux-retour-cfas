"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import { useQuery } from "@tanstack/react-query";
import { SortingState } from "@tanstack/react-table";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { normalize, UAI_INCONNUE_TAG_FORMAT } from "shared";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { DataTable } from "@/app/_components/table/DataTable";
import { usePlausibleAppTracking } from "@/app/_hooks/plausible";
import { NatureOrganismeTag } from "@/app/admin/_components/NatureOrganismeTag";
import { convertOrganismeToExport, organismesExportColumns } from "@/common/exports";
import {
  OrganismesFilters,
  OrganismesFiltersQuery,
  convertOrganismesFiltersToQuery,
  filterOrganismesArrayFromOrganismesFilters,
  parseOrganismesFiltersFromQuery,
} from "@/common/filters/organismes-filters";
import { convertPaginationInfosToQuery } from "@/common/filters/pagination";
import { _get } from "@/common/httpClient";
import { OrganismeNormalized } from "@/common/internal/Organisme";
import { formatDate } from "@/common/utils/dateUtils";
import { exportDataAsXlsx } from "@/common/utils/exportUtils";

import { InfoTransmissionDonnees } from "./InfoTransmissionDonnees";
import styles from "./organismes.module.scss";
import { OrganismeFiltersListVisibilityProps, OrganismesFilterPanel } from "./OrganismesFilterPanel";

const DEFAULT_SORT: SortingState = [{ desc: false, id: "normalizedName" }];

const SORT_ID_TO_API: Record<string, string> = {
  normalizedName: "nom",
  nature: "nature",
  last_transmission_date: "transmission",
  formationsCount: "formations",
  adresse: "adresse",
};

interface OrganismesPaginatedResponse {
  organismes: OrganismeNormalized[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  totalFormations: number;
}

interface OrganismesTableClientProps extends OrganismeFiltersListVisibilityProps {
  organismes: OrganismeNormalized[];
  modeNonFiable?: boolean;
  serverSide?: boolean;
  totalPerimetre?: number;
}

function isSortingState(value: any): value is SortingState {
  return Array.isArray(value) && value.every((item) => typeof item === "object" && "id" in item && "desc" in item);
}

function parseSortParam(raw: string | null): SortingState {
  if (!raw) return DEFAULT_SORT;
  try {
    const parsed = JSON.parse(raw);
    return isSortingState(parsed) ? parsed : DEFAULT_SORT;
  } catch {
    return DEFAULT_SORT;
  }
}

export function OrganismesTableClient(props: OrganismesTableClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { trackPlausibleEvent } = usePlausibleAppTracking();

  const [searchValue, setSearchValue] = useState<string>(() => searchParams?.get("search") ?? "");
  const [sort, setSort] = useState<SortingState>(() => parseSortParam(searchParams?.get("sort") ?? null));

  const filters = useMemo(
    () =>
      parseOrganismesFiltersFromQuery(
        Object.fromEntries(searchParams?.entries() ?? []) as unknown as OrganismesFiltersQuery
      ),
    [searchParams]
  );

  const serverPage = Math.max(1, Number(searchParams?.get("page")) || 1);
  const serverLimit = Math.min(100, Math.max(1, Number(searchParams?.get("limit")) || 20));

  // Synchronise recherche + tri + filtres (+ pagination en mode serveur) dans l'URL.
  // Sans `newPagination`, la page courante de l'URL est conservée (rechargement, deep link).
  const replaceQuery = (
    newFilters: OrganismesFilters,
    newSearch: string,
    newSort: SortingState,
    newPagination?: { page?: number; limit?: number }
  ) => {
    const page = newPagination?.page ?? serverPage;
    const limit = newPagination?.limit ?? serverLimit;
    const query = new URLSearchParams({
      ...(newSearch ? { search: newSearch } : {}),
      ...convertOrganismesFiltersToQuery(newFilters),
      ...convertPaginationInfosToQuery({ sort: newSort }),
      ...(props.serverSide && page > 1 ? { page: String(page) } : {}),
      ...(props.serverSide && limit !== 20 ? { limit: String(limit) } : {}),
    } as Record<string, string>);
    router.replace(`?${query.toString()}`, { scroll: false });
  };

  // Au montage la page de l'URL est préservée ; une recherche ou un tri saisi ensuite ramène en page 1.
  const isInitialSync = useRef(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      replaceQuery(filters, searchValue, sort, isInitialSync.current ? undefined : { page: 1 });
      isInitialSync.current = false;
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue, sort]);

  const onFiltersChange = (newParams: Partial<OrganismesFilters>) => {
    replaceQuery({ ...filters, ...newParams }, searchValue, sort, { page: 1 });
  };

  const onReset = () => {
    setSearchValue("");
    setSort(DEFAULT_SORT);
    router.replace("?", { scroll: false });
  };

  const serverSearch = searchParams?.get("search") ?? "";
  const [serverSortCriterion] = sort.length > 0 ? sort : DEFAULT_SORT;

  const serverQueryParams = {
    page: serverPage,
    limit: serverLimit,
    sort: SORT_ID_TO_API[serverSortCriterion.id] ?? "nom",
    order: serverSortCriterion.desc ? "desc" : "asc",
    ...(serverSearch.length >= 2 ? { search: serverSearch } : {}),
    ...convertOrganismesFiltersToQuery(filters),
  };

  const { data: serverData } = useQuery<OrganismesPaginatedResponse>({
    queryKey: ["organisation-organismes-paginated", serverQueryParams],
    queryFn: () => _get("/api/v1/organisation/organismes/paginated", { params: serverQueryParams }),
    enabled: !!props.serverSide,
    placeholderData: (previous) => previous,
  });

  const panelFilteredOrganismes = useMemo(
    () => filterOrganismesArrayFromOrganismesFilters(props.organismes, filters),
    [props.organismes, filters]
  );

  const filteredOrganismes = useMemo(() => {
    if (searchValue.length < 2) return panelFilteredOrganismes;

    const normalizedSearchValue = normalize(searchValue);
    const tokens = normalizedSearchValue.split(/\s+/).filter(Boolean);
    return panelFilteredOrganismes.filter(
      (organisme) =>
        tokens.every(
          (token) => organisme.normalizedName.includes(token) || organisme.normalizedCommune.includes(token)
        ) ||
        organisme.normalizedUai?.startsWith(normalizedSearchValue) ||
        organisme.siret?.startsWith(searchValue.trim())
    );
  }, [panelFilteredOrganismes, searchValue]);

  const countFormations = useMemo(
    () => panelFilteredOrganismes.reduce((acc, organisme) => acc + (organisme.formationsCount ?? 0), 0),
    [panelFilteredOrganismes]
  );

  const sortedOrganismes = useMemo(() => {
    const [criterion] = sort.length > 0 ? sort : DEFAULT_SORT;
    const direction = criterion.desc ? -1 : 1;
    const sortKey = (organisme: OrganismeNormalized): string | number => {
      switch (criterion.id) {
        case "nature":
          return organisme.nature === "inconnue" ? " " : organisme.nature;
        case "last_transmission_date":
          return organisme.last_transmission_date ?? "";
        case "formationsCount":
          return organisme.formationsCount ?? 0;
        case "ferme":
          return organisme.ferme ? 1 : 0;
        case "adresse":
          return organisme.adresse?.commune ?? "";
        default:
          return organisme.normalizedName;
      }
    };
    return [...filteredOrganismes].sort((a, b) => {
      const valueA = sortKey(a);
      const valueB = sortKey(b);
      // les organismes sans transmission restent en fin de liste, quel que soit le sens du tri
      if (criterion.id === "last_transmission_date") {
        if (!valueA && valueB) return 1;
        if (valueA && !valueB) return -1;
      }
      if (typeof valueA === "number" && typeof valueB === "number") return direction * (valueA - valueB);
      // les organismes sans nom exploitable restent en fin de liste
      if (
        criterion.id === "normalizedName" ||
        !["nature", "last_transmission_date", "formationsCount", "ferme", "adresse"].includes(criterion.id)
      ) {
        if (!valueA && valueB) return 1;
        if (valueA && !valueB) return -1;
      }
      return direction * String(valueA).localeCompare(String(valueB));
    });
  }, [filteredOrganismes, sort]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const lastPage = props.serverSide
    ? Math.max(1, serverData?.pagination?.totalPages ?? 1)
    : Math.max(1, Math.ceil(sortedOrganismes.length / pageSize));
  const currentPage = props.serverSide ? serverPage : Math.min(page, lastPage);
  const currentPageSize = props.serverSide ? serverLimit : pageSize;
  const pageOrganismes = props.serverSide
    ? (serverData?.organismes ?? [])
    : sortedOrganismes.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalOrganismes = props.serverSide ? (serverData?.pagination?.total ?? 0) : filteredOrganismes.length;
  const totalPerimetre = props.serverSide ? (props.totalPerimetre ?? totalOrganismes) : props.organismes.length;
  const estFiltre = totalPerimetre > 0 && totalOrganismes !== totalPerimetre;
  const totalFormations = props.serverSide ? (serverData?.totalFormations ?? 0) : countFormations;

  const onPageChange = (newPage: number) => {
    if (props.serverSide) {
      replaceQuery(filters, searchValue, sort, { page: newPage, limit: serverLimit });
    } else {
      setPage(newPage);
    }
  };

  const onPageSizeChange = (newPageSize: number) => {
    if (props.serverSide) {
      replaceQuery(filters, searchValue, sort, { page: 1, limit: newPageSize });
    } else {
      setPageSize(newPageSize);
    }
  };

  const onExport = async () => {
    trackPlausibleEvent(
      props.modeNonFiable ? "telechargement_liste_of_a_fiabiliser" : "telechargement_liste_of_fiables"
    );
    let rows: OrganismeNormalized[] = filteredOrganismes;
    if (props.serverSide) {
      const all = await _get<OrganismeNormalized[]>("/api/v1/organisation/organismes");
      rows = filterOrganismesArrayFromOrganismesFilters(all, filters);
      if (searchValue.length >= 2) {
        const normalizedSearchValue = normalize(searchValue);
        const tokens = normalizedSearchValue.split(/\s+/).filter(Boolean);
        rows = rows.filter((organisme) => {
          const nom = normalize(organisme.enseigne ?? organisme.raison_sociale ?? "");
          const commune = normalize(organisme.adresse?.commune ?? "");
          return (
            tokens.every((token) => nom.includes(token) || commune.includes(token)) ||
            organisme.uai?.toLowerCase().startsWith(normalizedSearchValue) ||
            organisme.siret?.startsWith(searchValue.trim())
          );
        });
      }
    }
    exportDataAsXlsx(
      `tdb-organismes-${formatDate(new Date(), "dd-MM-yy")}.xlsx`,
      rows.map((organisme) => convertOrganismeToExport(organisme)),
      organismesExportColumns
    );
  };

  const columns = [
    { label: "Nom de l’organisme", dataKey: "normalizedName", width: "30%" },
    {
      label: (
        <span className={styles.headerWithTooltip}>
          Nature
          <Tooltip
            kind="click"
            title={
              <>
                La donnée «&nbsp;Nature&nbsp;» est déduite des relations entre les organismes (base des Carif-Oref). Une
                nature «&nbsp;inconnue&nbsp;» signifie que l’organisme n’a pas (ou incomplètement) déclaré son offre de
                formation dans la base de son Carif-Oref.
              </>
            }
          />
        </span>
      ),
      dataKey: "nature",
    },
    {
      label: (
        <span className={styles.headerWithTooltip}>
          Transmission au tableau
          <Tooltip
            kind="click"
            title={
              <>
                <p>5 états concernant la donnée sont identifiés&nbsp;:</p>
                <ul>
                  <li>transmission de données depuis moins d’1 mois (vert)</li>
                  <li>transmission de données depuis moins de 3 mois (orange)</li>
                  <li>transmission de données considérées obsolètes depuis plus de 3 mois (rouge)</li>
                  <li>aucune donnée transmise (rouge foncé)</li>
                  <li>Non-disponible&nbsp;: les droits d’accès à cette information sont restreints.</li>
                </ul>
              </>
            }
          />
        </span>
      ),
      dataKey: "last_transmission_date",
    },
    {
      label: (
        <span className={styles.headerWithTooltip}>
          Formations
          <Tooltip
            kind="click"
            title={
              <>
                <b>Formations de l’établissement</b>
                <p>
                  Le nombre de formations associées à cet organisme provient du{" "}
                  <a
                    href="https://catalogue-apprentissage.intercariforef.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fr-link"
                  >
                    Catalogue des offres de formations en apprentissage
                  </a>{" "}
                  (Carif-Oref) dont votre établissement a la gestion. Si une erreur est constatée, écrivez à{" "}
                  <a href="mailto:pole-apprentissage@intercariforef.org" className="fr-link">
                    pole-apprentissage@intercariforef.org
                  </a>
                  .
                </p>
              </>
            }
          />
        </span>
      ),
      dataKey: "formationsCount",
    },
    ...(props.modeNonFiable
      ? [
          {
            label: (
              <span className={styles.headerWithTooltip}>
                État
                <Tooltip
                  kind="click"
                  title="Indication de l’état administratif du SIRET de l’établissement, tel qu’il est renseigné sur l’INSEE. Si cette information est erronée, merci de leur signaler."
                />
              </span>
            ),
            dataKey: "ferme",
          },
        ]
      : []),
    {
      label: (
        <span className={styles.headerWithTooltip}>
          Localisation
          <Tooltip
            kind="click"
            title="Nom de la commune, code postal et code commune INSEE de l’établissement qui accueille physiquement les apprentis et les forme."
          />
        </span>
      ),
      dataKey: "adresse",
    },
  ];

  const tableData = pageOrganismes.map((organisme) => ({
    _id: organisme._id,
    rawData: {
      normalizedName: organisme.normalizedName ?? (organisme.enseigne ?? organisme.raison_sociale ?? "").toLowerCase(),
      nature: organisme.nature === "inconnue" ? " " : organisme.nature,
      last_transmission_date: organisme.last_transmission_date ?? "",
      formationsCount: organisme.formationsCount ?? 0,
      ferme: organisme.ferme ? 1 : 0,
      adresse: organisme.adresse?.commune ?? "",
    },
    element: {
      normalizedName: (
        <span
          className={(organisme as any).prominent ? "organisme-prominent" : undefined}
          title={organisme.enseigne ?? organisme.raison_sociale}
        >
          <DsfrLink
            href={`/organismes/${organisme._id}`}
            arrow="none"
            className={`${styles.organismeNameCell} ${(organisme.enseigne ?? organisme.raison_sociale) ? "" : styles.organismeNameInconnu}`}
          >
            {organisme.enseigne ?? organisme.raison_sociale ?? "Organisme inconnu"}
          </DsfrLink>
          <span className={styles.organismeNameSub}>
            UAI&nbsp;: {organisme.uai ?? <span className={styles.uaiInconnue}>{UAI_INCONNUE_TAG_FORMAT}</span>} -
            SIRET&nbsp;: {organisme.siret}
          </span>
        </span>
      ),
      nature: <NatureOrganismeTag nature={organisme.nature} />,
      last_transmission_date: (
        <InfoTransmissionDonnees
          lastTransmissionDate={organisme.last_transmission_date}
          permissionInfoTransmissionEffectifs={organisme.permissions?.infoTransmissionEffectifs}
        />
      ),
      formationsCount:
        (organisme.formationsCount ?? 0) > 0 ? (
          <a
            href={`https://catalogue-apprentissage.intercariforef.org/etablissement/${organisme.siret || ""}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`fr-link ${styles.formationsLink}`}
            onClick={(event) => event.stopPropagation()}
          >
            {organisme.formationsCount} formation{(organisme.formationsCount ?? 0) > 1 ? "s" : ""}
          </a>
        ) : (
          <span className={styles.formationsVide}>0</span>
        ),
      ...(props.modeNonFiable
        ? { ferme: organisme.ferme ? <span className={styles.etatFerme}>Fermé</span> : <span>Ouvert</span> }
        : {}),
      adresse: (
        <span
          className={styles.localisationCell}
          title={organisme.adresse?.code_insee ? `Code Insee : ${organisme.adresse.code_insee}` : undefined}
        >
          {organisme.adresse?.commune || ""}
          {organisme.adresse?.code_postal ? ` (${organisme.adresse.code_postal})` : ""}
        </span>
      ),
    },
  }));

  return (
    <>
      <div className={styles.searchPanel}>
        <div className={styles.searchRow}>
          <Input
            label=""
            className={styles.searchInput}
            nativeInputProps={{
              type: "search",
              name: "search_organisme",
              placeholder: "Rechercher un organisme par nom, UAI, SIRET ou ville (indiquez au moins deux caractères)",
              value: searchValue,
              onChange: (event) => setSearchValue(event.target.value),
            }}
          />
          <Button
            priority="secondary"
            iconId="fr-icon-download-line"
            disabled={totalOrganismes === 0}
            title={totalOrganismes === 0 ? "Aucun organisme à télécharger" : undefined}
            onClick={onExport}
          >
            Télécharger la liste
          </Button>
        </div>
        <OrganismesFilterPanel {...props} filters={filters} onFiltersChange={onFiltersChange} onReset={onReset} />
      </div>

      <p className={styles.tableCount}>
        <strong>
          {totalOrganismes.toLocaleString("fr-FR")} organisme{totalOrganismes > 1 ? "s" : ""}
          {estFiltre ? ` sur ${totalPerimetre.toLocaleString("fr-FR")}` : ""}
        </strong>{" "}
        et {totalFormations.toLocaleString("fr-FR")} formations associées
      </p>

      <div className={styles.organismesTable}>
        <DataTable
          data={tableData}
          columns={columns as any}
          tableLabel="Liste des organismes"
          sorting={sort}
          onSortingChange={setSort}
          emptyMessage="Aucun organisme à afficher"
          onRowClick={(rowData) => router.push(`/organismes/${rowData._id}`)}
          pagination={{ total: totalOrganismes, page: currentPage, limit: currentPageSize, lastPage }}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          pageSize={currentPageSize}
        />
      </div>
    </>
  );
}
