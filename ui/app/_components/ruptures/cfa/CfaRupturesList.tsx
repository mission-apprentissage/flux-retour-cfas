"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { useCallback, useMemo, useState } from "react";

import { MultiSelectDropdown } from "@/app/_components/common/MultiSelectDropdown";
import type {
  CfaCollaborationStatus,
  ICfaEffectif,
  ICfaEffectifsResponse,
  ICfaRuptureEffectif,
  ICfaRuptureSegment,
} from "@/common/types/cfaRuptures";
import { COLLAB_STATUS_LABELS } from "@/common/types/cfaRuptures";

import { CfaDeclareDateRuptureModal, declareDateRuptureModal } from "./CfaDeclareDateRuptureModal";
import { CfaRuptureSegment } from "./CfaRuptureSegment";
import styles from "./CfaRupturesList.module.css";
import { CfaSearchResults } from "./CfaSearchResults";
import { useDeclareCfaRupture } from "./hooks";

interface CfaRupturesListProps {
  segments: ICfaRuptureSegment[];
  organismeId: string;
  searchInput: string;
  onSearchChange: (value: string) => void;
  searchData: ICfaEffectifsResponse | undefined;
  isSearchLoading: boolean;
  searchSort: string;
  searchOrder: "asc" | "desc";
  onSearchSort: (sortKey: string) => void;
  onPageChange: (page: number) => void;
}

function filterEffectifs(
  effectifs: ICfaRuptureEffectif[],
  collabStatuses: CfaCollaborationStatus[],
  formations: string[]
): ICfaRuptureEffectif[] {
  return effectifs.filter((e) => {
    if (collabStatuses.length > 0 && !collabStatuses.includes(e.collab_status)) return false;
    if (formations.length > 0 && !formations.includes(e.libelle_formation)) return false;
    return true;
  });
}

export function CfaRupturesList({
  segments,
  organismeId,
  searchInput,
  onSearchChange,
  searchData,
  isSearchLoading,
  searchSort,
  searchOrder,
  onSearchSort,
  onPageChange,
}: CfaRupturesListProps) {
  const [collabStatuses, setCollabStatuses] = useState<CfaCollaborationStatus[]>([]);
  const [formations, setFormations] = useState<string[]>([]);
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

  const formationOptions = useMemo(() => {
    const allFormations = new Set<string>();
    for (const segment of segments) {
      for (const e of segment.effectifs) {
        if (e.libelle_formation) allFormations.add(e.libelle_formation);
      }
    }
    return Array.from(allFormations)
      .sort((a, b) => a.localeCompare(b, "fr"))
      .map((f) => ({ value: f, label: f }));
  }, [segments]);

  const collabOptions = useMemo(
    () => Object.entries(COLLAB_STATUS_LABELS).map(([value, label]) => ({ value, label })),
    []
  );

  const filteredSegments = useMemo(
    () =>
      searchInput
        ? segments
        : segments.map((seg) => ({
            ...seg,
            effectifs: filterEffectifs(seg.effectifs, collabStatuses, formations),
          })),
    [segments, searchInput, collabStatuses, formations]
  );

  return (
    <div>
      <div className={styles.filtersSection}>
        <div className={styles.searchField}>
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
            <div className={styles.filtersRow}>
              <span className={styles.filterLabel}>Filtrer</span>
              <div className={`${styles.selectField} ${styles.selectFieldWide}`}>
                <MultiSelectDropdown
                  options={collabOptions}
                  value={collabStatuses}
                  onChange={(v) => setCollabStatuses(v as CfaCollaborationStatus[])}
                  placeholder="Statut de la collaboration avec la ML"
                />
              </div>

              <div className={`${styles.selectField} ${styles.selectFieldWide}`}>
                <MultiSelectDropdown
                  options={formationOptions}
                  value={formations}
                  onChange={setFormations}
                  placeholder="Toutes les formations"
                />
              </div>
            </div>

            {(collabStatuses.length > 0 || formations.length > 0) && (
              <div className={styles.tagsRow}>
                {collabStatuses.map((status) => (
                  <Tag
                    key={status}
                    pressed
                    nativeButtonProps={{
                      onClick: () => setCollabStatuses((prev) => prev.filter((s) => s !== status)),
                    }}
                  >
                    {COLLAB_STATUS_LABELS[status]}
                  </Tag>
                ))}
                {formations.map((f) => (
                  <Tag
                    key={f}
                    pressed
                    nativeButtonProps={{
                      onClick: () => setFormations((prev) => prev.filter((v) => v !== f)),
                    }}
                  >
                    {f}
                  </Tag>
                ))}
                <button
                  type="button"
                  className={styles.resetButton}
                  onClick={() => {
                    setCollabStatuses([]);
                    setFormations([]);
                  }}
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
          onPageChange={(page) => {
            onPageChange(page);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      ) : (
        filteredSegments.map((seg) => (
          <CfaRuptureSegment key={seg.segment} segment={seg.segment} effectifs={seg.effectifs} />
        ))
      )}

      <div className={styles.infoBox}>
        <h2 className={styles.infoBoxTitle}>
          <i className={`fr-icon-info-fill ${styles.infoBoxIcon}`} aria-hidden="true" />
          Pourquoi certains de mes apprenants ne sont pas visibles dans la liste des effectifs en rupture ?
        </h2>
        <p className={styles.infoBoxContent}>
          Différents paramètres peuvent expliquer pourquoi vous ne retrouvez pas un jeune dans la liste de vos effectifs
          en rupture comme par exemple :
          <ul>
            <li>
              Un délai de mise à jour entre votre ERP et notre affichage <em>(maximum 24h de délai)</em>
            </li>
            <li>
              Une donnée manquante ou renseignée avec une erreur dans l&apos;ERP{" "}
              <em>(ex : date de rupture, date de fin de formation...)</em>
            </li>
          </ul>
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
