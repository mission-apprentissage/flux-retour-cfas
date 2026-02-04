"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { IDecaFeedbackApi } from "shared/models/routes/mission-locale/MissionLocaleEffectif";

import "./DecaFeedbackModal.global.css";
import styles from "./DecaFeedbackModal.module.css";

const modal = createModal({
  id: "deca-feedback-modal",
  isOpenedByDefault: false,
});

interface DecaFeedbackModalProps {
  isOpen: boolean;
  onSubmit: (data: IDecaFeedbackApi) => void;
  onClose: () => void;
  isSubmitting?: boolean;
}

export function DecaFeedbackModal({ isOpen, onSubmit, onClose, isSubmitting = false }: DecaFeedbackModalProps) {
  const [differencesRemarquees, setDifferencesRemarquees] = useState<boolean | null>(null);
  const [pretRecevoirDeca, setPretRecevoirDeca] = useState<number | null>(null);
  const wasOpenRef = useRef(false);
  const isClosingProgrammaticallyRef = useRef(false);

  const resetForm = useCallback(() => {
    setDifferencesRemarquees(null);
    setPretRecevoirDeca(null);
  }, []);

  useEffect(() => {
    if (isOpen) {
      resetForm();
      modal.open();
      wasOpenRef.current = true;
      isClosingProgrammaticallyRef.current = false;
    } else if (wasOpenRef.current) {
      isClosingProgrammaticallyRef.current = true;
      modal.close();
      wasOpenRef.current = false;
    }
  }, [isOpen, resetForm]);

  useEffect(() => {
    const modalElement = document.getElementById("deca-feedback-modal");
    if (!modalElement) return;

    const handleDsfrConceal = () => {
      if (wasOpenRef.current && !isClosingProgrammaticallyRef.current) {
        wasOpenRef.current = false;
        onClose();
      }
    };

    modalElement.addEventListener("dsfr.conceal", handleDsfrConceal);
    return () => {
      modalElement.removeEventListener("dsfr.conceal", handleDsfrConceal);
    };
  }, [onClose]);

  const isFormValid = differencesRemarquees !== null && pretRecevoirDeca !== null;

  const handleSubmit = () => {
    if (differencesRemarquees === null || pretRecevoirDeca === null) return;

    onSubmit({
      differences_remarquees: differencesRemarquees,
      pret_recevoir_deca: pretRecevoirDeca,
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <modal.Component
      title=""
      concealingBackdrop={true}
      topAnchor={false}
      size="large"
      buttons={[
        {
          onClick: handleClose,
          children: "Annuler",
          priority: "secondary",
          disabled: isSubmitting,
          doClosesModal: false,
        },
        {
          onClick: handleSubmit,
          children: isSubmitting ? "Envoi..." : "Envoyer",
          disabled: !isFormValid || isSubmitting,
          doClosesModal: false,
        },
      ]}
    >
      <div className={styles.container}>
        <p className={styles.intro}>
          <span className={styles.arrow}>→</span> Vous venez de traiter un dossier directement issu de{" "}
          <strong>DECA</strong>
          <br />
          Votre avis sur ces dossiers est important pour l&apos;avenir du Tableau de Bord.
        </p>

        <div className={styles.questionsGrid}>
          <div className={styles.questionRow}>
            <p className={styles.questionLabel}>
              Avez-vous remarqué de grandes différences entre les dossiers issus de DECA et les autres ?
            </p>
            <div className={styles.answerContainer}>
              <RadioButtons
                legend=""
                name="differences-remarquees"
                orientation="horizontal"
                options={[
                  {
                    label: "Oui",
                    nativeInputProps: {
                      checked: differencesRemarquees === true,
                      onChange: () => setDifferencesRemarquees(true),
                    },
                  },
                  {
                    label: "Non",
                    nativeInputProps: {
                      checked: differencesRemarquees === false,
                      onChange: () => setDifferencesRemarquees(false),
                    },
                  },
                ]}
              />
            </div>
          </div>

          <div className={styles.questionRow}>
            <p className={styles.questionLabel}>
              Seriez-vous prêt·e à recevoir d&apos;autres dossiers DECA à l&apos;avenir ?
            </p>
            <div className={styles.answerContainer}>
              <div className={styles.scaleContainer}>
                <div className={styles.scaleButtons}>
                  {[0, 1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`${styles.scaleButton} ${pretRecevoirDeca === value ? styles.scaleButtonActive : ""}`}
                      onClick={() => setPretRecevoirDeca(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <div className={styles.scaleGradient} />
                <div className={styles.scaleLabels}>
                  <span>Je ne veux plus de dossiers issus de DECA à l&apos;avenir</span>
                  <span>Je suis prêt·e à traiter des dossiers DECA sans problème</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Alert
          severity="info"
          small
          description={`Cette enquête sera présente uniquement jusqu'au 15 février 2026.`}
          className={styles.notice}
        />
      </div>
    </modal.Component>
  );
}
