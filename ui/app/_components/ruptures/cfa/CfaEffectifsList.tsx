"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { useMemo } from "react";

import { MultiSelectDropdown } from "@/app/_components/common/MultiSelectDropdown";
import { DsfrLink } from "@/app/_components/link/DsfrLink";
import type { CfaCollaborationStatus, ICfaEffectifsResponse } from "@/common/types/cfaRuptures";
import { COLLAB_STATUS_FILTER_LABELS, COLLAB_STATUS_FILTER_OPTIONS } from "@/common/types/cfaRuptures";

import { CfaEffectifsHeader } from "./CfaEffectifsHeader";
import styles from "./CfaEffectifsList.module.css";
import filterStyles from "./CfaFilters.module.css";
import cardStyles from "./CfaRuptureSegment.module.css";
import { CfaTousEffectifsTable } from "./CfaTousEffectifsTable";
import { highlightHorsCollab } from "./collabFilterLabel";
import { useSortablePagination } from "./hooks";

interface CfaEffectifsListProps {
  data: ICfaEffectifsResponse | null;
  isAllowedDeca: boolean;
  searchInput: string;
  onSearchChange: (value: string) => void;
  sort: string;
  order: "asc" | "desc";
  collabStatusFilter?: string;
  formationFilter?: string;
  onParamsChange: (updates: Record<string, string | undefined>) => void;
}

export function CfaEffectifsList({
  data,
  isAllowedDeca,
  searchInput,
  onSearchChange,
  sort,
  order,
  collabStatusFilter,
  formationFilter,
  onParamsChange,
}: CfaEffectifsListProps) {
  const collabStatuses = useMemo(
    () => (collabStatusFilter ? collabStatusFilter.split(",").filter(Boolean) : []),
    [collabStatusFilter]
  );

  const formations = useMemo(
    () => (formationFilter ? formationFilter.split(",").filter(Boolean) : []),
    [formationFilter]
  );

  const formationOptions = useMemo(
    () => (data?.filters.formations ?? []).map((f) => ({ value: f, label: f })),
    [data?.filters.formations]
  );

  const collabOptions = useMemo(
    () =>
      COLLAB_STATUS_FILTER_OPTIONS.map((value) => ({
        value,
        label: COLLAB_STATUS_FILTER_LABELS[value],
        labelNode: highlightHorsCollab(COLLAB_STATUS_FILTER_LABELS[value]),
      })),
    []
  );

  const hasActiveFilters = collabStatuses.length > 0 || formations.length > 0;

  const { handleSort, handlePageChange } = useSortablePagination(sort, order, onParamsChange);

  return (
    <div>
      <CfaEffectifsHeader isAllowedDeca={isAllowedDeca} />

      <section className={styles.hero}>
        <h2 className={styles.heroTitle}>Un ou une jeune a besoin de l&apos;aide d&apos;une Mission Locale ?</h2>
        <div className={styles.heroSearch}>
          <Input
            label="Rechercher un jeune"
            hideLabel
            nativeInputProps={{
              placeholder: "Rechercher un jeune par son prénom ou son nom ici",
              type: "search",
              value: searchInput,
              onChange: (e) => onSearchChange(e.target.value),
            }}
            addon={
              <Button
                iconId={searchInput ? "fr-icon-close-line" : "fr-icon-search-line"}
                title={searchInput ? "Effacer la recherche" : "Rechercher"}
                onClick={searchInput ? () => onSearchChange("") : undefined}
              />
            }
          />
        </div>
        <p className={styles.heroNotice}>
          Veuillez noter que le Tableau de bord travaille avec les Missions Locales qui accompagnent uniquement les
          publics de 16 à 25 ans.
        </p>
        <DsfrLink href="/cfa/a-propos#pourquoi-collaborer" className={styles.heroLink}>
          Pourquoi collaborer avec les Missions Locales ?
        </DsfrLink>
      </section>

      <div className={filterStyles.filtersSection}>
        <div className={`${filterStyles.filtersRow} ${styles.filtersRow}`}>
          <span className={filterStyles.filterLabel}>Filtrer</span>

          <div className={styles.filterField}>
            <MultiSelectDropdown
              options={formationOptions}
              value={formations}
              onChange={(v) =>
                onParamsChange({
                  formation: v.length > 0 ? v.join(",") : undefined,
                  page: "1",
                })
              }
              placeholder="Toutes les formations"
            />
          </div>

          <div className={styles.filterField}>
            <MultiSelectDropdown
              options={collabOptions}
              value={collabStatuses}
              onChange={(v) =>
                onParamsChange({
                  collab_status: v.length > 0 ? v.join(",") : undefined,
                  page: "1",
                })
              }
              placeholder="Statut de la collaboration avec la ML"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className={filterStyles.tagsRow}>
            {collabStatuses.map((status) => (
              <Tag
                key={status}
                pressed
                nativeButtonProps={{
                  onClick: () => {
                    const next = collabStatuses.filter((s) => s !== status);
                    onParamsChange({
                      collab_status: next.length > 0 ? next.join(",") : undefined,
                      page: "1",
                    });
                  },
                }}
              >
                {COLLAB_STATUS_FILTER_LABELS[status as CfaCollaborationStatus] ?? status}
              </Tag>
            ))}
            {formations.map((f) => (
              <Tag
                key={f}
                pressed
                nativeButtonProps={{
                  onClick: () => {
                    const next = formations.filter((v) => v !== f);
                    onParamsChange({
                      formation: next.length > 0 ? next.join(",") : undefined,
                      page: "1",
                    });
                  },
                }}
              >
                {f}
              </Tag>
            ))}
            <button
              type="button"
              className={filterStyles.resetButton}
              onClick={() =>
                onParamsChange({
                  collab_status: undefined,
                  formation: undefined,
                  page: "1",
                })
              }
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>

      {data && (
        <section className={cardStyles.card}>
          <div className={cardStyles.cardHeader}>
            <h2 className={cardStyles.cardTitle}>Tous les effectifs</h2>
            <span className={cardStyles.cardCount}>
              {data.pagination.total} effectif{data.pagination.total !== 1 ? "s" : ""}
            </span>
          </div>

          <CfaTousEffectifsTable effectifs={data.effectifs} sort={sort} order={order} onSort={handleSort} />

          {data.pagination.totalPages > 1 && (
            <div className={cardStyles.paginationContainer}>
              <Pagination
                key={data.pagination.page}
                count={data.pagination.totalPages}
                defaultPage={data.pagination.page}
                getPageLinkProps={(pageNumber) => ({
                  href: `#page-${pageNumber}`,
                  onClick: (e: React.MouseEvent) => {
                    e.preventDefault();
                    handlePageChange(pageNumber);
                  },
                })}
                showFirstLast
              />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
