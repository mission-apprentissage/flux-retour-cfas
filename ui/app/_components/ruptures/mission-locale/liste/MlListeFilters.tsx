"use client";

import SearchBar from "@codegouvfr/react-dsfr/SearchBar";

import { PostalCodeOption } from "@/app/_utils/ruptures.utils";

import { VillesFilter } from "../../shared/ui/VillesFilter";

import { MlCritere, MlCriteresFilter } from "./MlCriteresFilter";
import styles from "./MlListeFilters.module.css";

interface MlListeFiltersProps {
  recherche: string;
  onRechercheChange: (valeur: string) => void;
  villesOptions: PostalCodeOption[];
  codesPostaux: string[];
  onCodesPostauxChange: (valeur: string[]) => void;
  criteres: MlCritere[];
  onCriteresChange: (valeur: MlCritere[]) => void;
}

/** Recherche par nom/prénom + filtres Villes et Critères priorité. */
export function MlListeFilters({
  recherche,
  onRechercheChange,
  villesOptions,
  codesPostaux,
  onCodesPostauxChange,
  criteres,
  onCriteresChange,
}: MlListeFiltersProps) {
  return (
    <div className={styles.filters}>
      <SearchBar
        className={styles.searchBar}
        label="Rechercher par nom ou prénom"
        renderInput={({ className, id, type }) => (
          <input
            className={className}
            id={id}
            type={type}
            value={recherche}
            placeholder="Rechercher par nom ou prénom"
            onChange={(event) => onRechercheChange(event.target.value)}
          />
        )}
      />
      <div className={styles.filtersRow}>
        <VillesFilter options={villesOptions} value={codesPostaux} onChange={onCodesPostauxChange} />
        <MlCriteresFilter value={criteres} onChange={onCriteresChange} />
      </div>
    </div>
  );
}
