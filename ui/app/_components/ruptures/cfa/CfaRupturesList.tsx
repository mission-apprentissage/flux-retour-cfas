"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { useCallback, useMemo, useState } from "react";

import { MultiSelectDropdown } from "@/app/_components/common/MultiSelectDropdown";
import type {
  CfaCollaborationStatus,
  ICfaEffectif,
  ICfaEffectifsResponse,
  ICfaRupturesResponse,
} from "@/common/types/cfaRuptures";
import { COLLAB_STATUS_FILTER_LABELS, COLLAB_STATUS_FILTER_OPTIONS } from "@/common/types/cfaRuptures";

import { CfaDeclareDateRuptureModal, declareDateRuptureModal } from "./CfaDeclareDateRuptureModal";
import filterStyles from "./CfaFilters.module.css";
import cardStyles from "./CfaRuptureSegment.module.css";
import styles from "./CfaRupturesList.module.css";
import { CfaRuptureTable } from "./CfaRuptureTable";
import { CfaSearchResults } from "./CfaSearchResults";
import { highlightHorsCollab } from "./collabFilterLabel";
import { useDeclareCfaRupture, useSortablePagination } from "./hooks";

interface CfaRupturesListProps {
  ruptureData: ICfaRupturesResponse | undefined;
  isRuptureLoading: boolean;
  organismeId: string;
  sort: string;
  order: "asc" | "desc";
  collabStatusFilter: string;
  formationFilter?: string;
  onParamsChange: (updates: Record<string, string | undefined>) => void;
  // Recherche (mode dédié, conserve la déclaration de rupture inline)
  searchInput: string;
  onSearchChange: (value: string) => void;
  searchData: ICfaEffectifsResponse | undefined;
  isSearchLoading: boolean;
  searchSort: string;
  searchOrder: "asc" | "desc";
  onSearchSort: (sortKey: string) => void;
  onSearchPageChange: (page: number) => void;
}

export function CfaRupturesList({
  ruptureData,
  isRuptureLoading,
  organismeId,
  sort,
  order,
  collabStatusFilter,
  formationFilter,
  onParamsChange,
  searchInput,
  onSearchChange,
  searchData,
  isSearchLoading,
  searchSort,
  searchOrder,
  onSearchSort,
  onSearchPageChange,
}: CfaRupturesListProps) {
  const [selectedEffectif, setSelectedEffectif] = useState<ICfaEffectif | null>(null);
  const { mutateAsync: declareRupture } = useDeclareCfaRupture();

  const handleToggleRupture = useCallback((effectif: ICfaEffectif) => {
    setSelectedEffectif(effectif);
    declareDateRuptureModal.open();
  }, []);

  const handleDeclareRupture = useCallback(
    async (dateRupture: string) => {
      if (!selectedEffectif) return;
      try {
        await declareRupture({
          organismeId,
          effectifId: selectedEffectif.id,
          dateRupture,
          source: selectedEffectif.source,
        });
      } catch {
        // Error handled by modal
      }
    },
    [organismeId, selectedEffectif, declareRupture]
  );

  const collabStatuses = useMemo(
    () => (collabStatusFilter ? collabStatusFilter.split(",").filter(Boolean) : []),
    [collabStatusFilter]
  );

  const formations = useMemo(
    () => (formationFilter ? formationFilter.split(",").filter(Boolean) : []),
    [formationFilter]
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
  const formationOptions = useMemo(
    () => (ruptureData?.filters.formations ?? []).map((f) => ({ value: f, label: f })),
    [ruptureData?.filters.formations]
  );

  const { handleSort, handlePageChange } = useSortablePagination(sort, order, onParamsChange);

  const total = ruptureData?.pagination.total ?? 0;
  const totalPages = ruptureData?.pagination.totalPages ?? 0;
  const effectifs = ruptureData?.effectifs ?? [];

  return (
    <div>
      <div className={filterStyles.filtersSection}>
        <div className={`${filterStyles.searchField} ${styles.searchFieldFix}`}>
          <Input
            label="Rechercher"
            hideLabel
            nativeInputProps={{
              placeholder: "Vous ne retrouvez pas un jeune ? Cherchez son nom ici",
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

        {!searchInput && (
          <>
            <div className={`${filterStyles.filtersRow} ${styles.filtersRowNarrow}`}>
              <span className={filterStyles.filterLabel}>Filtrer</span>
              <div className={`${filterStyles.selectField} ${filterStyles.selectFieldWide} ${styles.selectFieldWider}`}>
                <MultiSelectDropdown
                  options={collabOptions}
                  value={collabStatuses}
                  onChange={(v) =>
                    onParamsChange({ collab_status: v.length > 0 ? v.join(",") : undefined, page: undefined })
                  }
                  placeholder="Statut collaboration ML"
                />
              </div>

              <div className={`${filterStyles.selectField} ${filterStyles.selectFieldWide} ${styles.selectFieldWider}`}>
                <MultiSelectDropdown
                  options={formationOptions}
                  value={formations}
                  onChange={(v) =>
                    onParamsChange({ formation: v.length > 0 ? v.join(",") : undefined, page: undefined })
                  }
                  placeholder="Toutes les formations"
                />
              </div>
            </div>

            {(collabStatuses.length > 0 || formations.length > 0) && (
              <div className={filterStyles.tagsRow}>
                {collabStatuses.map((status) => (
                  <Tag
                    key={status}
                    pressed
                    nativeButtonProps={{
                      onClick: () =>
                        onParamsChange({
                          collab_status: collabStatuses.filter((s) => s !== status).join(",") || undefined,
                          page: undefined,
                        }),
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
                      onClick: () =>
                        onParamsChange({
                          formation: formations.filter((v) => v !== f).join(",") || undefined,
                          page: undefined,
                        }),
                    }}
                  >
                    {f}
                  </Tag>
                ))}
                <button
                  type="button"
                  className={filterStyles.resetButton}
                  onClick={() => onParamsChange({ collab_status: undefined, formation: undefined, page: undefined })}
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {searchInput ? (
        <CfaSearchResults
          data={searchData}
          isLoading={isSearchLoading}
          sort={searchSort}
          order={searchOrder}
          onSort={onSearchSort}
          onToggleRupture={handleToggleRupture}
          onPageChange={onSearchPageChange}
        />
      ) : (
        <section className={`${cardStyles.card} ${cardStyles.cardWithMargin}`}>
          <div className={cardStyles.cardHeader}>
            <h2 className={cardStyles.cardTitle}>Jeunes en rupture</h2>
            <span className={cardStyles.cardCount}>
              {total} effectif{total !== 1 ? "s" : ""}
            </span>
          </div>

          {effectifs.length === 0 ? (
            <p className={cardStyles.emptyMessage}>
              {isRuptureLoading ? "Chargement…" : "Aucun effectif en rupture ne correspond à votre recherche."}
            </p>
          ) : (
            <>
              <CfaRuptureTable effectifs={effectifs} sort={sort} order={order} onSort={handleSort} />
              {totalPages > 1 && (
                <div className={cardStyles.paginationContainer}>
                  <Pagination
                    key={`${ruptureData?.pagination.page}-${total}`}
                    count={totalPages}
                    defaultPage={ruptureData?.pagination.page ?? 1}
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
            </>
          )}
        </section>
      )}

      <div className={styles.infoBox}>
        <h2 className={styles.infoBoxTitle}>
          <i className={`fr-icon-info-fill ${styles.infoBoxIcon}`} aria-hidden="true" />
          Pourquoi certains de mes apprenants ne sont pas visibles dans la liste des effectifs en rupture ?
        </h2>
        <p className={styles.infoBoxContent}>
          Différents paramètres peuvent expliquer pourquoi vous ne retrouvez pas un jeune dans la liste de vos effectifs
          en rupture comme par exemple :
        </p>
        <ul className={styles.infoBoxContent}>
          <li>
            Un délai de mise à jour entre votre ERP et notre affichage <em>(maximum 24h de délai)</em>
          </li>
          <li>
            Une donnée manquante ou renseignée avec une erreur dans l&apos;ERP{" "}
            <em>(ex : date de rupture, date de fin de formation...)</em>
          </li>
        </ul>
        <p className={styles.infoBoxContent}>
          Vous pouvez toutefois retrouver vos effectifs et indiquer leur statut &quot;En rupture&quot; pour les afficher
          dans votre liste en allant dans l&apos;onglet <strong>Tous les effectifs</strong>.
        </p>
        <Button priority="secondary" linkProps={{ href: "/cfa/effectifs" }}>
          Voir tous les effectifs
        </Button>
      </div>

      <CfaDeclareDateRuptureModal
        effectifName={selectedEffectif ? `${selectedEffectif.prenom} ${selectedEffectif.nom}` : ""}
        onConfirm={handleDeclareRupture}
      />
    </div>
  );
}
