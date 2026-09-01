"use client";

import SearchBar from "@codegouvfr/react-dsfr/SearchBar";
import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { useMemo } from "react";

import { PostalCodeOption } from "@/app/_utils/ruptures.utils";

import { VillesFilter } from "../../shared/ui/VillesFilter";

import { libelleCritere, MlCritere, MlCriteresFilter } from "./MlCriteresFilter";
import styles from "./MlListeFilters.module.css";

interface MlListeFiltersProps {
  recherche: string;
  onRechercheChange: (valeur: string) => void;
  villesOptions: PostalCodeOption[];
  codesPostaux: string[];
  onCodesPostauxChange: (valeur: string[]) => void;
  criteres: MlCritere[];
  onCriteresChange: (valeur: MlCritere[]) => void;
  onReinitialiser: () => void;
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
  onReinitialiser,
}: MlListeFiltersProps) {
  const etiquettes = useMemo(
    () => [
      ...codesPostaux.map((codePostal) => ({
        cle: `ville-${codePostal}`,
        libelle: villesOptions.find(({ value }) => value === codePostal)?.label ?? codePostal,
        retirer: () => onCodesPostauxChange(codesPostaux.filter((valeur) => valeur !== codePostal)),
      })),
      ...criteres.map((critere) => ({
        cle: `critere-${critere}`,
        libelle: libelleCritere(critere),
        retirer: () => onCriteresChange(criteres.filter((valeur) => valeur !== critere)),
      })),
    ],
    [codesPostaux, villesOptions, criteres, onCodesPostauxChange, onCriteresChange]
  );

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
        <span className={styles.filterLabel}>Filtrer</span>
        <VillesFilter options={villesOptions} value={codesPostaux} onChange={onCodesPostauxChange} />
        <MlCriteresFilter value={criteres} onChange={onCriteresChange} />
      </div>
      {etiquettes.length > 0 && (
        <div className={styles.tagsRow}>
          {etiquettes.map(({ cle, libelle, retirer }) => (
            <Tag key={cle} dismissible nativeButtonProps={{ onClick: retirer }}>
              {libelle}
            </Tag>
          ))}
          <button type="button" className={styles.resetButton} onClick={onReinitialiser}>
            Réinitialiser les filtres
          </button>
        </div>
      )}
    </div>
  );
}
