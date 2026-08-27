"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { useState } from "react";
import { ML_TRI_COLONNE } from "shared/constants";

import { MlCard } from "@/app/_components/card/MlCard";
import type { MlListeEffectif } from "@/common/types/ruptures";

import type { NomListeFusionnee } from "./hooks";
import { MlEffectifsTable } from "./MlEffectifsTable";
import { MlListeDownloadButton } from "./MlListeDownloadButton";
import styles from "./MlListePanel.module.css";
import type { MlTriEtat } from "./tri";

interface MlListePanelProps {
  titre: string;
  nomListe: NomListeFusionnee;
  effectifs: MlListeEffectif[];
  getRowLink: (effectif: MlListeEffectif) => string;
  /** distingue « liste vide » de « aucun résultat » */
  filtresActifs: boolean;
  videTitre: string;
  videSousTitre?: string;
  videImage?: string;
  tri?: MlTriEtat | null;
  onTri?: (colonne: ML_TRI_COLONNE) => void;
}

export function MlListePanel({
  titre,
  nomListe,
  effectifs,
  getRowLink,
  filtresActifs,
  videTitre,
  videSousTitre,
  videImage = "/images/mission-locale-not-treated.svg",
  tri,
  onTri,
}: MlListePanelProps) {
  const [erreurTelechargement, setErreurTelechargement] = useState<string | null>(null);

  if (effectifs.length === 0 && !filtresActifs) {
    return <MlCard title={videTitre} subtitle={videSousTitre} imageSrc={videImage} imageAlt="" />;
  }

  return (
    <div className={styles.panel}>
      {erreurTelechargement && (
        <Alert
          closable
          description={erreurTelechargement}
          onClose={() => setErreurTelechargement(null)}
          severity="error"
          title="Une erreur s'est produite"
          classes={{ root: "fr-mb-2w" }}
        />
      )}
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitre}>{titre}</h2>
        <div className={styles.panelActions}>
          <span className={styles.compteur}>
            {effectifs.length} jeune{effectifs.length > 1 ? "s" : ""}
          </span>
          <MlListeDownloadButton nomListe={nomListe} onError={setErreurTelechargement} />
        </div>
      </div>
      <MlEffectifsTable
        effectifs={effectifs}
        getRowLink={getRowLink}
        emptyMessage="Aucun dossier ne correspond à votre recherche."
        tri={tri}
        onTri={onTri}
      />
    </div>
  );
}
