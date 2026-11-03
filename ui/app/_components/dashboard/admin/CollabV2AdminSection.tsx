"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import { formatDate } from "@/app/_utils/date.utils";
import { _post } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import { getServerErrorMessage } from "@/common/rateLimit";

import { CheckLine, EtatBadge } from "./EligibilityBadges";
import styles from "./encart-admin.module.scss";
import { useCollabV2Eligibility } from "./useCollabV2Eligibility";

const collabV2ConfirmModal = createModal({
  id: "collab-v2-confirm",
  isOpenedByDefault: false,
});

type ActionResult = {
  status: string;
  organismeId?: string;
  error?: string;
};

export function CollabV2AdminSection({ organisme }: { organisme: Organisme }) {
  const [action, setAction] = useState<"activate" | "suspend" | "resume" | null>(null);
  const [feedback, setFeedback] = useState<{ severity: "success" | "error"; message: string } | null>(null);

  const { data, isLoading, isFetching, refetch } = useCollabV2Eligibility(organisme._id);

  const activateMutation = useMutation({
    mutationFn: () =>
      _post<Record<string, never>, ActionResult>(`/api/v1/admin/organismes/${organisme._id}/collab-v2/activate`, {}),
  });
  const suspendMutation = useMutation({
    mutationFn: () =>
      _post<Record<string, never>, ActionResult>(`/api/v1/admin/organismes/${organisme._id}/collab-v2/suspend`, {}),
  });
  const resumeMutation = useMutation({
    mutationFn: () =>
      _post<Record<string, never>, ActionResult>(`/api/v1/admin/organismes/${organisme._id}/collab-v2/resume`, {}),
  });
  const mutations = { activate: activateMutation, suspend: suspendMutation, resume: resumeMutation };
  const verbs = { activate: "Activation", suspend: "Suspension", resume: "Reprise" };
  const isPending = activateMutation.isPending || suspendMutation.isPending || resumeMutation.isPending;

  const checks = data?.checks;
  const eligible = data?.eligible === true;
  const alreadyActive = data?.alreadyActive === true;
  const suspendedAt = data?.organisme?.collab_suspended_at ?? null;
  const inactivityEmailSentAt = data?.organisme?.collab_inactivity_email_sent_at ?? null;
  const siret = organisme.siret;
  const uai = organisme.uai;

  const openConfirm = useCallback((next: "activate" | "suspend" | "resume") => {
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
      const result = await mutations[action].mutateAsync();
      const isOk = ["activated", "already_active", "suspended", "resumed"].includes(result?.status ?? "");
      setFeedback({
        severity: isOk ? "success" : "error",
        message: `${verbs[action]} — statut : ${result?.status ?? "erreur"}`,
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
  }, [action, mutations, refetch]);

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
          <CheckLine passed={checks.not_closed.passed}>Établissement ouvert</CheckLine>
          <CheckLine passed={checks.has_effectifs.passed}>
            Effectifs sur années scolaires actives (ERP&nbsp;: {checks.has_effectifs.details?.effectifsErpCount ?? 0},
            DECA&nbsp;: {checks.has_effectifs.details?.effectifsDecaCount ?? 0})
          </CheckLine>
          <CheckLine passed={checks.deca_visible.passed}>
            Programme DECA-CFA actif, requis dès qu&apos;il y a des effectifs DECA
          </CheckLine>
          <CheckLine passed={checks.has_compte_confirme.passed}>
            Au moins un compte CFA confirmé ({checks.has_compte_confirme.details?.comptesConfirmes ?? 0})
          </CheckLine>
        </div>
      ) : null}
      {!alreadyActive && checks?.deca_visible.details?.decaActif === false && !checks.deca_visible.passed && (
        <span className={styles.muted}>
          Activez d&apos;abord le programme DECA-CFA&nbsp;: la collaboration suivra si le CFA y est éligible.
        </span>
      )}

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
        {alreadyActive && suspendedAt ? (
          <Button
            priority="primary"
            iconId="ri-user-follow-line"
            onClick={() => openConfirm("resume")}
            disabled={isPending || isFetching}
            nativeButtonProps={{ "aria-describedby": "collab-on-hint" }}
          >
            Reprendre
          </Button>
        ) : alreadyActive ? (
          <Button
            priority="secondary"
            iconId="ri-pause-circle-line"
            onClick={() => openConfirm("suspend")}
            disabled={isPending || isFetching}
            nativeButtonProps={{ "aria-describedby": "collab-on-hint" }}
          >
            Suspendre
          </Button>
        ) : (
          <Button
            priority="primary"
            iconId="ri-user-follow-line"
            onClick={() => openConfirm("activate")}
            disabled={!eligible || !siret || !uai || isPending || isFetching}
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
            ? "Activer la collaboration"
            : action === "suspend"
              ? "Suspendre la collaboration"
              : "Reprendre la collaboration"
        }
        buttons={[
          { children: "Annuler", priority: "secondary", doClosesModal: true },
          {
            children: "Confirmer",
            priority: "primary",
            doClosesModal: false,
            disabled: isPending,
            nativeButtonProps: { type: "button" },
            onClick: handleConfirm,
          },
        ]}
      >
        {action === "activate"
          ? `Activer la collaboration pour ${nomAffiche} (SIRET ${siret}, UAI ${uai ?? "—"}) ? Le flag is_allowed_collab et la date d'activation ML seront posés. Les dossiers en rupture non collaborés ne seront transmis à la Mission Locale qu'après 45 jours.`
          : action === "suspend"
            ? `Suspendre la collaboration pour ${nomAffiche} (SIRET ${siret}, UAI ${uai ?? "—"}) ? La Mission Locale reverra les dossiers en rupture dès la rupture. La suspension sera levée automatiquement à la prochaine connexion d'un membre du CFA ou à sa prochaine demande de collaboration, ou manuellement ici.`
            : `Reprendre la collaboration pour ${nomAffiche} (SIRET ${siret}, UAI ${uai ?? "—"}) ? La suspension sera levée : les dossiers déjà visibles de la Mission Locale le restent, les nouveaux dossiers en rupture suivront à nouveau le délai de 45 jours.`}
      </collabV2ConfirmModal.Component>
    </>
  );
}
