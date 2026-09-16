"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import { formatDate } from "@/app/_utils/date.utils";
import { _get, _post } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import { getServerErrorMessage } from "@/common/rateLimit";

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
    collab_suspended_at?: string | null;
    collab_inactivity_email_sent_at?: string | null;
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
  const suspendedAt = data?.organisme?.collab_suspended_at ?? null;
  const inactivityEmailSentAt = data?.organisme?.collab_inactivity_email_sent_at ?? null;
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
        message: `${verb} — statut : ${result?.status ?? "erreur"}`,
      });
      collabV2ConfirmModal.close();
      await refetch();
    } catch (err) {
      setFeedback({
        severity: "error",
        message: getServerErrorMessage(err, "Une erreur est survenue"),
      });
      collabV2ConfirmModal.close();
    }
  }, [action, activateMutation, deactivateMutation, refetch]);

  const nomAffiche = organisme.nom || organisme.raison_sociale || siret;

  return (
    <>
      <p className={styles.sectionTitle}>
        <i className="ri-team-line" aria-hidden="true" />
        Collaboration active
      </p>

      <div className={styles.row}>
        <EtatBadge active={alreadyActive} suspendedAt={suspendedAt} />
        {!uai && <span className={styles.muted}>UAI manquant, activation/désactivation impossible</span>}
      </div>
      {alreadyActive && inactivityEmailSentAt && (
        <span className={styles.muted}>Relance d&apos;inactivité envoyée le {formatDate(inactivityEmailSentAt)}</span>
      )}

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
          <>
            {suspendedAt && (
              <Button
                priority="primary"
                iconId="ri-user-follow-line"
                onClick={() => openConfirm("activate")}
                disabled={!siret || !uai || activateMutation.isPending || isFetching}
              >
                Réactiver
              </Button>
            )}
            <Button
              priority="secondary"
              iconId="ri-user-unfollow-line"
              onClick={() => openConfirm("deactivate")}
              disabled={!siret || !uai || deactivateMutation.isPending || isFetching}
              nativeButtonProps={{ "aria-describedby": "collab-on-hint" }}
            >
              Désactiver
            </Button>
          </>
        ) : (
          <Button
            priority="primary"
            iconId="ri-user-follow-line"
            onClick={() => openConfirm("activate")}
            disabled={!eligible || !siret || !uai || activateMutation.isPending || isFetching}
            title={!eligible ? "Tous les critères d'éligibilité doivent être satisfaits" : undefined}
            nativeButtonProps={{ "aria-describedby": "collab-on-hint" }}
          >
            Activer
          </Button>
        )}
      </div>
      <p id="collab-on-hint" className="fr-hint-text">
        En activant cette option, la Mission Locale ne recevra plus les dossiers avant 45 jours pour les dossiers en
        rupture non collaborés avec le CFA.
      </p>

      <collabV2ConfirmModal.Component
        title={
          action === "activate"
            ? suspendedAt
              ? "Réactiver la collaboration"
              : "Activer la collaboration"
            : "Désactiver la collaboration"
        }
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
          ? suspendedAt
            ? `Réactiver la collaboration pour ${nomAffiche} (SIRET ${siret}, UAI ${uai ?? "—"}) ? La suspension pour inactivité sera levée : les dossiers déjà visibles de la Mission Locale le restent, les nouveaux dossiers en rupture suivront à nouveau le délai de 45 jours.`
            : `Activer la collaboration pour ${nomAffiche} (SIRET ${siret}, UAI ${uai ?? "—"}) ? Le flag is_allowed_collab et la date d'activation ML seront posés. Les dossiers en rupture non collaborés ne seront transmis à la Mission Locale qu'après 45 jours. Les effectifs DECA ne seront PAS rendus visibles (is_allowed_deca non posé).`
          : `Désactiver la collaboration pour ${nomAffiche} (SIRET ${siret}, UAI ${uai ?? "—"}) ? Le flag is_allowed_collab sera retiré et la Mission Locale reverra les dossiers en rupture dès la rupture. Si l'organisme est aussi pilote DECA-CFA, la date d'activation ML et la visibilité DECA sont conservées : seuls les dossiers envoyés explicitement remonteront à la Mission Locale.`}
      </collabV2ConfirmModal.Component>
    </>
  );
}
