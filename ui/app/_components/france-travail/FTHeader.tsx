"use client";

import styles from "./FTHeader.module.css";

interface FTHeaderProps {
  secteurLabel?: string | null;
}

export const FTHeader = ({ secteurLabel }: FTHeaderProps) => {
  const title = secteurLabel ? `${secteurLabel}` : "Liste des jeunes inscrits en CFA sans contrat | À traiter";

  const isEffectifsTraites = secteurLabel === "Dossiers traités";

  return (
    <div className={styles.headerContainer}>
      <h2 className={`fr-h2 ${styles.title}`}>{title}</h2>
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
