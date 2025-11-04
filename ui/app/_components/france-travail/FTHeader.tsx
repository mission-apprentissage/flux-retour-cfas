"use client";

import { DepartementMultiSelect } from "./DepartementMultiSelect";
import styles from "./FTHeader.module.css";

interface FTHeaderProps {
  secteurLabel?: string | null;
  departementsOptions?: { value: string; label: string }[];
  selectedDepartements?: string[];
  onDepartementsChange?: (departements: string[]) => void;
  totalCount?: number;
}

export const FTHeader = ({
  secteurLabel,
  departementsOptions = [],
  selectedDepartements = [],
  onDepartementsChange,
  totalCount,
}: FTHeaderProps) => {
  const title = secteurLabel ? `${secteurLabel}` : "Liste des jeunes inscrits en CFA sans contrat | À traiter";

  const isEffectifsTraites = secteurLabel === "Dossiers traités";

  return (
    <div className={styles.headerContainer}>
      <div className={styles.titleContainer}>
        <h2 className={`fr-h2 ${styles.title}`}>{title}</h2>
        {totalCount !== undefined && (
          <span className={styles.badge}>
            {totalCount} effectif{totalCount > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {departementsOptions.length > 0 && onDepartementsChange && (
        <div className={styles.filterContainer}>
          <DepartementMultiSelect
            label="Filtrer par département"
            options={departementsOptions}
            value={selectedDepartements}
            onChange={onDepartementsChange}
            placeholder="Tous les départements"
          />
        </div>
      )}

      {!secteurLabel && (
        <p className={styles.description}>
          Nous affichons sur le Tableau de bord, tous les jeunes ayant un statut d&apos;inscrit en CFA mais sans contrat
          en entreprise, en les classant par date d&apos;inscription en formation (du plus récent au plus ancien).{" "}
          <br />
          Source : CFA
        </p>
      )}
      {isEffectifsTraites && (
        <p className={styles.description}>
          Retrouvez ici les dossiers de tous les jeunes inscrits en CFA sans contrat à la rentrée qui ont été contactés
          par les agents France Travail dans votre région. Cette liste présente les dossiers des jeunes par ordre
          chronologique, en premier le dossier qui a été traité le plus récemment.
        </p>
      )}
    </div>
  );
};
