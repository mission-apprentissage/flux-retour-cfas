"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import { SortingState } from "@tanstack/react-table";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import { OrganismeNormalized } from "@/common/internal/Organisme";
import { formatDate } from "@/common/utils/dateUtils";
import { exportDataAsXlsx } from "@/common/utils/exportUtils";

import { InfoTransmissionDonnees } from "./InfoTransmissionDonnees";
import styles from "./organismes.module.scss";
import { OrganismeFiltersListVisibilityProps, OrganismesFilterPanel } from "./OrganismesFilterPanel";

const DEFAULT_SORT: SortingState = [{ desc: false, id: "normalizedName" }];

interface OrganismesTableClientProps extends OrganismeFiltersListVisibilityProps {
  organismes: OrganismeNormalized[];
  modeNonFiable?: boolean;
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

  // Synchronise recherche + tri + filtres dans l'URL (mêmes params que la page legacy).
  const replaceQuery = (newFilters: OrganismesFilters, newSearch: string, newSort: SortingState) => {
    const query = new URLSearchParams({
      ...(newSearch ? { search: newSearch } : {}),
      ...convertOrganismesFiltersToQuery(newFilters),
      ...convertPaginationInfosToQuery({ sort: newSort }),
    } as Record<string, string>);
    router.replace(`?${query.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const timer = setTimeout(() => replaceQuery(filters, searchValue, sort), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue, sort]);

  const onFiltersChange = (newParams: Partial<OrganismesFilters>) => {
    replaceQuery({ ...filters, ...newParams }, searchValue, sort);
  };

  const onReset = () => {
    setSearchValue("");
    setSort(DEFAULT_SORT);
    router.replace("?", { scroll: false });
  };

  const panelFilteredOrganismes = useMemo(
    () => filterOrganismesArrayFromOrganismesFilters(props.organismes, filters),
    [props.organismes, filters]
  );

  const filteredOrganismes = useMemo(() => {
    if (searchValue.length < 2) return panelFilteredOrganismes;

    const normalizedSearchValue = normalize(searchValue);
    return panelFilteredOrganismes.filter(
      (organisme) =>
        organisme.normalizedName.includes(normalizedSearchValue) ||
        organisme.normalizedUai?.startsWith(normalizedSearchValue) ||
        organisme.siret?.startsWith(normalizedSearchValue) ||
        organisme.normalizedCommune.startsWith(normalizedSearchValue)
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
      return direction * String(valueA).localeCompare(String(valueB));
    });
  }, [filteredOrganismes, sort]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const lastPage = Math.max(1, Math.ceil(sortedOrganismes.length / pageSize));
  const currentPage = Math.min(page, lastPage);
  const pageOrganismes = sortedOrganismes.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
    { label: "Voir", dataKey: "more", sortable: false },
  ];

  const tableData = pageOrganismes.map((organisme) => ({
    _id: organisme._id,
    rawData: {
      normalizedName: organisme.normalizedName,
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
          <DsfrLink href={`/organismes/${organisme._id}`} arrow="none" className={styles.organismeNameCell}>
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
      formationsCount: (
        <a
          href={`https://catalogue-apprentissage.intercariforef.org/etablissement/${organisme.siret || ""}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fr-link"
        >
          {organisme.formationsCount ?? 0}
        </a>
      ),
      ...(props.modeNonFiable
        ? { ferme: organisme.ferme ? <span className={styles.etatFerme}>Fermé</span> : <span>Ouvert</span> }
        : {}),
      adresse: (
        <span>
          {organisme.adresse?.commune || ""}
          <span className={styles.localisationSub}>
            {organisme.adresse?.code_postal || ""}
            {organisme.adresse?.code_insee && organisme.adresse?.code_postal !== organisme.adresse?.code_insee
              ? ` (Insee: ${organisme.adresse?.code_insee})`
              : ""}
          </span>
        </span>
      ),
      more: (
        <Button
          linkProps={{ href: `/organismes/${organisme._id}` }}
          priority="tertiary no outline"
          size="small"
          iconId="fr-icon-arrow-right-line"
          title="Voir l’organisme"
        />
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
            disabled={filteredOrganismes.length === 0}
            title={filteredOrganismes.length === 0 ? "Aucun organisme à télécharger" : undefined}
            onClick={() => {
              trackPlausibleEvent(
                props.modeNonFiable ? "telechargement_liste_of_a_fiabiliser" : "telechargement_liste_of_fiables"
              );
              exportDataAsXlsx(
                `tdb-organismes-${formatDate(new Date(), "dd-MM-yy")}.xlsx`,
                filteredOrganismes.map((organisme) => convertOrganismeToExport(organisme)),
                organismesExportColumns
              );
            }}
          >
            Télécharger la liste
          </Button>
        </div>
        <OrganismesFilterPanel {...props} filters={filters} onFiltersChange={onFiltersChange} onReset={onReset} />
      </div>

      <p className={styles.tableCount}>
        <strong>
          {filteredOrganismes.length} organismes et {countFormations} formations associées
        </strong>
      </p>

      <div className={styles.organismesTable}>
        <DataTable
          data={tableData}
          columns={columns as any}
          tableLabel="Liste des organismes"
          sorting={sort}
          onSortingChange={setSort}
          emptyMessage="Aucun organisme à afficher"
          pagination={{ total: sortedOrganismes.length, page: currentPage, limit: pageSize, lastPage }}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSize={pageSize}
        />
      </div>
    </>
  );
}
