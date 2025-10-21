"use client";

import Image from "next/image";

import { FTHeader } from "@/app/_components/france-travail/FTHeader";

import styles from "./FranceTravailClient.module.css";

export default function FranceTravailClient() {
  return (
    <>
      <FTHeader />
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
    </>
  );
}
