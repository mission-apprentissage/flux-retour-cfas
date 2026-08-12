"use client";

import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { IFormationSearchResponse } from "shared";

import { _post } from "@/common/httpClient";

import styles from "../indicateurs.module.scss";

import { FiltreOverlayButton } from "./FiltreOverlayButton";

const MINIMUM_CHARS_TO_PERFORM_SEARCH = 3;

export function FiltreFormationCfd({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: formations, isFetching } = useQuery<IFormationSearchResponse[]>(
    ["formations", searchTerm],
    () => _post("/api/v1/formations/search", { searchTerm }),
    { enabled: searchTerm.length >= MINIMUM_CHARS_TO_PERFORM_SEARCH }
  );

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const toggleCfd = (cfd: string) => {
    onChange(value.includes(cfd) ? value.filter((item) => item !== cfd) : [...value, cfd]);
  };

  return (
    <FiltreOverlayButton
      buttonLabel="Type de formation"
      badge={value.length}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      panelWidth="48rem"
    >
      <p className={styles.searchPanelTitle}>Sélectionner une formation</p>
      <Input
        label=""
        nativeInputProps={{
          ref: inputRef,
          type: "search",
          placeholder: "Intitulé de la formation, Code Formation Diplôme, RNCP(s)",
          value: searchTerm,
          onChange: (event) => setSearchTerm(event.target.value),
        }}
      />
      {searchTerm.length < MINIMUM_CHARS_TO_PERFORM_SEARCH && (
        <p className={styles.searchHint}>
          Merci de renseigner au minimum {MINIMUM_CHARS_TO_PERFORM_SEARCH} caractères pour lancer la recherche
        </p>
      )}
      {!isFetching && searchTerm.length > 0 && formations?.length === 0 && (
        <p className="fr-text--bold fr-mt-3w">Il n’y a aucun résultat pour votre recherche</p>
      )}
      {isFetching && <p className="fr-mt-3w">Recherche en cours…</p>}
      {formations && formations.length > 0 && (
        <div className="fr-table fr-table--sm fr-mt-3w">
          <table>
            <thead>
              <tr>
                <th scope="col">Libellé de la formation</th>
                <th scope="col">
                  CFD{" "}
                  <Tooltip
                    kind="hover"
                    title="Code Formation Diplôme : codification qui concerne l’ensemble des diplômes technologiques et professionnels des ministères certificateurs."
                  />
                </th>
                <th scope="col">
                  RNCP{" "}
                  <Tooltip
                    kind="hover"
                    title="Répertoire national des certifications professionnelles : information à jour sur les diplômes et titres à finalité professionnelle, tenue par France compétences."
                  />
                </th>
                <th scope="col">Date de validité du CFD</th>
              </tr>
            </thead>
            <tbody>
              {formations.map((formation) => (
                <tr key={formation.cfd} className={styles.formationRow} onClick={() => toggleCfd(formation.cfd)}>
                  <td>
                    <Checkbox
                      small
                      className={styles.treeCheckbox}
                      options={[
                        {
                          label: formation.intitule_long || "N/A",
                          nativeInputProps: {
                            checked: value.includes(formation.cfd),
                            onChange: () => toggleCfd(formation.cfd),
                            onClick: (event) => event.stopPropagation(),
                          },
                        },
                      ]}
                    />
                  </td>
                  <td>{formation.cfd}</td>
                  <td>{formation.rncp || "N/A"}</td>
                  <td>
                    {formation.cfd_start_date && formation.cfd_end_date
                      ? `Du ${new Date(formation.cfd_start_date).toLocaleDateString()} au ${new Date(
                          formation.cfd_end_date
                        ).toLocaleDateString()}`
                      : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </FiltreOverlayButton>
  );
}
