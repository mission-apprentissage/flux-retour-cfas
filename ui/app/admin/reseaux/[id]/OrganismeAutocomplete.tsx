"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { OrganismeSupportInfoJson } from "shared";

import { _get } from "@/common/httpClient";

import styles from "./reseau-organismes.module.scss";

const MIN_QUERY_LENGTH = 3;

export interface OrganismeSearchResult extends OrganismeSupportInfoJson {
  _id: string;
  reseaux?: string[];
}

export function OrganismeAutocomplete({ onSelect }: { onSelect: (organisme: OrganismeSearchResult) => void }) {
  const [inputValue, setInputValue] = useState("");
  const [query, setQuery] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const { data, isFetching, error } = useQuery<OrganismeSearchResult[], any>({
    queryKey: ["admin", "reseaux", "organismes", "search", query],
    queryFn: ({ signal }) => _get(`/api/v1/admin/reseaux/organismes/search/${encodeURIComponent(query)}`, { signal }),
    enabled: query.length >= MIN_QUERY_LENGTH,
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setValidationError(`Entrez au moins ${MIN_QUERY_LENGTH} caractères pour rechercher.`);
      return;
    }
    setValidationError(null);
    setQuery(trimmed);
  };

  const handleSelect = (organisme: OrganismeSearchResult) => {
    onSelect(organisme);
    setInputValue("");
    setQuery("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.searchRow}>
        <Input
          className={styles.searchInput}
          label="Rechercher un organisme par nom, UAI ou SIRET"
          hintText="Exemple : 824362578 00075"
          state={validationError ? "error" : "default"}
          stateRelatedMessage={validationError ?? undefined}
          nativeInputProps={{
            value: inputValue,
            onChange: (event) => setInputValue(event.target.value),
          }}
        />
        <Button type="submit" iconId="fr-icon-search-line" disabled={isFetching}>
          Rechercher
        </Button>
      </div>

      {isFetching && <p className={fr.cx("fr-mt-2w")}>Recherche en cours…</p>}

      {!isFetching && error && (
        <p className={`${fr.cx("fr-mt-2w")} ${styles.searchError}`}>
          La recherche a échoué. Veuillez réessayer ultérieurement.
        </p>
      )}

      {!isFetching && !error && query.length >= MIN_QUERY_LENGTH && (
        <>
          {data && data.length > 0 ? (
            <ul className={styles.searchResults}>
              {data.map((organisme) => (
                <li key={organisme._id}>
                  <button type="button" className={styles.searchResult} onClick={() => handleSelect(organisme)}>
                    <span className={styles.searchResultName}>{organisme.nom}</span>
                    <span className={styles.searchResultDetails}>
                      UAI : {organisme.uai || "inconnu"} | SIRET : {organisme.siret}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className={fr.cx("fr-mt-2w")}>Aucun résultat trouvé.</p>
          )}
        </>
      )}
    </form>
  );
}
