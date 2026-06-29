"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useIsModalOpen } from "@codegouvfr/react-dsfr/Modal/useIsModalOpen";
import { useCallback, useState } from "react";
import { ICfaToInvite } from "shared/models/routes/mission-locale/missionLocale.api";

import { useAuth } from "@/app/_context/UserContext";
import { publicConfig } from "@/config.public";

import { CfaInvitationEmailPreview } from "./CfaInvitationEmailPreview";

const modal = createModal({
  id: "invite-cfa",
  isOpenedByDefault: false,
});

type Status = "idle" | "loading" | "error";

interface InviteCfaModalProps {
  cfa: ICfaToInvite | null;
  onConfirm: (note: string) => Promise<void>;
}

export function InviteCfaModal({ cfa, onConfirm }: InviteCfaModalProps) {
  const { user } = useAuth();
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [showPreview, setShowPreview] = useState(false);

  const resetState = useCallback(() => {
    setNote("");
    setStatus("idle");
    setShowPreview(false);
  }, []);

  useIsModalOpen(modal, { onConceal: resetState });

  const handleConfirm = async () => {
    setStatus("loading");
    try {
      await onConfirm(note);
      modal.close();
      resetState();
    } catch {
      setStatus("error");
    }
  };

  const sendButton = {
    children: status === "loading" ? "Envoi en cours..." : "Envoyer l'invitation",
    doClosesModal: false,
    priority: "primary" as const,
    onClick: handleConfirm,
    disabled: status === "loading",
    iconId: "fr-icon-send-plane-fill",
    iconPosition: "right" as const,
  };

  const buttons = showPreview
    ? [
        {
          children: "Modifier le message",
          doClosesModal: false,
          priority: "secondary" as const,
          onClick: () => setShowPreview(false),
          iconId: "fr-icon-arrow-left-line",
          iconPosition: "left" as const,
        },
        sendButton,
      ]
    : [
        {
          children: "Prévisualiser l'email",
          doClosesModal: false,
          priority: "secondary" as const,
          onClick: () => setShowPreview(true),
          iconId: "fr-icon-eye-line",
          iconPosition: "right" as const,
        },
        sendButton,
      ];

  return (
    <modal.Component
      size="large"
      title={
        showPreview
          ? "Aperçu de l'email envoyé au CFA"
          : `Invitez le CFA ${cfa?.nom ?? ""} à utiliser le Tableau de bord`
      }
      buttons={buttons as [any, ...any[]]}
    >
      {publicConfig.env !== "production" && user?.email && (
        <Alert
          severity="warning"
          small
          className="fr-mb-2w"
          description={
            <>
              Environnement de test (<strong>{publicConfig.env}</strong>) : cette invitation ne sera pas envoyée au CFA,
              mais à votre adresse <strong>{user.email}</strong>.
            </>
          }
        />
      )}
      {showPreview ? (
        <CfaInvitationEmailPreview
          nbJeunesRupture={cfa?.nb_jeunes_rupture ?? 0}
          mlNom={user?.organisation?.nom ?? ""}
          conseillerPrenom={user?.prenom ?? ""}
          conseillerNom={user?.nom ?? ""}
          note={note}
          nbMl={cfa?.ml_partenaires?.count ?? 0}
          mlNoms={cfa?.ml_partenaires?.noms ?? []}
          destinataireNom={cfa?.destinataire_nom ?? null}
        />
      ) : (
        <>
          <p>
            L’invitation sera envoyée directement au CFA. Nous avons préparé un message automatique que vous pouvez
            compléter avec une note ou votre message de recommandation si vous le souhaitez.
          </p>
          <Input
            textArea
            label="Ajoutez un mot de recommandation à votre invitation (facultatif)"
            nativeTextAreaProps={{
              id: "invite-cfa-note",
              rows: 4,
              placeholder: "Écrivez votre message ici...",
              value: note,
              onChange: (e) => setNote(e.target.value),
            }}
          />
        </>
      )}
      {status === "error" && <p className="fr-error-text">Une erreur est survenue. Veuillez réessayer.</p>}
    </modal.Component>
  );
}

export { modal as inviteCfaModal };
