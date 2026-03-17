"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import { useCallback, useMemo, useState } from "react";

import { MultiSelectDropdown } from "@/app/_components/common/MultiSelectDropdown";
import { useAuth } from "@/app/_context/UserContext";
import type { CfaCollaborationStatus, ICfaEffectif, ICfaEffectifsResponse } from "@/common/types/cfaRuptures";
import { COLLAB_STATUS_LABELS, DECA_TOOLTIP_TEXT, EN_RUPTURE_OPTIONS } from "@/common/types/cfaRuptures";

import { CfaDeclareDateRuptureModal, declareDateRuptureModal } from "./CfaDeclareDateRuptureModal";
import styles from "./CfaEffectifsList.module.css";
import { CfaEffectifsTable } from "./CfaEffectifsTable";
import filterStyles from "./CfaFilters.module.css";
import { CfaRuptureInfoModal, ruptureInfoModal } from "./CfaRuptureInfoModal";
import cardStyles from "./CfaRuptureSegment.module.css";
import { useDeclareCfaRupture } from "./hooks";

interface CfaEffectifsListProps {
  data: ICfaEffectifsResponse | null;
  isAllowedDeca: boolean;
  searchInput: string;
  onSearchChange: (value: string) => void;
  sort: string;
  order: "asc" | "desc";
  enRuptureFilter?: string;
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
  enRuptureFilter,
  collabStatusFilter,
  formationFilter,
  onParamsChange,
}: CfaEffectifsListProps) {
  const { user } = useAuth();
  const organismeId = user?.organisation?.organisme_id;
  const { mutateAsync: declareRupture } = useDeclareCfaRupture();
  const [selectedEffectif, setSelectedEffectif] = useState<ICfaEffectif | null>(null);

  const handleToggleRupture = useCallback((effectif: ICfaEffectif) => {
    setSelectedEffectif(effectif);
    if (effectif.en_rupture) {
      ruptureInfoModal.open();
    } else {
      declareDateRuptureModal.open();
    }
  }, []);

  const handleDeclareRupture = useCallback(
    async (dateRupture: string) => {
      if (!organismeId || !selectedEffectif) return;
      try {
        await declareRupture({
          organismeId,
          effectifId: selectedEffectif.id,
          dateRupture,
          source: selectedEffectif.source,
        });
      } catch {
        // Error is handled by the modal (status === "error" state)
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

  const enRuptureValues = useMemo(() => (enRuptureFilter ? [enRuptureFilter] : []), [enRuptureFilter]);

  const formationOptions = useMemo(
    () => (data?.filters.formations ?? []).map((f) => ({ value: f, label: f })),
    [data?.filters.formations]
  );

  const collabOptions = useMemo(
    () => Object.entries(COLLAB_STATUS_LABELS).map(([value, label]) => ({ value, label })),
    []
  );

  const hasActiveFilters = collabStatuses.length > 0 || formations.length > 0 || enRuptureValues.length > 0;

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
        <h1 className={styles.title}>Tous mes effectifs</h1>
        <p className={styles.subtitle}>
          Retrouvez ici la liste de tous les effectifs auxquels le Tableau de Bord a accès grâce à la connexion de votre
          ERP.
          {isAllowedDeca && (
            <>
              {" "}
              Cette liste contient également les effectifs captés par la base de données{" "}
              <strong style={{ color: "var(--text-action-high-blue-france)" }}>DECA</strong>
              <span style={{ marginLeft: "0.25rem" }}>
                <Tooltip kind="hover" title={DECA_TOOLTIP_TEXT} />
              </span>
            </>
          )}
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

          <div className={filterStyles.selectField}>
            <MultiSelectDropdown
              options={EN_RUPTURE_OPTIONS}
              value={enRuptureValues}
              onChange={(v) => onParamsChange({ en_rupture: v[0] || undefined, page: "1" })}
              placeholder="En rupture"
            />
          </div>

          <div className={filterStyles.selectFieldWide}>
            <MultiSelectDropdown
              options={collabOptions}
              value={collabStatuses}
              onChange={(v) =>
                onParamsChange({
                  collab_status: v.length > 0 ? v.join(",") : undefined,
                  page: "1",
                })
              }
              placeholder="Collaboration avec la ML"
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
            {enRuptureValues.map((v) => (
              <Tag
                key={v}
                pressed
                nativeButtonProps={{
                  onClick: () => onParamsChange({ en_rupture: undefined, page: "1" }),
                }}
              >
                En rupture : {v === "oui" ? "Oui" : "Non"}
              </Tag>
            ))}
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
                {COLLAB_STATUS_LABELS[status as CfaCollaborationStatus] ?? status}
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
                  en_rupture: undefined,
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
            <h3 className={cardStyles.cardTitle}>Tous mes effectifs</h3>
            <span className={cardStyles.cardCount}>
              {data.pagination.total} effectif{data.pagination.total !== 1 ? "s" : ""}
            </span>
          </div>

          <CfaEffectifsTable
            effectifs={data.effectifs}
            sort={sort}
            order={order}
            onSort={handleSort}
            onToggleRupture={handleToggleRupture}
          />

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
      <CfaDeclareDateRuptureModal
        effectifName={selectedEffectif ? `${selectedEffectif.prenom} ${selectedEffectif.nom}` : ""}
        onConfirm={handleDeclareRupture}
      />
      <CfaRuptureInfoModal />
    </div>
  );
}
