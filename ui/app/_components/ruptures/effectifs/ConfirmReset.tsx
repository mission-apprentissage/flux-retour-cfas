"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { _post } from "@/common/httpClient";

import styles from "./ConfirmReset.module.css";

const myModal = createModal({
  id: "reset-effectif",
  isOpenedByDefault: false,
});

type Status = "idle" | "loading" | "success" | "error";

export function ConfirmReset({ onSuccess, onError }: { onSuccess?: () => void; onError?: (error: unknown) => void }) {
  const params = useParams();
  const router = useRouter();

  const mlId = params?.id as string | undefined;
  const effectifId = params?.effectifId as string | undefined;

  const [status, setStatus] = useState<Status>("idle");

  async function handleConfirm() {
    setStatus("loading");
    try {
      await _post("/api/v1/admin/mission-locale/effectif/reset", {
        mission_locale_id: mlId,
        effectif_id: effectifId,
      });
      setStatus("success");

      onSuccess?.();
    } catch (error) {
      setStatus("error");
      onError?.(error);
      console.error("Reset failed:", error);
    }
  }

  const buttons = (() => {
    if (status === "idle" || status === "loading") {
      return [
        {
          children: "Annuler",
          doClosesModal: true,
          priority: "secondary" as const,
        },
        {
          children: status === "loading" ? "Réinitialisation..." : "Ok",
          doClosesModal: false,
          priority: "primary" as const,
          onClick: handleConfirm,
          disabled: status === "loading",
        },
      ];
    }
    if (status === "success") {
      return [
        {
          children: "Fermer",
          doClosesModal: true,
          priority: "secondary" as const,
        },
      ];
    }
    if (status === "error") {
      return [
        {
          children: "Fermer",
          doClosesModal: true,
          priority: "secondary" as const,
        },
        {
          children: "Réessayer",
          doClosesModal: false,
          priority: "primary" as const,
          onClick: handleConfirm,
        },
      ];
    }
    return [];
  })();

  function renderModalContent() {
    switch (status) {
      case "success":
        return (
          <div className={styles.modalContainerWithMargin}>
            <p className={`${styles.modalTitle} ${styles.successText}`}>Réinitialisation effectuée !</p>
            <p className={styles.modalDescription}>Les données de suivi ont bien été réinitialisées.</p>
            <Button
              onClick={() => {
                myModal.close();
                router.push(`/admin/mission-locale/${mlId}`);
              }}
            >
              Retour à la liste
            </Button>
          </div>
        );
      case "error":
        return (
          <div className={styles.modalContainerWithMargin}>
            <p className={`${styles.modalTitle} ${styles.errorText}`}>Échec de la réinitialisation</p>
            <p className={styles.modalDescription}>
              Impossible de réinitialiser les données. Veuillez réessayer ou contacter le support si le problème
              persiste.
            </p>
          </div>
        );
      default:
        return (
          <div className={styles.modalContainer}>
            <p className={styles.modalTitle}>Voulez-vous vraiment réinitialiser cet effectif&nbsp;?</p>
            <p className={styles.modalDescription}>Toutes les données de suivi seront réinitialisées.</p>
          </div>
        );
    }
  }

  return (
    <>
      <myModal.Component
        title="Réinitialisation de l'effectif"
        buttons={buttons.length > 0 ? (buttons as [any, ...any[]]) : undefined}
      >
        {renderModalContent()}
      </myModal.Component>

      <Button
        size="small"
        priority="secondary"
        onClick={() => {
          setStatus("idle");
          myModal.open();
        }}
      >
        Réinitialiser
      </Button>
    </>
  );
}
