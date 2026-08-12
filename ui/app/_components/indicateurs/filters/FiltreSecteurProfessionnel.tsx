"use client";

import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import TreeView, { flattenTree } from "react-accessible-treeview";
import { normalize } from "shared";

import { _getUI } from "@/common/httpClient";

import styles from "../indicateurs.module.scss";
import {
  FamilleMetier,
  filterRomeNodesByTerm,
  normalizeRomeNodeInPlace,
  RomeNode,
} from "../secteur-professionnel/arborescence-rome";

import { FiltreOverlayButton } from "./FiltreOverlayButton";

const MINIMUM_CHARS_TO_PERFORM_SEARCH = 3;

export function FiltreSecteurProfessionnel({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: famillesMetiers, isFetching } = useQuery<RomeNode[]>(
    ["arborescence-rome-14-06-2021.json"],
    async () => {
      const familles = await _getUI<FamilleMetier[]>("/arborescence-rome-14-06-2021.json");
      return familles.map((famille) => normalizeRomeNodeInPlace(famille));
    },
    { cacheTime: 99999999 }
  );

  const filteredFamillesMetiers = useMemo(() => {
    if (!famillesMetiers) return [];
    if (searchTerm.length < MINIMUM_CHARS_TO_PERFORM_SEARCH) return famillesMetiers;
    return filterRomeNodesByTerm(famillesMetiers, normalize(searchTerm));
  }, [famillesMetiers, searchTerm]);

  const treeData = useMemo(
    () => flattenTree({ name: "", children: filteredFamillesMetiers }),
    [filteredFamillesMetiers]
  );

  return (
    <FiltreOverlayButton
      buttonLabel="Secteur professionnel"
      badge={value.length}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      panelWidth="42rem"
    >
      <p className={styles.searchPanelTitle}>Sélectionner un domaine ou sous-domaine d’activité</p>
      <Input
        label=""
        nativeInputProps={{
          type: "search",
          placeholder: "Rechercher un secteur professionnel (ex : immobilier, commerce, santé...)",
          value: searchTerm,
          onChange: (event) => setSearchTerm(event.target.value),
        }}
      />
      {searchTerm.length < MINIMUM_CHARS_TO_PERFORM_SEARCH && (
        <p className={styles.searchHint}>
          Merci de renseigner au minimum {MINIMUM_CHARS_TO_PERFORM_SEARCH} caractères pour lancer la recherche
        </p>
      )}

      <button type="button" className="fr-link fr-mt-1w" onClick={() => onChange([])}>
        Réinitialiser la sélection
      </button>

      {!isFetching && searchTerm.length >= MINIMUM_CHARS_TO_PERFORM_SEARCH && treeData.length === 1 && (
        <p className="fr-text--bold fr-mt-3w">Il n’y a aucun résultat pour votre recherche</p>
      )}
      {isFetching && <p className="fr-mt-3w">Chargement…</p>}

      {famillesMetiers && (
        <div className={styles.treeWrapper}>
          <TreeView
            data={treeData}
            aria-label="Secteurs professionnels"
            multiSelect
            propagateSelect
            propagateSelectUpwards
            togglableSelect
            selectedIds={value}
            onNodeSelect={({ treeState }) =>
              onChange(treeState ? Array.from(treeState.selectedIds as Set<string>) : [])
            }
            nodeRenderer={({
              element,
              isBranch,
              isExpanded,
              isSelected,
              isHalfSelected,
              getNodeProps,
              level,
              handleSelect,
              handleExpand,
            }) => (
              <div
                {...getNodeProps({ onClick: handleExpand })}
                className={styles.treeNode}
                style={{ marginLeft: 24 * (level - 1) }}
              >
                {isBranch && (
                  <i
                    className={`${isExpanded ? "fr-icon-arrow-down-s-fill" : "fr-icon-arrow-right-s-fill"} fr-icon--sm ${styles.treeToggle}`}
                    aria-hidden="true"
                  />
                )}
                <Checkbox
                  small
                  className={styles.treeCheckbox}
                  options={[
                    {
                      label: element.name,
                      nativeInputProps: {
                        checked: isSelected,
                        ref: (input: HTMLInputElement | null) => {
                          if (input) input.indeterminate = isHalfSelected;
                        },
                        onChange: () => undefined,
                        onClick: (event) => {
                          handleSelect(event);
                          event.preventDefault();
                          event.stopPropagation();
                        },
                      },
                    },
                  ]}
                />
              </div>
            )}
          />
        </div>
      )}
    </FiltreOverlayButton>
  );
}
