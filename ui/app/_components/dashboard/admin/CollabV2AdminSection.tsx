"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import { _get, _post } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";

import { CheckLine, EligibilityCheck, EtatBadge } from "./EligibilityBadges";
import styles from "./encart-admin.module.scss";

const collabV2ConfirmModal = createModal({
  id: "collab-v2-confirm",
  isOpenedByDefault: false,
});

type EligibilityResult = {
  eligible: boolean;
  alreadyActive: boolean;
  checks: {
    exists_with_siret_uai: EligibilityCheck;
    nature: EligibilityCheck;
    has_effectifs_erp: EligibilityCheck;
    not_already_active: EligibilityCheck;
  };
  organisme: {
    _id: string;
    siret: string;
    uai: string | null;
    nature?: string;
    is_allowed_collab?: boolean | null;
  } | null;
};

type ActionResult = {
  status: string;
  organismeId?: string;
  error?: string;
};

export function CollabV2AdminSection({ organisme }: { organisme: Organisme }) {
  const [action, setAction] = useState<"activate" | "deactivate" | null>(null);
  const [feedback, setFeedback] = useState<{ severity: "success" | "error"; message: string } | null>(null);

  const { data, isLoading, isFetching, refetch } = useQuery<EligibilityResult>({
    queryKey: ["admin/organismes/collab-v2-eligibility", organisme._id],
    queryFn: () => _get(`/api/v1/admin/organismes/${organisme._id}/collab-v2-eligibility`),
    enabled: !!organisme._id,
  });

  const activateMutation = useMutation({
    mutationFn: () =>
      _post<Record<string, never>, ActionResult>(`/api/v1/admin/organismes/${organisme._id}/collab-v2/activate`, {}),
  });
  const deactivateMutation = useMutation({
    mutationFn: () =>
      _post<Record<string, never>, ActionResult>(`/api/v1/admin/organismes/${organisme._id}/collab-v2/deactivate`, {}),
  });

  const checks = data?.checks;
  const eligible = data?.eligible === true;
  const alreadyActive = data?.alreadyActive === true;
  const siret = organisme.siret;
  const uai = organisme.uai;

  const openConfirm = useCallback((next: "activate" | "deactivate") => {
    setAction(next);
    setFeedback(null);
    collabV2ConfirmModal.open();
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!action) {
      collabV2ConfirmModal.close();
      return;
    }
    try {
      const mutation = action === "activate" ? activateMutation : deactivateMutation;
      const result = await mutation.mutateAsync();
      const verb = action === "activate" ? "Activation" : "Désactivation";
      const isOk = ["activated", "already_active", "deactivated"].includes(result?.status ?? "");
      setFeedback({
        severity: isOk ? "success" : "error",
        message: `${verb} collaboration v2 — statut : ${result?.status ?? "erreur"}`,
      });
      collabV2ConfirmModal.close();
      await refetch();
    } catch (err: any) {
      setFeedback({
        severity: "error",
        message: err?.json?.data?.message || "Une erreur est survenue",
      });
      collabV2ConfirmModal.close();
    }
  }, [action, activateMutation, deactivateMutation, refetch]);

  const nomAffiche = organisme.nom || organisme.raison_sociale || siret;

  return (
    <>
      <p className={styles.sectionTitle}>
        <i className="ri-team-line" aria-hidden="true" />
        Collaboration v2 (ERP, sans visibilité DECA)
      </p>

      <div className={styles.row}>
        <EtatBadge active={alreadyActive} />
        {!uai && <span className={styles.muted}>UAI manquant, activation/désactivation impossible</span>}
      </div>

      {isLoading ? (
        <span className={styles.muted}>Calcul de l&apos;éligibilité…</span>
      ) : checks ? (
        <div className={styles.checks}>
          <CheckLine passed={checks.exists_with_siret_uai.passed}>Présent en base avec SIRET et UAI</CheckLine>
          <CheckLine passed={checks.nature.passed}>
            Nature «&nbsp;formateur&nbsp;» / «&nbsp;responsable_formateur&nbsp;» (actuelle&nbsp;:{" "}
            <strong>{checks.nature.details?.natureActuelle ?? "—"}</strong>)
          </CheckLine>
          <CheckLine passed={checks.has_effectifs_erp.passed}>
            Effectifs ERP sur années scolaires actives ({checks.has_effectifs_erp.details?.effectifsErpCount ?? 0})
          </CheckLine>
        </div>
      ) : null}

      {feedback && (
        <Alert
          severity={feedback.severity}
          small
          closable
          onClose={() => setFeedback(null)}
          description={feedback.message}
        />
      )}

      <div className={styles.row}>
        {alreadyActive ? (
          <Button
            priority="secondary"
            iconId="ri-user-unfollow-line"
            onClick={() => openConfirm("deactivate")}
            disabled={!siret || !uai || deactivateMutation.isPending || isFetching}
          >
            Désactiver collaboration v2
          </Button>
        ) : (
          <Button
            priority="primary"
            iconId="ri-user-follow-line"
            onClick={() => openConfirm("activate")}
            disabled={!eligible || !siret || !uai || activateMutation.isPending || isFetching}
            title={!eligible ? "Tous les critères d'éligibilité doivent être satisfaits" : undefined}
          >
            Activer collaboration v2
          </Button>
        )}
      </div>

      <collabV2ConfirmModal.Component
        title={action === "activate" ? "Activer collaboration v2" : "Désactiver collaboration v2"}
        buttons={[
          { children: "Annuler", priority: "secondary", doClosesModal: true },
          {
            children: "Confirmer",
            priority: "primary",
            doClosesModal: false,
            disabled: activateMutation.isPending || deactivateMutation.isPending,
            nativeButtonProps: { type: "button" },
            onClick: handleConfirm,
          },
        ]}
      >
        {action === "activate"
          ? `Activer l'interface v2/collaboration pour ${nomAffiche} (SIRET ${siret}, UAI ${uai ?? "—"}) ? Le flag is_allowed_collab et la date d'activation ML seront posés. Les effectifs DECA ne seront PAS rendus visibles (is_allowed_deca non posé).`
          : `Désactiver l'interface v2/collaboration pour ${nomAffiche} (SIRET ${siret}, UAI ${uai ?? "—"}) ? Le flag is_allowed_collab sera retiré. Si l'organisme est aussi pilote DECA-CFA, la date d'activation ML et la visibilité DECA sont conservées.`}
      </collabV2ConfirmModal.Component>
    </>
  );
}
