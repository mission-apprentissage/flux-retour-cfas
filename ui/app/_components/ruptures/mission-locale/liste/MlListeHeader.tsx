"use client";

import { ReactNode, useState } from "react";

import { DsfrLink } from "@/app/_components/link/DsfrLink";

import styles from "./MlListeHeader.module.css";

interface MlListeHeaderProps {
  titre: string;
  intro: ReactNode;
  sources: ReactNode;
  blocTitre: string;
  blocContenu: ReactNode;
}

export function MlListeHeader({ titre, intro, sources, blocTitre, blocContenu }: MlListeHeaderProps) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <div className={styles.header}>
      <h1 className={styles.titre}>{titre}</h1>
      <p className={styles.intro}>{intro}</p>
      <p className={styles.sources}>{sources}</p>
      <DsfrLink
        href="#"
        arrow="none"
        size="sm"
        onClick={(e) => {
          e.preventDefault();
          setOuvert((open) => !open);
        }}
        className={`fr-link--icon-right ${ouvert ? "fr-icon-arrow-up-s-line" : "fr-icon-arrow-down-s-line"}`}
        aria-expanded={ouvert}
      >
        {blocTitre}
      </DsfrLink>
      {ouvert && <div className={styles.blocContenu}>{blocContenu}</div>}
    </div>
  );
}
