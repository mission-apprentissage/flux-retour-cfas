"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { SUPPORT_PAGE_ACCUEIL } from "shared";

import { _post } from "@/common/httpClient";

import styles from "./Bienvenue.module.css";

const REDIRECT_DELAY_MS = 2500;

type AccountStatus = "CONFIRMED" | "PENDING_ADMIN_VALIDATION" | "PENDING_EMAIL_VALIDATION";

type ActivationResponse = {
  account_status?: AccountStatus;
  validationByGestionnaire?: boolean;
};

function useActivation(activationToken: string | null) {
  const { data, isLoading, isError } = useQuery<ActivationResponse, Error>(
    ["useActivation", activationToken],
    async () => {
      if (!activationToken) {
        throw new Error("Missing activation token");
      }
      return await _post("/api/v1/auth/activation", { activationToken });
    },
    { enabled: Boolean(activationToken), retry: false }
  );

  return {
    isLoading,
    isError,
    account_status: data?.account_status,
    validationByGestionnaire: data?.validationByGestionnaire,
  };
}

export default function BienvenueClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activationToken = searchParams?.get("activationToken") ?? null;

  const { isLoading, isError, account_status, validationByGestionnaire } = useActivation(activationToken);

  useEffect(() => {
    if (account_status === "CONFIRMED") {
      const timeout = setTimeout(() => router.push("/auth/connexion"), REDIRECT_DELAY_MS);
      return () => clearTimeout(timeout);
    }
  }, [account_status, router]);

  const showError = !activationToken || isError;

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        {!showError && isLoading && <LoadingState />}
        {showError && <ErrorState />}
        {!showError && account_status === "PENDING_ADMIN_VALIDATION" && (
          <PendingState validationByGestionnaire={Boolean(validationByGestionnaire)} />
        )}
        {!showError && account_status === "CONFIRMED" && <ConfirmedState />}

        <a href="/" className={`fr-link fr-link--icon-left fr-icon-arrow-left-line ${styles.homeLink}`}>
          Retour à l&apos;accueil
        </a>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div role="status" aria-live="polite">
      <div className={styles.iconWrap}>
        <div className={styles.loadingSpinner} aria-hidden />
      </div>
      <h1 className={styles.title}>Confirmation de votre compte</h1>
      <p className={styles.lead}>Nous validons votre lien d&apos;activation, merci de patienter quelques instants…</p>
    </div>
  );
}

function ErrorState() {
  return (
    <>
      <div className={`${styles.iconWrap} ${styles.iconWrapError}`}>
        <i className={`${fr.cx("fr-icon-close-circle-fill")} ${styles.icon} ${styles.iconError}`} aria-hidden />
      </div>
      <h1 className={styles.title}>Ce lien n&apos;est plus valide</h1>
      <p className={styles.lead}>
        Le lien d&apos;activation a expiré ou a déjà été utilisé. Contactez-nous en précisant votre adresse courriel
        pour qu&apos;un administrateur puisse vous aider.
      </p>
      <div className={styles.actions}>
        <Button linkProps={{ href: SUPPORT_PAGE_ACCUEIL, target: "_blank", rel: "noopener noreferrer" }}>
          Contacter le support
        </Button>
        <Button priority="secondary" linkProps={{ href: "/auth/connexion" }}>
          Aller à la connexion
        </Button>
      </div>
    </>
  );
}

function PendingState({ validationByGestionnaire }: { validationByGestionnaire: boolean }) {
  return (
    <>
      <div className={`${styles.iconWrap} ${styles.iconWrapPending}`}>
        <i className={`${fr.cx("fr-icon-time-line")} ${styles.icon} ${styles.iconPending}`} aria-hidden />
      </div>
      <h1 className={styles.title}>Votre compte est en attente de validation</h1>
      <p className={styles.lead}>
        {validationByGestionnaire ? (
          <>
            Pour des raisons de sécurité, un{" "}
            <span className={styles.leadStrong}>gestionnaire de votre organisation</span> va examiner votre demande.
          </>
        ) : (
          <>
            Pour des raisons de sécurité, un <span className={styles.leadStrong}>administrateur</span> va examiner votre
            demande.
          </>
        )}
      </p>
      <Alert
        className={styles.alert}
        severity="info"
        small
        description="Vous serez notifié(e) par courriel dès que votre demande sera validée. Pensez à vérifier vos courriers indésirables."
      />
    </>
  );
}

function ConfirmedState() {
  return (
    <>
      <div className={`${styles.iconWrap} ${styles.iconWrapSuccess}`}>
        <i className={`${fr.cx("fr-icon-checkbox-circle-fill")} ${styles.icon} ${styles.iconSuccess}`} aria-hidden />
      </div>
      <h1 className={styles.title}>Votre compte est validé</h1>
      <p className={styles.lead}>Bienvenue sur le Tableau de bord de l&apos;apprentissage.</p>
      <div className={styles.redirectRow} role="status" aria-live="polite">
        <span className={styles.redirectSpinner} aria-hidden />
        Redirection vers la page de connexion…
      </div>
    </>
  );
}
