"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { useMemo } from "react";

import { MultiSelectDropdown } from "@/app/_components/common/MultiSelectDropdown";
import type { ICfaEffectifsResponse } from "@/common/types/cfaRuptures";
import { ACTIVE_COLLAB_STATUS_LABELS } from "@/common/types/cfaRuptures";

import { CfaCollaborationsTable } from "./CfaCollaborationsTable";
import styles from "./CfaEffectifsList.module.css";
import filterStyles from "./CfaFilters.module.css";
import cardStyles from "./CfaRuptureSegment.module.css";

interface CfaCollaborationsListProps {
  data: ICfaEffectifsResponse | null;
  searchInput: string;
  onSearchChange: (value: string) => void;
  sort: string;
  order: "asc" | "desc";
  collabStatusFilter?: string;
  formationFilter?: string;
  onParamsChange: (updates: Record<string, string | undefined>) => void;
}

export function CfaCollaborationsList({
  data,
  searchInput,
  onSearchChange,
  sort,
  order,
  collabStatusFilter,
  formationFilter,
  onParamsChange,
}: CfaCollaborationsListProps) {
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
    () => Object.entries(ACTIVE_COLLAB_STATUS_LABELS).map(([value, label]) => ({ value, label })),
    []
  );

  const hasActiveCollabFilter = collabStatuses.length > 0 && collabStatuses.length < 3;
  const hasActiveFilters = hasActiveCollabFilter || formations.length > 0;

  const handleSort = (sortKey: string) => {
    if (sort === sortKey) {
      onParamsChange({ order: order === "asc" ? "desc" : "asc" });
    } else {
      onParamsChange({ sort: sortKey, order: "asc" });
    }
  };

  const handlePageChange = (page: number) => {
    onParamsChange({ page: String(page) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Collaborations en cours</h1>
        <p className={styles.subtitle}>
          Suivez ici l&apos;ensemble des collaborations initiées avec les Missions Locales et visualisez l&apos;état de
          chaque dossier transmis.
        </p>
      </div>

      <div className={filterStyles.filtersSection}>
        <div className={filterStyles.searchField}>
          <Input
            label="Rechercher"
            hideLabel
            nativeInputProps={{
              placeholder: "Rechercher un jeune par nom ou prénom",
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

        <div className={filterStyles.filtersRow}>
          <span className={filterStyles.filterLabel}>Filtrer</span>

          <div className={filterStyles.selectFieldWide}>
            <MultiSelectDropdown
              options={collabOptions}
              value={hasActiveCollabFilter ? collabStatuses : []}
              onChange={(v) =>
                onParamsChange({
                  collab_status: v.length > 0 ? v.join(",") : undefined,
                  page: "1",
                })
              }
              placeholder="Statut de collaboration"
            />
          </div>

          <div className={filterStyles.selectFieldWide}>
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
        </div>

        {hasActiveFilters && (
          <div className={filterStyles.tagsRow}>
            {hasActiveCollabFilter &&
              collabStatuses.map((status) => (
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
                  {ACTIVE_COLLAB_STATUS_LABELS[status] ?? status}
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

      {data && data.effectifs.length > 0 ? (
        <section className={cardStyles.card}>
          <div className={cardStyles.cardHeader}>
            <h3 className={cardStyles.cardTitle}>Collaborations en cours</h3>
            <span className={cardStyles.cardCount}>
              {data.pagination.total} dossier{data.pagination.total !== 1 ? "s" : ""}
            </span>
          </div>

          <CfaCollaborationsTable effectifs={data.effectifs} sort={sort} order={order} onSort={handleSort} />

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
      ) : data ? (
        <section className={cardStyles.card}>
          <div className={cardStyles.emptyMessage}>
            <p>Aucune collaboration en cours.</p>
            <p>
              Rendez-vous sur la page <a href="/cfa">Effectifs en ruptures</a> pour initier une collaboration avec une
              Mission Locale.
            </p>
          </div>
        </section>
      ) : null}
    </div>
  );
}
