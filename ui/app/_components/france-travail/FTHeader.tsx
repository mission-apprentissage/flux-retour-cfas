"use client";

import Image from "next/image";
import { TOUS_LES_SECTEURS_CODE } from "shared/constants/franceTravail";

import { DepartementButtonGroup } from "./DepartementButtonGroup";
import styles from "./FTHeader.module.css";
import { IDepartementCountsResponse } from "./types";

interface FTHeaderProps {
  secteurLabel?: string | null;
  codeSecteur?: number | null;
  departementsOptions?: { value: string; label: string }[];
  selectedDepartements?: string[];
  onDepartementsChange?: (departements: string[]) => void;
  totalCount?: number;
  departementCounts?: IDepartementCountsResponse;
  isLoadingCounts?: boolean;
}

export const FTHeader = ({
  secteurLabel,
  codeSecteur,
  departementsOptions = [],
  selectedDepartements = [],
  onDepartementsChange,
  departementCounts = {},
  isLoadingCounts = false,
}: FTHeaderProps) => {
  const title = secteurLabel || "Liste des jeunes inscrits en CFA sans contrat | À traiter";
  const showTousLesSecteurs = codeSecteur === TOUS_LES_SECTEURS_CODE;
  const isEffectifsTraites = secteurLabel === "Dossiers traités";

  return (
    <div className={styles.headerContainer}>
      <div className={styles.titleContainer}>
        <h2 className={`fr-h2 ${styles.title}`}>{title}</h2>
      </div>

      {showTousLesSecteurs && (
        <div className={styles.infoContainer}>
          <p className={styles.infoText}>
            Nous affichons sur le Tableau de bord, tous les jeunes ayant un statut d&apos;inscrit en CFA mais sans
            contrat en entreprise, en les classant par date d&apos;inscription en formation (du plus récent au plus
            ancien). <br />
            Source : CFA
          </p>
          {departementsOptions.length > 0 && onDepartementsChange && (
            <div className={styles.filterContainer}>
              <DepartementButtonGroup
                label="Par département :"
                options={departementsOptions}
                value={selectedDepartements}
                onChange={onDepartementsChange}
                departementCounts={departementCounts}
                isLoadingCounts={isLoadingCounts}
              />
            </div>
          )}
          <div className={styles.imageWrapper}>
            <Image
              src="/images/france-travail-select-secteur.png"
              alt="Illustration - Sélectionner un secteur d'activité"
              fill
              style={{ objectFit: "contain" }}
            />
          </div>
        </div>
      )}

      {!showTousLesSecteurs && departementsOptions.length > 0 && onDepartementsChange && (
        <div className={styles.filterContainer}>
          <DepartementButtonGroup
            label="Par département :"
            options={departementsOptions}
            value={selectedDepartements}
            onChange={onDepartementsChange}
            departementCounts={departementCounts}
            isLoadingCounts={isLoadingCounts}
          />
        </div>
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
