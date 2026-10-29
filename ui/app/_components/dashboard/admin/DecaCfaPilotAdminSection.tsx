"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import { _get, _post } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import { getServerErrorMessage } from "@/common/rateLimit";

import { CheckLine, EligibilityCheck, EtatBadge } from "./EligibilityBadges";
import styles from "./encart-admin.module.scss";

const decaCfaPilotConfirmModal = createModal({
  id: "deca-cfa-pilot-confirm",
  isOpenedByDefault: false,
});

type EligibilityResult = {
  eligible: boolean;
  alreadyActive: boolean;
  checks: {
    exists_with_siret_uai: EligibilityCheck;
    nature: EligibilityCheck;
    not_closed: EligibilityCheck;
    has_effectifs: EligibilityCheck;
    not_already_active: EligibilityCheck;
  };
  organisme: {
    _id: string;
    siret: string;
    uai: string | null;
    nature?: string;
    is_allowed_deca?: boolean | null;
  } | null;
  activationEnCours: boolean;
  contratsFleches: number;
};

type BatchResult = {
  total: number;
  counts: Record<string, number>;
  items: Array<{ input: { siret: string; uai: string }; status: string; error?: string }>;
};

export function DecaCfaPilotAdminSection({ organisme }: { organisme: Organisme }) {
  const [action, setAction] = useState<"activate" | "deactivate" | null>(null);
  const [feedback, setFeedback] = useState<{ severity: "success" | "info" | "error"; message: string } | null>(null);

  const { data, isLoading, isFetching, refetch } = useQuery<EligibilityResult>({
    queryKey: ["admin/organismes/deca-cfa-pilot-eligibility", organisme._id],
    queryFn: () => _get(`/api/v1/admin/organismes/${organisme._id}/deca-cfa-pilot-eligibility`),
    enabled: !!organisme._id,
    refetchInterval: (query) => (query.state.data?.activationEnCours ? 30_000 : false),
  });

  const activateMutation = useMutation({
    mutationFn: (items: Array<{ siret: string; uai: string }>) =>
      _post<{ items: Array<{ siret: string; uai: string }> }, BatchResult>(
        "/api/v1/admin/organismes/deca-cfa-pilot/activate",
        { items }
      ),
  });
  const deactivateMutation = useMutation({
    mutationFn: (items: Array<{ siret: string; uai: string }>) =>
      _post<{ items: Array<{ siret: string; uai: string }> }, BatchResult>(
        "/api/v1/admin/organismes/deca-cfa-pilot/deactivate",
        { items }
      ),
  });

  const checks = data?.checks;
  const eligible = data?.eligible === true;
  const alreadyActive = data?.alreadyActive === true;
  const activationEnCours = data?.activationEnCours === true;
  const contratsFleches = data?.contratsFleches ?? 0;
  const siret = organisme.siret;
  const uai = organisme.uai;

  const openConfirm = useCallback((next: "activate" | "deactivate") => {
    setAction(next);
    setFeedback(null);
    decaCfaPilotConfirmModal.open();
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!action || !siret || !uai) {
      decaCfaPilotConfirmModal.close();
      return;
    }
    const items = [{ siret, uai }];
    try {
      const mutation = action === "activate" ? activateMutation : deactivateMutation;
      const result = await mutation.mutateAsync(items);
      const item = result.items[0];
      const verb = action === "activate" ? "Activation" : "Désactivation";
      const isOk = ["already_active", "deactivated"].includes(item?.status ?? "");
      setFeedback(
        item?.status === "queued"
          ? {
              severity: "info",
              message: "Activation DECA mise en file : le flag sera posé à la fin du job.",
            }
          : {
              severity: isOk ? "success" : "error",
              message: `${verb} DECA-CFA pilot — statut : ${item?.status ?? "erreur"}`,
            }
      );
      decaCfaPilotConfirmModal.close();
      await refetch();
    } catch (err) {
      setFeedback({
        severity: "error",
        message: getServerErrorMessage(err, "Une erreur est survenue"),
      });
      decaCfaPilotConfirmModal.close();
    }
  }, [action, siret, uai, activateMutation, deactivateMutation, refetch]);

  const nomAffiche = organisme.nom || organisme.raison_sociale || siret;

  return (
    <>
      <p className={styles.sectionTitle}>
        <i className="ri-shield-flash-line" aria-hidden="true" />
        Programme DECA-CFA pilot
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
          <CheckLine passed={checks.not_closed.passed}>Établissement ouvert</CheckLine>
          <CheckLine passed={checks.has_effectifs.passed}>
            Effectifs sur années scolaires actives (ERP&nbsp;: {checks.has_effectifs.details?.effectifsErpCount ?? 0},
            DECA&nbsp;: {checks.has_effectifs.details?.effectifsDecaCount ?? 0})
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
            iconId="ri-shield-cross-line"
            onClick={() => openConfirm("deactivate")}
            disabled={!siret || !uai || deactivateMutation.isPending || isFetching}
          >
            Désactiver DECA-CFA pilot
          </Button>
        ) : activationEnCours ? (
          <>
            <Badge severity="info" small>
              Activation en cours
            </Badge>
            <span className={styles.muted}>
              Le job d&apos;activation tourne, jusqu&apos;à plusieurs heures le dimanche soir pendant l&apos;import
              DECA.
            </span>
          </>
        ) : (
          <Button
            priority="primary"
            iconId="ri-shield-check-line"
            onClick={() => openConfirm("activate")}
            disabled={!eligible || !siret || !uai || activateMutation.isPending || isFetching}
            title={!eligible ? "Tous les critères d'éligibilité doivent être satisfaits" : undefined}
          >
            Activer DECA-CFA pilot
          </Button>
        )}
      </div>

      <decaCfaPilotConfirmModal.Component
        title={action === "activate" ? "Activer DECA-CFA pilot" : "Désactiver DECA-CFA pilot"}
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
          ? `Activer le programme DECA-CFA pilot pour ${nomAffiche} (SIRET ${siret}, UAI ${uai ?? "—"}) ? Un job lui rattachera d'abord ses contrats DECA (lieu de formation déclaré ou jeune présent dans son ERP), puis posera le flag is_allowed_deca : les effectifs DECA deviennent visibles côté CFA. La collaboration n'est pas modifiée.`
          : `Désactiver le programme DECA-CFA pilot pour ${nomAffiche} (SIRET ${siret}, UAI ${uai ?? "—"}) ? Le flag is_allowed_deca sera retiré. La collaboration, la date d'activation ML et les snapshots déjà transmis restent inchangés.${
              contratsFleches > 0
                ? ` ${contratsFleches} contrat(s) DECA fléché(s) vers cet établissement ne seront plus affichés par aucun CFA tant que « deca:flechage --refaire --cible ${siret} » n'a pas tourné.`
                : ""
            }`}
      </decaCfaPilotConfirmModal.Component>
    </>
  );
}
