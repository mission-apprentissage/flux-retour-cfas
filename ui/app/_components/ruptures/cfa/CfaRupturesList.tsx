"use client";

import { SearchBar } from "@codegouvfr/react-dsfr/SearchBar";
import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { useMemo, useState } from "react";

import { MultiSelectDropdown } from "@/app/_components/common/MultiSelectDropdown";
import type { CfaCollaborationStatus, ICfaRuptureEffectif, ICfaRuptureSegment } from "@/common/types/cfaRuptures";
import { COLLAB_STATUS_LABELS } from "@/common/types/cfaRuptures";

import { matchesSearchTerm } from "../shared/utils/searchUtils";

import { CfaRuptureSegment } from "./CfaRuptureSegment";
import styles from "./CfaRupturesList.module.css";

interface CfaRupturesListProps {
  segments: ICfaRuptureSegment[];
}

function filterEffectifs(
  effectifs: ICfaRuptureEffectif[],
  search: string,
  collabStatuses: CfaCollaborationStatus[],
  formations: string[]
): ICfaRuptureEffectif[] {
  return effectifs.filter((e) => {
    if (!matchesSearchTerm(e.nom, e.prenom, search)) return false;
    if (collabStatuses.length > 0 && !collabStatuses.includes(e.collab_status)) return false;
    if (formations.length > 0 && !formations.includes(e.libelle_formation)) return false;
    return true;
  });
}

export function CfaRupturesList({ segments }: CfaRupturesListProps) {
  const [search, setSearch] = useState("");
  const [collabStatuses, setCollabStatuses] = useState<CfaCollaborationStatus[]>([]);
  const [formations, setFormations] = useState<string[]>([]);

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
      segments.map((seg) => ({
        ...seg,
        effectifs: filterEffectifs(seg.effectifs, search, collabStatuses, formations),
      })),
    [segments, search, collabStatuses, formations]
  );

  return (
    <div>
      <div className={styles.filtersSection}>
        <div className={styles.searchField}>
          <SearchBar
            label="Rechercher"
            renderInput={({ className, id }) => (
              <input
                id={id}
                className={className}
                placeholder="Vous ne retrouvez pas un jeune ? Cherchez son nom ici"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            )}
          />
        </div>

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
      </div>

      {filteredSegments.map((seg) => (
        <CfaRuptureSegment key={seg.segment} segment={seg.segment} effectifs={seg.effectifs} />
      ))}
    </div>
  );
}
