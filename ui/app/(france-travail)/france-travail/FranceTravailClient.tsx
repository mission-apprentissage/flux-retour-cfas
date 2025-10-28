"use client";

import Image from "next/image";

import { FTHeader } from "@/app/_components/france-travail/FTHeader";
import { useArborescence } from "@/app/_components/france-travail/hooks/useFranceTravailQueries";

import styles from "./FranceTravailClient.module.css";

export default function FranceTravailClient() {
  const { data: arborescenceData, isLoading } = useArborescence();
  const totalEffectifs = arborescenceData?.a_traiter.total ?? 0;
  const hasEffectifs = totalEffectifs > 0;

  return (
    <>
      <FTHeader />
      {!isLoading && !hasEffectifs ? (
        <div className={styles.emptyStateContainer}>
          <div className={styles.emptyStateContent}>
            <i className={`fr-icon-more-fill fr-icon--lg ${styles.emptyStateIcon}`} aria-hidden="true" />
            <p className={styles.emptyStateText}>
              Pour le moment, il n&lsquo;y a pas de dossier de jeunes
              <br />à traiter dans votre région.
            </p>
          </div>
        </div>
      ) : (
        <div className={styles.emptyStateContainer}>
          <div className={styles.emptyStateImageWrapper}>
            <Image
              src="/images/france-travail-select-secteur.png"
              alt="Illustration - Sélectionner un secteur d'activité"
              fill
              style={{ objectFit: "contain" }}
            />
          </div>
        </div>
      )}
    </>
  );
}
