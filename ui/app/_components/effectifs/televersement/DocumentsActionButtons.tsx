"use client";

import { createModal } from "@codegouvfr/react-dsfr/Modal";

import { usePlausibleAppTracking } from "@/app/_hooks/plausible";
import { MODEL_EXPORT_LAST_UPDATE } from "@/common/utils/exportUtils";

import { InfoTeleversement } from "./InfoTeleversement";
import styles from "./televersement.module.scss";

const donneesObligatoiresModal = createModal({
  id: "televersement-donnees-obligatoires",
  isOpenedByDefault: false,
});

export function DocumentsActionButtons() {
  const { trackPlausibleEvent } = usePlausibleAppTracking();

  return (
    <>
      <div className={styles.docsRow}>
        <a
          href={`/modele-import-${MODEL_EXPORT_LAST_UPDATE}.xlsx`}
          target="_blank"
          rel="noopener noreferrer"
          className="fr-link"
          onClick={() => trackPlausibleEvent("televersement_clic_telechargement_excel")}
        >
          <i className="fr-icon-download-line fr-icon--sm" aria-hidden="true" /> Télécharger le modèle Excel
        </a>
        <button
          type="button"
          className={`fr-link ${styles.docLink}`}
          onClick={() => {
            trackPlausibleEvent("televersement_clic_modale_donnees_obligatoires");
            donneesObligatoiresModal.open();
          }}
        >
          <i className="fr-icon-eye-line fr-icon--sm" aria-hidden="true" /> Les données obligatoires
        </button>
        <a
          href="https://mission-apprentissage.notion.site/Guide-des-donn-es-57bc2515bac34cee9359e517a504df20"
          target="_blank"
          rel="noopener noreferrer"
          className="fr-link"
          onClick={() => trackPlausibleEvent("televersement_clic_guide_donnees")}
        >
          <i className="fr-icon-book-2-line fr-icon--sm" aria-hidden="true" /> Guide des données
        </a>
        <a
          href="https://www.canva.com/design/DAGcu9l2gjM/tBojycBeRHW5ttGzvS0_BQ/watch?utm_content=D[%E2%80%A6]hare&utm_medium=link2&utm_source=uniquelinks&utlId=haf5a5d7f04"
          target="_blank"
          rel="noopener noreferrer"
          className="fr-link"
          onClick={() => trackPlausibleEvent("televersement_clic_tutoriel_video")}
        >
          <i className="fr-icon-play-circle-line fr-icon--sm" aria-hidden="true" /> Tutoriel en vidéo
        </a>
      </div>
      <donneesObligatoiresModal.Component title="Les données obligatoires à renseigner" size="large">
        <InfoTeleversement />
      </donneesObligatoiresModal.Component>
    </>
  );
}
