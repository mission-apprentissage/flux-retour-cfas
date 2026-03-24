"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useEffect, useState } from "react";

import { _post } from "@/common/httpClient";

import styles from "./ClassifierFeedbackModal.module.css";

const feedbackModal = createModal({
  id: "classifier-feedback-modal",
  isOpenedByDefault: false,
});

function ScaleSelector({
  label,
  lowLabel,
  highLabel,
  value,
  onChange,
}: {
  label: string;
  lowLabel: string;
  highLabel: string;
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div className={styles.scaleContainer}>
      <p className={styles.scaleLabel}>{label}</p>
      <div className={styles.scaleButtons}>
        {[0, 1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`${styles.scaleButton} ${value === n ? styles.scaleButtonSelected : ""}`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className={styles.scaleGradient} />
      <div className={styles.scaleLabels}>
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

interface ClassifierFeedbackModalProps {
  effectifId: string;
  onClose: () => void;
}

export function ClassifierFeedbackModal({ effectifId, onClose }: ClassifierFeedbackModalProps) {
  const [meilleureReactivite, setMeilleureReactivite] = useState<boolean | null>(null);
  const [confianceIndice, setConfianceIndice] = useState<number | null>(null);
  const [utiliteIndice, setUtiliteIndice] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    setMeilleureReactivite(null);
    setConfianceIndice(null);
    setUtiliteIndice(null);
    setStatus("idle");
  }, [effectifId]);

  const isValid = meilleureReactivite !== null && confianceIndice !== null && utiliteIndice !== null;

  async function handleSubmit() {
    if (!isValid) return;
    setStatus("loading");
    try {
      await _post(`/api/v1/organisation/mission-locale/effectif/${effectifId}`, {
        classifier_feedback: {
          meilleure_reactivite: meilleureReactivite,
          confiance_indice: confianceIndice,
          utilite_indice: utiliteIndice,
        },
      });
      setStatus("success");
      setTimeout(() => {
        feedbackModal.close();
        onClose();
      }, 500);
    } catch {
      setStatus("error");
    }
  }

  return (
    <feedbackModal.Component
      title=""
      concealingBackdrop={false}
      size="large"
      buttons={undefined}
      className={styles.modalWrapper}
    >
      <div className={styles.modalContent}>
        <p className={styles.modalTitle}>
          {"Vous venez de traiter un dossier marqué "}
          <i className="ri-sparkling-fill" style={{ color: "#6A6AF4" }} />
          <span className={styles.contactOpportunLabel}>{" Contact opportun"}</span>
          {"."}
          <br />
          Votre avis sur ces dossiers est important pour le fonctionnement du Tableau de bord.
        </p>

        <div className={styles.questionRow}>
          <p className={styles.questionLabel}>
            Avez-vous remarqué une meilleure réactivité du jeune sur ce dossier par rapport à la moyenne ?
          </p>
          <div className={styles.radioGroup}>
            <label
              className={`${styles.radioButton} ${meilleureReactivite === true ? styles.radioButtonSelected : ""}`}
            >
              <input
                type="radio"
                name="reactivite"
                checked={meilleureReactivite === true}
                onChange={() => setMeilleureReactivite(true)}
                className={styles.radioInput}
              />
              Oui
            </label>
            <label
              className={`${styles.radioButton} ${meilleureReactivite === false ? styles.radioButtonSelected : ""}`}
            >
              <input
                type="radio"
                name="reactivite"
                checked={meilleureReactivite === false}
                onChange={() => setMeilleureReactivite(false)}
                className={styles.radioInput}
              />
              Non
            </label>
          </div>
        </div>

        <div className={styles.scaleRow}>
          <p className={styles.scaleRowLabel}>
            Feriez-vous confiance à cet indice de probabilité de réponse à l&apos;avenir ?
          </p>
          <ScaleSelector
            label=""
            lowLabel="Non, aucune confiance"
            highLabel="Oui, très bonne confiance"
            value={confianceIndice}
            onChange={setConfianceIndice}
          />
        </div>

        <div className={styles.scaleRow}>
          <p className={styles.scaleRowLabel}>
            Cet indice vous semble-t-il utile pour savoir quels jeunes contacter en priorité ?
          </p>
          <ScaleSelector
            label=""
            lowLabel="Non, inutile"
            highLabel="Oui, très utile"
            value={utiliteIndice}
            onChange={setUtiliteIndice}
          />
        </div>

        {status === "error" && <p className={styles.errorText}>Une erreur est survenue. Veuillez réessayer.</p>}

        <div className={styles.submitContainer}>
          <Button onClick={handleSubmit} disabled={!isValid || status === "loading"}>
            {status === "loading" ? "Envoi..." : "Envoyer"}
          </Button>
        </div>
      </div>
    </feedbackModal.Component>
  );
}

export { feedbackModal };
