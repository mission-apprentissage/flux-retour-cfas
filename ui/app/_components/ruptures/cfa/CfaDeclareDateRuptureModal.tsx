"use client";

import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useState } from "react";

const modal = createModal({
  id: "declare-rupture-cfa",
  isOpenedByDefault: false,
});

type Status = "idle" | "loading" | "success" | "error";

interface CfaDeclareDateRuptureModalProps {
  effectifName: string;
  onConfirm: (dateRupture: string) => Promise<void>;
}

export function CfaDeclareDateRuptureModal({ effectifName, onConfirm }: CfaDeclareDateRuptureModalProps) {
  const [dateRupture, setDateRupture] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const handleConfirm = async () => {
    if (!dateRupture) return;
    setStatus("loading");
    try {
      await onConfirm(dateRupture);
      setStatus("success");
      modal.close();
      resetState();
    } catch {
      setStatus("error");
    }
  };

  const resetState = () => {
    setDateRupture("");
    setStatus("idle");
  };

  const buttons =
    status === "error"
      ? [
          {
            children: "Annuler",
            doClosesModal: true,
            priority: "secondary" as const,
            onClick: resetState,
          },
          {
            children: "Réessayer",
            doClosesModal: false,
            priority: "primary" as const,
            onClick: handleConfirm,
          },
        ]
      : [
          {
            children: "Annuler",
            doClosesModal: true,
            priority: "secondary" as const,
            onClick: resetState,
          },
          {
            children: status === "loading" ? "Enregistrement..." : "Confirmer",
            doClosesModal: false,
            priority: "primary" as const,
            onClick: handleConfirm,
            disabled: !dateRupture || status === "loading",
          },
        ];

  return (
    <modal.Component title="Déclarer cet effectif en rupture" buttons={buttons as [any, ...any[]]}>
      <p>
        Vous allez déclarer <strong>{effectifName}</strong> en rupture de contrat.
      </p>
      <div className="fr-input-group">
        <label className="fr-label" htmlFor="date-rupture-input">
          Date de rupture du contrat
        </label>
        <input
          id="date-rupture-input"
          className="fr-input"
          type="date"
          value={dateRupture}
          onChange={(e) => setDateRupture(e.target.value)}
        />
      </div>
      {status === "error" && <p className="fr-error-text">Une erreur est survenue. Veuillez réessayer.</p>}
    </modal.Component>
  );
}

export { modal as declareDateRuptureModal };
