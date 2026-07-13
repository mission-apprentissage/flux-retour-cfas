"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { useMemo, useState } from "react";
import { CFA_SUIVI_CATEGORY } from "shared/models/routes/organismes/cfa";
import type { CfaSuiviCategory } from "shared/models/routes/organismes/cfa";

import { MultiSelectDropdown } from "@/app/_components/common/MultiSelectDropdown";
import type { CfaCollaborationStatus, ICfaSuiviMissionLocaleResponse } from "@/common/types/cfaRuptures";
import { ACTIVE_COLLAB_STATUS_LABELS, CFA_COLLAB_STATUS } from "@/common/types/cfaRuptures";

import { CfaCollaborationBadge } from "./CfaCollaborationBadge";
import { CfaCollaborationsTable } from "./CfaCollaborationsTable";
import filterStyles from "./CfaFilters.module.css";
import cardStyles from "./CfaRuptureSegment.module.css";
import { CfaSuiviEmptyState } from "./CfaSuiviEmptyState";
import { CfaSuiviExportButton } from "./CfaSuiviExportButton";
import styles from "./CfaSuiviMissionLocale.module.css";
import { highlightHorsCollab } from "./collabFilterLabel";
import { useSortablePagination } from "./hooks";

interface CfaCollaborationsListProps {
  data: ICfaSuiviMissionLocaleResponse | null;
  organismeId: string;
  category: CfaSuiviCategory;
  onCategoryChange: (category: CfaSuiviCategory) => void;
  searchInput: string;
  onSearchChange: (value: string) => void;
  sort: string;
  order: "asc" | "desc";
  collabStatusFilter?: string;
  formationFilter?: string;
  onParamsChange: (updates: Record<string, string | undefined>) => void;
}

const SECTION_TITLES: Record<CfaSuiviCategory, string> = {
  [CFA_SUIVI_CATEGORY.COLLAB]: "Vos collaborations",
  [CFA_SUIVI_CATEGORY.HORS_COLLAB]: "Jeunes contactés par les Missions Locales",
  [CFA_SUIVI_CATEGORY.TOUS]: "Tous les jeunes suivis par une Mission Locale",
};

function HorsCollabNotice() {
  const [isExpanded, setIsExpanded] = useState(true);
  return (
    <div className={styles.horsCollabNotice}>
      <p className={styles.horsCollabNoticeHeader}>
        <i className="fr-icon-info-fill" aria-hidden="true" />
        Les jeunes ci-dessous ont été contactés en dehors d&apos;une collaboration
        <button
          type="button"
          className={styles.horsCollabNoticeToggle}
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((v) => !v)}
        >
          Pourquoi ?
          <i className={isExpanded ? "fr-icon-arrow-up-s-line" : "fr-icon-arrow-down-s-line"} aria-hidden="true" />
        </button>
      </p>
      {isExpanded && (
        <div className={styles.horsCollabNoticeContent}>
          <p className="fr-mb-1v">
            À partir de 45 jours après le rupture de contrat d’apprentissage, si le jeune est toujours en rupture son
            dossier est envoyé automatiquement à sa Mission Locale de rattachement. Le jeune peut donc avoir été
            contacté par une Mission Locale en dehors du cadre de la collaboration.
          </p>
          <p className={`fr-mb-0 ${styles.horsCollabNoticeTags}`}>
            Ces jeunes sont identifiés par les étiquettes :
            <CfaCollaborationBadge status={CFA_COLLAB_STATUS.CONTACTE_PAR_ML_HORS_COLLAB} effectifId="" inline />
          </p>
        </div>
      )}
    </div>
  );
}

export function CfaCollaborationsList({
  data,
  organismeId,
  category,
  onCategoryChange,
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

  const collabOptions = useMemo(
    () =>
      Object.entries(ACTIVE_COLLAB_STATUS_LABELS).map(([value, label]) => ({
        value,
        label: label as string,
        labelNode: highlightHorsCollab(label as string),
      })),
    []
  );
  const formationOptions = useMemo(
    () => (data?.filters.formations ?? []).map((f) => ({ value: f, label: f })),
    [data?.filters.formations]
  );

  const hasActiveFilters = collabStatuses.length > 0 || formations.length > 0 || !!searchInput;

  const { handleSort, handlePageChange } = useSortablePagination(sort, order, onParamsChange);

  const counts = data?.counts ?? { collab: 0, hors_collab: 0, tous: 0 };
  const total = data?.pagination.total ?? 0;
  const effectifs = data?.effectifs ?? [];

  const showEmptyState = category === CFA_SUIVI_CATEGORY.COLLAB && counts.collab === 0 && !hasActiveFilters;

  const tabContent = (
    <section>
      <div className={cardStyles.cardHeader}>
        <h2 className={cardStyles.cardTitle}>{SECTION_TITLES[category]}</h2>
        <span className={cardStyles.cardCount}>
          {total} effectif{total !== 1 ? "s" : ""}
        </span>
      </div>

      {category === CFA_SUIVI_CATEGORY.HORS_COLLAB && effectifs.length > 0 && <HorsCollabNotice />}

      {showEmptyState ? (
        <CfaSuiviEmptyState />
      ) : effectifs.length === 0 ? (
        <p className={cardStyles.emptyMessage}>Aucun dossier trouvé.</p>
      ) : (
        <>
          <CfaCollaborationsTable effectifs={effectifs} sort={sort} order={order} onSort={handleSort} />
          {data && data.pagination.totalPages > 1 && (
            <div className={cardStyles.paginationContainer}>
              <Pagination
                key={`${data.pagination.page}-${total}`}
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
        </>
      )}
    </section>
  );

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Suivi Missions Locales</h1>
        {organismeId && (
          <div className={styles.exportButtonWrap}>
            <CfaSuiviExportButton organismeId={organismeId} />
          </div>
        )}
      </div>
      <p className={styles.subtitle}>
        Retrouvez ici les jeunes de votre établissement suivis avec les Missions Locales : les dossiers que vous avez
        envoyés depuis le Tableau de bord, et ceux transmis automatiquement à partir de 45 jours après la rupture.
      </p>

      <div className={filterStyles.filtersSection}>
        <div className={filterStyles.searchField}>
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

        <div className={filterStyles.filtersRow}>
          <span className={filterStyles.filterLabel}>Filtrer</span>
          <div className={filterStyles.selectFieldWide}>
            <MultiSelectDropdown
              options={collabOptions}
              value={collabStatuses}
              onChange={(v) =>
                onParamsChange({ collab_status: v.length > 0 ? v.join(",") : undefined, page: undefined })
              }
              placeholder="Statut suivi ML"
            />
          </div>
          <div className={filterStyles.selectFieldWide}>
            <MultiSelectDropdown
              options={formationOptions}
              value={formations}
              onChange={(v) => onParamsChange({ formation: v.length > 0 ? v.join(",") : undefined, page: undefined })}
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
                {ACTIVE_COLLAB_STATUS_LABELS[status as CfaCollaborationStatus] ?? status}
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
      </div>

      <Tabs
        selectedTabId={category}
        onTabChange={(id) => onCategoryChange(id as CfaSuiviCategory)}
        tabs={[
          {
            tabId: CFA_SUIVI_CATEGORY.COLLAB,
            label: `Collaborations envoyées par le CFA (${counts.collab})`,
          },
          {
            tabId: CFA_SUIVI_CATEGORY.HORS_COLLAB,
            label: `Jeunes contactés hors collaborations (${counts.hors_collab})`,
          },
          {
            tabId: CFA_SUIVI_CATEGORY.TOUS,
            label: `Tous (${counts.tous})`,
          },
        ]}
        className={styles.tabs}
      >
        {tabContent}
      </Tabs>
    </div>
  );
}
