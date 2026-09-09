"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { IEffectifMissionLocale } from "shared";

import { Skeleton } from "@/app/_components/common/Skeleton";
import styles from "@/app/_components/ruptures/cfa/collaboration/CollaborationForm.module.css";
import { useCfaEffectifDetail } from "@/app/_components/ruptures/cfa/collaboration/hooks";
import { CollaborationTunnel } from "@/app/_components/ruptures/cfa/collaboration/tunnel/CollaborationTunnel";
import { usePlausibleAppTracking } from "@/app/_hooks/plausible";
import { dePrenom } from "@/app/_utils/ruptures.utils";

import pageStyles from "./CollaborationFormPage.module.css";

export default function CollaborationFormPage({ id }: { id: string }) {
  const { data, isLoading } = useCfaEffectifDetail(id);
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const snapshotRef = useRef<IEffectifMissionLocale["effectif"] | null>(null);
  const { trackPlausibleEvent } = usePlausibleAppTracking();

  const handleSuccess = useCallback(() => {
    if (data?.effectif) {
      snapshotRef.current = data.effectif;
    }
    setShowModal(true);
    trackPlausibleEvent("cfa_form_confirmation_vue");
  }, [data, trackPlausibleEvent]);

  const effectif = data?.effectif;
  const alreadySent = effectif?.organisme_data?.acc_conjoint === true;
  const shouldRedirect = !isLoading && !showModal && effectif && alreadySent;

  useEffect(() => {
    if (shouldRedirect) {
      router.replace(`/cfa/${id}`);
    }
  }, [shouldRedirect, id, router]);

  if (isLoading || !data || shouldRedirect) {
    return (
      <div className={pageStyles.page}>
        <Skeleton height={400} />
      </div>
    );
  }

  const modalEffectif = snapshotRef.current ?? effectif;
  const mlName = modalEffectif?.mission_locale_organisation?.nom;
  const prenom = modalEffectif?.prenom;
  const nom = modalEffectif?.nom;

  return (
    <>
      {effectif ? (
        <CollaborationTunnel effectif={effectif} onSuccess={handleSuccess} onCancel={() => router.back()} />
      ) : (
        <div className={pageStyles.page}>
          <p>Effectif introuvable.</p>
        </div>
      )}

      {showModal && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="modal-success-title">
          <div className={styles.modalCard}>
            <div className={styles.modalCheckIcon}>
              <span className={`fr-icon-checkbox-circle-line ${pageStyles.iconeSucces}`} aria-hidden="true" />
            </div>
            <p id="modal-success-title" className={styles.modalText}>
              Le dossier <span className={styles.modalHighlight}>{dePrenom(`${prenom} ${nom}`)}</span> a bien été envoyé
              à la{" "}
              <span className={styles.modalHighlight}>{mlName ? `Mission Locale ${mlName}` : "Mission Locale"}</span>
            </p>
            <div className={styles.modalActions}>
              <Button onClick={() => router.push(`/cfa/${id}`)}>Voir le dossier</Button>
              <Button priority="tertiary no outline" onClick={() => router.push("/cfa")}>
                Retour à tous les effectifs
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
